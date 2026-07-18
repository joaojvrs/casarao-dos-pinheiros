import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Action = 'guest_menu' | 'guest_stay' | 'place_guest_order' | 'guest_orders' | 'create_service_request' | 'my_service_requests';

interface OrderItemInput {
  productId: string;
  quantity: number;
  notes?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function code(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function todaySaoPaulo() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

async function getAdmin() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Backend sem configuracao do Supabase.');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getRequestUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function guestMenu(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('restaurant_products')
    .select('id, name, description, sale_price, image_url, restaurant_categories(name)')
    .eq('show_on_guest_menu', true)
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

function toGuestStay(booking: Record<string, unknown>) {
  const today = todaySaoPaulo();
  const status = String(booking.status || '');
  const checkIn = String(booking.check_in || '');
  const checkOut = String(booking.check_out || '');
  const accommodation = first(booking.accommodations as Record<string, unknown> | Record<string, unknown>[] | null);
  const guest = first(booking.guests as Record<string, unknown> | Record<string, unknown>[] | null);
  const assignments = (booking.fd_room_assignments || []) as Array<Record<string, unknown>>;
  const activeAssignment = assignments.find(item => ['checked_in', 'reservado'].includes(String(item.status))) || assignments[0] || null;
  const canOrder = status === 'checked_in' && checkIn <= today && checkOut > today;
  const phase = canOrder ? 'active' : checkOut <= today || ['checked_out', 'completed', 'cancelled', 'no_show'].includes(status) ? 'past' : 'upcoming';

  return {
    bookingId: booking.id,
    confirmationCode: booking.confirmation_code,
    status,
    checkIn,
    checkOut,
    guestsCount: booking.guests_count,
    nights: booking.nights,
    total: booking.total,
    accommodation: {
      id: accommodation?.id || String(booking.accommodation_id || ''),
      name: accommodation?.name || 'Hospedagem Vale do Eden',
      image: accommodation?.id === 'mata'
        ? '/1761873847903-CabanaMata_Vista.jpg'
        : accommodation?.id === 'casarao'
          ? '/1761696197303-Entrada_Casarao.jpg'
          : '/1761997463193-CabanaSuica_Vista.jpg',
    },
    guest: {
      name: guest?.name || 'Hospede',
      email: guest?.email || '',
      phone: guest?.phone || '',
    },
    room: activeAssignment ? {
      number: activeAssignment.quarto_numero,
      status: activeAssignment.status,
      checkinReal: activeAssignment.checkin_real || null,
      checkoutReal: activeAssignment.checkout_real || null,
    } : null,
    canOrder,
    phase,
  };
}

async function getGuestStay(supabase: ReturnType<typeof createClient>, email: string) {
  const today = todaySaoPaulo();
  const { data, error } = await supabase
    .from('bookings')
    .select('id, confirmation_code, accommodation_id, status, check_in, check_out, guests_count, nights, total, accommodations(id, name), guests!inner(name, email, phone), fd_room_assignments(quarto_numero, status, checkin_real, checkout_real)')
    .ilike('guests.email', email)
    .in('status', ['pending', 'confirmed', 'checked_in', 'checked_out', 'completed'])
    .order('check_in', { ascending: true });

  if (error) throw error;

  const bookings = (data || []).filter(item => first(item.guests as Record<string, unknown> | Record<string, unknown>[] | null)?.email);
  const active = bookings.find(item => item.status === 'checked_in' && item.check_in <= today && item.check_out > today);
  const upcoming = bookings.find(item => ['pending', 'confirmed'].includes(item.status) && item.check_out >= today);
  const recentPast = [...bookings].reverse().find(item => ['checked_out', 'completed'].includes(item.status) || item.check_out <= today);
  const selected = active || upcoming || recentPast || null;

  return selected ? toGuestStay(selected as Record<string, unknown>) : null;
}

async function getActiveGuestStayOrThrow(supabase: ReturnType<typeof createClient>, email: string, requestedBookingId?: string) {
  const stay = await getGuestStay(supabase, email);
  if (!stay) throw Object.assign(new Error('Nenhuma hospedagem encontrada para esta conta.'), { status: 403 });
  if (requestedBookingId && stay.bookingId !== requestedBookingId) {
    throw Object.assign(new Error('Esta hospedagem nao pertence a sua conta.'), { status: 403 });
  }
  if (!stay.canOrder) {
    throw Object.assign(new Error('Pedidos ficam disponiveis apenas durante a hospedagem ativa, apos o check-in e antes do checkout.'), { status: 403 });
  }
  return stay;
}

async function getGuestOrders(
  supabase: ReturnType<typeof createClient>,
  email: string,
) {
  const stay = await getGuestStay(supabase, email);
  if (!stay) return [];

  const { data, error } = await supabase
    .from('restaurant_orders')
    .select('id, order_number, status, total, notes, created_at, restaurant_order_items(id, name, quantity, unit_price)')
    .eq('booking_id', stay.bookingId)
    .eq('origin', 'guest')
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) throw error;
  return data || [];
}

async function placeGuestOrder(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userEmail: string,
  payload: Record<string, unknown>,
) {
  const items = (payload.items || []) as OrderItemInput[];
  const deliveryLocation = String(payload.deliveryLocation || '').trim();
  const notesRaw = String(payload.notes || '').trim();
  const combinedNotes = [
    deliveryLocation ? `Entregar em: ${deliveryLocation}` : '',
    notesRaw,
  ].filter(Boolean).join(' · ') || null;

  const stay = await getActiveGuestStayOrThrow(supabase, userEmail, String(payload.bookingId || ''));
  const roomName = String(payload.roomName || deliveryLocation || stay.room?.number || stay.accommodation.name || 'Hospede').trim();

  if (!Array.isArray(items) || items.length === 0) throw new Error('Inclua pelo menos um item no pedido.');

  // Resolve or create the guest's table
  const tableCode = `GUEST-${userId.slice(0, 8).toUpperCase()}`;
  const { data: table, error: tableError } = await supabase
    .from('restaurant_tables')
    .upsert({ code: tableCode, location: roomName, active: true }, { onConflict: 'code' })
    .select('id')
    .single();
  if (tableError) throw tableError;

  // Find open tab or create one
  const { data: existingTab } = await supabase
    .from('restaurant_tabs')
    .select('id, code, subtotal')
    .eq('table_id', table.id)
    .in('status', ['open', 'pending_payment'])
    .maybeSingle();

  let tab = existingTab;
  if (!tab) {
    const { data: newTab, error: tabError } = await supabase
      .from('restaurant_tabs')
      .insert({ code: code('CMD'), table_id: table.id, booking_id: stay.bookingId, status: 'open', opened_by: userId })
      .select('id, code, subtotal')
      .single();
    if (tabError) throw tabError;
    tab = newTab;
  }

  // Validate products
  const productIds = items.map(item => item.productId).filter(Boolean);
  const { data: products, error: productError } = await supabase
    .from('restaurant_products')
    .select('id, name, sale_price, stock_quantity, active, show_on_guest_menu')
    .in('id', productIds);
  if (productError) throw productError;

  const productMap = new Map((products || []).map(p => [p.id, p]));
  let orderTotal = 0;

  const orderItems = items.map(item => {
    const product = productMap.get(item.productId);
    if (!product || !product.active || !product.show_on_guest_menu) {
      throw new Error('Produto indisponivel no cardapio.');
    }
    const qty = Number(item.quantity);
    if (qty <= 0) throw new Error('Quantidade invalida.');
    const stockQty = product.stock_quantity;
    if (stockQty !== null && Number(stockQty) > 0 && Number(stockQty) < qty) {
      throw new Error(`Estoque insuficiente para ${product.name}.`);
    }
    const itemTotal = Math.round(qty * Number(product.sale_price));
    orderTotal += itemTotal;
    return { product, quantity: qty, notes: String(item.notes || '').trim() || null, total: itemTotal };
  });

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('restaurant_orders')
    .insert({
      tab_id: tab.id,
      booking_id: stay.bookingId,
      order_number: code('PED'),
      origin: 'guest',
      status: 'new',
      notes: combinedNotes,
      total: orderTotal,
      created_by: userId,
    })
    .select('id, order_number')
    .single();
  if (orderError) throw orderError;

  // Create order items
  const { error: itemError } = await supabase.from('restaurant_order_items').insert(
    orderItems.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.sale_price,
      status: 'new',
      notes: item.notes,
    })),
  );
  if (itemError) throw itemError;

  // Deduct stock (only when stock is being tracked and has quantity)
  for (const item of orderItems) {
    const currentStock = Number(item.product.stock_quantity ?? 0);
    if (currentStock > 0) {
      await supabase
        .from('restaurant_products')
        .update({ stock_quantity: Math.max(0, currentStock - item.quantity), updated_at: new Date().toISOString() })
        .eq('id', item.product.id);
      await supabase.from('restaurant_stock_movements').insert({
        product_id: item.product.id,
        movement_type: 'out',
        quantity: item.quantity,
        unit_cost: 0,
        reason: `Pedido hospede ${order.order_number}`,
        reference_type: 'restaurant_order',
        reference_id: order.id,
        created_by: userId,
      });
    }
  }

  // Update tab total
  const newSubtotal = Number(tab.subtotal || 0) + orderTotal;
  await supabase
    .from('restaurant_tabs')
    .update({ subtotal: newSubtotal, total: newSubtotal, updated_at: new Date().toISOString() })
    .eq('id', tab.id);

  return { orderId: order.id, orderNumber: order.order_number };
}

async function createServiceRequest(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userEmail: string,
  payload: Record<string, unknown>,
) {
  const stay = await getActiveGuestStayOrThrow(supabase, userEmail, String(payload.bookingId || ''));

  const services = Array.isArray(payload.services)
    ? (payload.services as unknown[]).map(item => String(item).trim()).filter(Boolean)
    : [];
  if (services.length === 0) throw new Error('Selecione ao menos um servico de arrumacao.');

  const scheduledTime = String(payload.scheduledTime || '').trim() || null;
  const notes = String(payload.notes || '').trim() || null;
  const roomName = String(payload.roomName || stay.room?.number || stay.accommodation.name || 'Hospede').trim();

  const { data, error } = await supabase
    .from('guest_service_requests')
    .insert({
      booking_id: stay.bookingId,
      created_by: userId,
      guest_name: stay.guest.name,
      room_name: roomName,
      scheduled_time: scheduledTime,
      services,
      notes,
      status: 'pending',
    })
    .select('id, status, scheduled_time, services')
    .single();
  if (error) throw error;

  return { requestId: data.id, status: data.status };
}

async function getMyServiceRequests(supabase: ReturnType<typeof createClient>, email: string) {
  const stay = await getGuestStay(supabase, email);
  if (!stay) return [];
  const { data, error } = await supabase
    .from('guest_service_requests')
    .select('id, scheduled_time, services, notes, status, created_at')
    .eq('booking_id', stay.bookingId)
    .order('created_at', { ascending: false })
    .limit(15);
  if (error) throw error;
  return data || [];
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const body = await req.json() as { action?: Action; payload?: Record<string, unknown> };
    const action = body.action;
    const payload = body.payload || {};
    const supabase = await getAdmin();

    if (action === 'guest_menu') {
      return json({ data: await guestMenu(supabase) });
    }

    if (action === 'guest_stay') {
      const user = await getRequestUser(req, supabase);
      if (!user?.email) return json({ error: 'Sessao invalida. Faca login para acessar sua hospedagem.' }, 401);
      return json({ data: await getGuestStay(supabase, user.email) });
    }

    if (action === 'place_guest_order') {
      const user = await getRequestUser(req, supabase);
      if (!user?.email) return json({ error: 'Sessao invalida. Faca login para fazer pedidos.' }, 401);
      return json({ data: await placeGuestOrder(supabase, user.id, user.email, payload) }, 201);
    }

    if (action === 'guest_orders') {
      const user = await getRequestUser(req, supabase);
      if (!user?.email) return json({ error: 'Sessao invalida.' }, 401);
      return json({ data: await getGuestOrders(supabase, user.email) });
    }

    if (action === 'create_service_request') {
      const user = await getRequestUser(req, supabase);
      if (!user?.email) return json({ error: 'Sessao invalida. Faca login para solicitar arrumacao.' }, 401);
      return json({ data: await createServiceRequest(supabase, user.id, user.email, payload) }, 201);
    }

    if (action === 'my_service_requests') {
      const user = await getRequestUser(req, supabase);
      if (!user?.email) return json({ error: 'Sessao invalida.' }, 401);
      return json({ data: await getMyServiceRequests(supabase, user.email) });
    }

    return json({ error: 'Acao invalida.' }, 400);
  } catch (error) {
    const status = typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : 500;
    const message = error instanceof Error ? error.message : 'Erro inesperado.';
    return json({ error: message }, status);
  }
});
