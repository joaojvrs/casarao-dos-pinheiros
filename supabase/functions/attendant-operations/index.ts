import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Action = 'board' | 'update_order_status' | 'update_request_status';

type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
type RequestStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';

const ORDER_STATUSES: OrderStatus[] = ['new', 'preparing', 'ready', 'delivered', 'cancelled'];
const REQUEST_STATUSES: RequestStatus[] = ['pending', 'in_progress', 'done', 'cancelled'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function todaySaoPaulo() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

async function getContext(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Backend sem configuracao do Supabase.');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: requester, error } = await supabase.auth.getUser(token);
  if (error || !requester.user) return { supabase, userId: null, role: 'visitor', permissions: {} as Record<string, boolean> };

  const role = String(requester.user.app_metadata?.role || 'visitor');
  const permissions = (requester.user.app_metadata?.permissions || {}) as Record<string, boolean>;
  return { supabase, userId: requester.user.id, role, permissions };
}

function assertAttendantAccess(role: string, permissions: Record<string, boolean>) {
  if (['master', 'admin', 'manager', 'attendant'].includes(role)) return;
  if (permissions.roomService) return;
  throw Object.assign(new Error('Acesso restrito a equipe de atendimento.'), { status: 403 });
}

// Active room-service orders that came from the Guest Portal (origin = guest),
// plus anything delivered today so the team keeps context on the shift.
async function loadGuestOrders(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('restaurant_orders')
    .select(`
      id, order_number, status, total, notes, created_at, booking_id,
      restaurant_order_items(id, name, quantity, unit_price),
      restaurant_tabs(id, code, restaurant_tables(location))
    `)
    .eq('origin', 'guest')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) throw error;

  const bookingIds = Array.from(new Set((data || []).map(o => o.booking_id).filter(Boolean))) as string[];
  const guestByBooking = new Map<string, string>();
  if (bookingIds.length) {
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, guests(name)')
      .in('id', bookingIds);
    if (bookingError) throw bookingError;
    for (const booking of bookings || []) {
      const guest = first(booking.guests as Record<string, unknown> | Record<string, unknown>[] | null);
      if (guest?.name) guestByBooking.set(String(booking.id), String(guest.name));
    }
  }

  return (data || []).map(order => {
    const tab = first(order.restaurant_tabs as Record<string, unknown> | Record<string, unknown>[] | null);
    const table = tab ? first(tab.restaurant_tables as Record<string, unknown> | Record<string, unknown>[] | null) : null;
    return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      total: order.total,
      notes: order.notes,
      createdAt: order.created_at,
      bookingId: order.booking_id,
      room: (table?.location as string) || 'Hospede',
      guestName: order.booking_id ? (guestByBooking.get(String(order.booking_id)) || 'Hospede') : 'Hospede',
      items: ((order.restaurant_order_items || []) as Array<Record<string, unknown>>).map(item => ({
        name: item.name, quantity: item.quantity, unitPrice: item.unit_price,
      })),
    };
  });
}

async function loadServiceRequests(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('guest_service_requests')
    .select('id, booking_id, guest_name, room_name, scheduled_time, services, notes, status, created_at')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) throw error;
  return (data || []).map(req => ({
    id: req.id,
    bookingId: req.booking_id,
    guestName: req.guest_name || 'Hospede',
    room: req.room_name || 'Hospede',
    scheduledTime: req.scheduled_time || '',
    services: Array.isArray(req.services) ? req.services : [],
    notes: req.notes || '',
    status: req.status,
    createdAt: req.created_at,
  }));
}

async function board(supabase: ReturnType<typeof createClient>) {
  const today = todaySaoPaulo();
  const [orders, requests] = await Promise.all([
    loadGuestOrders(supabase),
    loadServiceRequests(supabase),
  ]);
  return {
    orders,
    requests,
    metrics: {
      pendingOrders: orders.filter(o => o.status !== 'delivered').length,
      pendingRequests: requests.filter(r => !['done', 'cancelled'].includes(String(r.status))).length,
      deliveredToday: orders.filter(o => o.status === 'delivered' && String(o.createdAt).slice(0, 10) === today).length,
    },
  };
}

async function updateOrderStatus(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const orderId = String(payload.orderId || payload.order_id || '');
  const status = String(payload.status || '') as OrderStatus;
  if (!orderId) throw new Error('Pedido nao informado.');
  if (!ORDER_STATUSES.includes(status)) throw new Error('Status de pedido invalido.');

  const { data, error } = await supabase
    .from('restaurant_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('origin', 'guest')
    .select('id, status')
    .single();
  if (error) throw error;

  await supabase.from('restaurant_order_items').update({ status }).eq('order_id', orderId);
  return data;
}

async function updateRequestStatus(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const requestId = String(payload.requestId || payload.request_id || '');
  const status = String(payload.status || '') as RequestStatus;
  if (!requestId) throw new Error('Solicitacao nao informada.');
  if (!REQUEST_STATUSES.includes(status)) throw new Error('Status de solicitacao invalido.');

  const { data, error } = await supabase
    .from('guest_service_requests')
    .update({ status, handled_by: userId, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('id, status')
    .single();
  if (error) throw error;
  return data;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const body = await req.json() as { action?: Action; payload?: Record<string, unknown> };
    const action = body.action;
    const payload = body.payload || {};
    const { supabase, userId, role, permissions } = await getContext(req);
    assertAttendantAccess(role, permissions);
    if (!userId) return json({ error: 'Sessao invalida.' }, 401);

    if (action === 'board') return json({ data: await board(supabase) });
    if (action === 'update_order_status') return json({ data: await updateOrderStatus(supabase, payload) });
    if (action === 'update_request_status') return json({ data: await updateRequestStatus(supabase, userId, payload) });

    return json({ error: 'Acao invalida.' }, 400);
  } catch (error) {
    const status = typeof (error as { status?: unknown }).status === 'number' ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : 'Erro inesperado no atendimento.';
    return json({ error: message }, status);
  }
});
