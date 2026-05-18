import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Action =
  | 'summary'
  | 'update_room_status'
  | 'start_cleaning'
  | 'update_checklist'
  | 'finish_cleaning'
  | 'save_maintenance_order'
  | 'update_maintenance_status'
  | 'save_lost_found'
  | 'update_lost_found_status';

type RoomStatus = 'limpo' | 'sujo' | 'em_limpeza' | 'bloqueado' | 'em_manutencao' | 'ocupado';
type MaintenanceStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
type LostFoundStatus = 'aguardando' | 'notificado' | 'devolvido' | 'descartado';

const ROOM_STATUSES = ['limpo', 'sujo', 'em_limpeza', 'bloqueado', 'em_manutencao', 'ocupado'];
const MAINTENANCE_STATUSES = ['aberta', 'em_andamento', 'concluida', 'cancelada'];
const LOST_FOUND_STATUSES = ['aguardando', 'notificado', 'devolvido', 'descartado'];
const MAINTENANCE_CATEGORIES = ['eletrica', 'hidraulica', 'climatizacao', 'mobiliario', 'outros'];
const MAINTENANCE_PRIORITIES = ['alta', 'media', 'baixa'];

const DEFAULT_CHECKLIST = [
  { id: '1', label: 'Retirada de lençóis e toalhas', done: false, foto_url: null },
  { id: '2', label: 'Limpeza do banheiro completo', done: false, foto_url: null },
  { id: '3', label: 'Aspiração / varredura do piso', done: false, foto_url: null },
  { id: '4', label: 'Limpeza de superfícies e mobiliário', done: false, foto_url: null },
  { id: '5', label: 'Troca de amenidades', done: false, foto_url: null },
  { id: '6', label: 'Verificação e reposição do frigobar', done: false, foto_url: null },
  { id: '7', label: 'Organização de cama e almofadas', done: false, foto_url: null },
  { id: '8', label: 'Inspeção de equipamentos (TV, AC, cofre)', done: false, foto_url: null },
  { id: '9', label: 'Verificação de achados e perdidos', done: false, foto_url: null },
  { id: '10', label: 'Registro fotográfico de anomalias', done: false, foto_url: null },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function compactProfile(profile: { id: string; full_name?: string | null; email?: string | null } | undefined) {
  if (!profile) return null;
  return { id: profile.id, nome: profile.full_name || profile.email || 'Equipe', avatar_url: null };
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

function assertHousekeepingAccess(role: string, permissions: Record<string, boolean>) {
  if (['master', 'admin', 'manager', 'housekeeping'].includes(role)) return;
  if (permissions.housekeeping) return;
  throw Object.assign(new Error('Acesso restrito a governanca.'), { status: 403 });
}

function canManage(role: string) {
  return ['master', 'admin', 'manager'].includes(role);
}

function assertManagerAccess(role: string, permissions: Record<string, boolean>) {
  if (canManage(role) || permissions.housekeeping) return;
  throw Object.assign(new Error('Acesso restrito a gestores da governanca.'), { status: 403 });
}

async function loadProfiles(supabase: ReturnType<typeof createClient>, ids: Array<string | null | undefined>) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean))) as string[];
  if (!uniqueIds.length) return new Map<string, { id: string; full_name: string | null; email: string | null }>();

  const { data, error } = await supabase.from('profiles').select('id, full_name, email').in('id', uniqueIds);
  if (error) throw error;
  return new Map((data || []).map(profile => [profile.id, profile]));
}

async function loadRooms(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.from('hk_rooms').select('*').order('andar').order('numero');
  if (error) throw error;
  const profiles = await loadProfiles(supabase, (data || []).map(room => room.camareira_id));
  return (data || []).map(room => ({ ...room, camareira: compactProfile(profiles.get(room.camareira_id)) }));
}

async function enrichRoom(supabase: ReturnType<typeof createClient>, roomId: string) {
  const { data, error } = await supabase.from('hk_rooms').select('*').eq('id', roomId).single();
  if (error) throw error;
  const profiles = await loadProfiles(supabase, [data.camareira_id]);
  return { ...data, camareira: compactProfile(profiles.get(data.camareira_id)) };
}

async function enrichMaintenance(supabase: ReturnType<typeof createClient>, orders: Array<Record<string, unknown>>) {
  const ids = orders.flatMap(order => [order.responsavel_id as string | null, order.aberta_por as string | null]);
  const roomIds = orders.map(order => order.room_id as string | null).filter(Boolean) as string[];
  const profiles = await loadProfiles(supabase, ids);
  const { data: rooms, error: roomsError } = roomIds.length
    ? await supabase.from('hk_rooms').select('id, numero').in('id', roomIds)
    : { data: [], error: null };
  if (roomsError) throw roomsError;
  const roomMap = new Map((rooms || []).map(room => [room.id, room]));

  const orderIds = orders.map(order => order.id as string);
  const { data: events, error: eventsError } = orderIds.length
    ? await supabase.from('hk_maintenance_events').select('*').in('order_id', orderIds).order('created_at')
    : { data: [], error: null };
  if (eventsError) throw eventsError;
  const eventProfiles = await loadProfiles(supabase, (events || []).map(event => event.feito_por));

  return orders.map(order => ({
    ...order,
    room: roomMap.get(order.room_id as string) || null,
    responsavel: compactProfile(profiles.get(order.responsavel_id as string)),
    events: (events || [])
      .filter(event => event.order_id === order.id)
      .map(event => ({ ...event, feito_por_profile: compactProfile(eventProfiles.get(event.feito_por)) })),
  }));
}

async function enrichLostFound(supabase: ReturnType<typeof createClient>, items: Array<Record<string, unknown>>) {
  const profiles = await loadProfiles(supabase, items.map(item => item.encontrado_por as string | null));
  const roomIds = items.map(item => item.room_id as string | null).filter(Boolean) as string[];
  const { data: rooms, error } = roomIds.length ? await supabase.from('hk_rooms').select('id, numero').in('id', roomIds) : { data: [], error: null };
  if (error) throw error;
  const roomMap = new Map((rooms || []).map(room => [room.id, room]));

  return items.map(item => ({
    ...item,
    room: roomMap.get(item.room_id as string) || null,
    encontrado_por_profile: compactProfile(profiles.get(item.encontrado_por as string)),
  }));
}

async function summary(supabase: ReturnType<typeof createClient>, role: string, userId: string) {
  const { start, end } = todayRange();
  const rooms = await loadRooms(supabase);
  const logsQuery = supabase
    .from('hk_cleaning_logs')
    .select('*')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false });
  if (!canManage(role)) logsQuery.eq('camareira_id', userId);
  const { data: logs, error: logsError } = await logsQuery;
  if (logsError) throw logsError;
  const logProfiles = await loadProfiles(supabase, (logs || []).map(log => log.camareira_id));

  const { data: orders, error: ordersError } = await supabase
    .from('hk_maintenance_orders')
    .select('*')
    .neq('status', 'cancelada')
    .order('aberta_em', { ascending: false });
  if (ordersError) throw ordersError;
  const priorityRank: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
  const sortedOrders = (orders || []).sort((a, b) => {
    const priority = (priorityRank[a.prioridade] ?? 3) - (priorityRank[b.prioridade] ?? 3);
    if (priority !== 0) return priority;
    return new Date(b.aberta_em || b.created_at).getTime() - new Date(a.aberta_em || a.created_at).getTime();
  });

  const { data: lostFound, error: lostError } = await supabase
    .from('hk_lost_found')
    .select('*')
    .order('created_at', { ascending: false });
  if (lostError) throw lostError;

  return {
    rooms,
    cleaning_logs_today: (logs || []).map(log => ({ ...log, camareira: compactProfile(logProfiles.get(log.camareira_id)) })),
    maintenance_orders: await enrichMaintenance(supabase, sortedOrders),
    lost_found: await enrichLostFound(supabase, lostFound || []),
    metrics: {
      quartos_limpos: rooms.filter(room => room.status === 'limpo').length,
      quartos_sujos: rooms.filter(room => room.status === 'sujo').length,
      em_limpeza: rooms.filter(room => room.status === 'em_limpeza').length,
      ocupados: rooms.filter(room => room.status === 'ocupado').length,
      bloqueados: rooms.filter(room => room.status === 'bloqueado').length,
      em_manutencao: rooms.filter(room => room.status === 'em_manutencao').length,
      ordens_abertas: sortedOrders.filter(order => ['aberta', 'em_andamento'].includes(order.status)).length,
      ordens_alta_prioridade: sortedOrders.filter(order => order.prioridade === 'alta' && order.status !== 'concluida').length,
      achados_aguardando: (lostFound || []).filter(item => item.status === 'aguardando').length,
    },
  };
}

async function updateRoomStatus(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const roomId = String(payload.room_id || '');
  const status = String(payload.status || '') as RoomStatus;
  const camareiraId = payload.camareira_id ? String(payload.camareira_id) : null;
  if (!roomId) throw new Error('Quarto nao informado.');
  if (!ROOM_STATUSES.includes(status)) throw new Error('Status de quarto invalido.');
  if (status === 'em_limpeza' && !camareiraId) throw new Error('Informe a camareira para iniciar limpeza.');

  const { data, error } = await supabase
    .from('hk_rooms')
    .update({
      status,
      camareira_id: ['limpo', 'ocupado'].includes(status) ? null : camareiraId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId)
    .select('id')
    .single();
  if (error) throw error;
  return enrichRoom(supabase, data.id);
}

async function startCleaning(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const roomId = String(payload.room_id || '');
  const camareiraId = String(payload.camareira_id || '');
  if (!roomId || !camareiraId) throw new Error('Informe quarto e camareira.');

  const { error: roomError } = await supabase
    .from('hk_rooms')
    .update({ status: 'em_limpeza', camareira_id: camareiraId, updated_at: new Date().toISOString() })
    .eq('id', roomId);
  if (roomError) throw roomError;

  const { data: log, error: logError } = await supabase
    .from('hk_cleaning_logs')
    .insert({
      room_id: roomId,
      camareira_id: camareiraId,
      iniciado_em: new Date().toISOString(),
      checklist: DEFAULT_CHECKLIST,
      status: 'em_andamento',
    })
    .select('*')
    .single();
  if (logError) throw logError;

  return { log, room: await enrichRoom(supabase, roomId) };
}

async function updateChecklist(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const logId = String(payload.log_id || '');
  const checklist = payload.checklist;
  if (!logId) throw new Error('Registro de limpeza nao informado.');
  if (!Array.isArray(checklist)) throw new Error('Checklist invalido.');

  const { data, error } = await supabase
    .from('hk_cleaning_logs')
    .update({ checklist })
    .eq('id', logId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function finishCleaning(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const logId = String(payload.log_id || '');
  const roomId = String(payload.room_id || '');
  const observacao = String(payload.observacao || '').trim() || null;
  if (!logId || !roomId) throw new Error('Registro e quarto sao obrigatorios.');

  const { data: currentLog, error: readError } = await supabase.from('hk_cleaning_logs').select('*').eq('id', logId).single();
  if (readError) throw readError;

  const checklist = Array.isArray(currentLog.checklist) ? currentLog.checklist : [];
  const missing = checklist.filter((item: { done?: boolean }) => !item.done);
  if (missing.length > 0) {
    return json({ error: 'Checklist incompleto.', missing }, 400);
  }

  const { data: log, error: logError } = await supabase
    .from('hk_cleaning_logs')
    .update({ status: 'concluido', concluido_em: new Date().toISOString(), observacao })
    .eq('id', logId)
    .select('*')
    .single();
  if (logError) throw logError;

  const { error: roomError } = await supabase
    .from('hk_rooms')
    .update({ status: 'limpo', camareira_id: null, updated_at: new Date().toISOString() })
    .eq('id', roomId);
  if (roomError) throw roomError;

  return { log, room: await enrichRoom(supabase, roomId) };
}

async function saveMaintenanceOrder(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const id = payload.id ? String(payload.id) : '';
  const categoria = String(payload.categoria || '');
  const descricao = String(payload.descricao || '').trim();
  const prioridade = String(payload.prioridade || 'media');
  if (!MAINTENANCE_CATEGORIES.includes(categoria)) throw new Error('Categoria invalida.');
  if (!MAINTENANCE_PRIORITIES.includes(prioridade)) throw new Error('Prioridade invalida.');
  if (descricao.length < 5) throw new Error('Descreva a ordem de manutencao.');

  const values = {
    room_id: payload.room_id || null,
    local_livre: String(payload.local_livre || '').trim() || null,
    categoria,
    descricao,
    prioridade,
    responsavel_id: payload.responsavel_id || null,
    foto_url: String(payload.foto_url || '').trim() || null,
  };

  let orderId = id;
  if (id) {
    const { data, error } = await supabase.from('hk_maintenance_orders').update(values).eq('id', id).select('id, room_id').single();
    if (error) throw error;
    orderId = data.id;
  } else {
    const { data, error } = await supabase
      .from('hk_maintenance_orders')
      .insert({ ...values, status: 'aberta', aberta_por: userId })
      .select('id, room_id')
      .single();
    if (error) throw error;
    orderId = data.id;
    const { error: eventError } = await supabase.from('hk_maintenance_events').insert({
      order_id: orderId,
      status: 'aberta',
      descricao: 'Ordem aberta',
      feito_por: userId,
    });
    if (eventError) throw eventError;
  }

  if (values.room_id && prioridade === 'alta') {
    const { error } = await supabase.from('hk_rooms').update({ status: 'em_manutencao', updated_at: new Date().toISOString() }).eq('id', values.room_id);
    if (error) throw error;
  }

  const { data: order, error: orderError } = await supabase.from('hk_maintenance_orders').select('*').eq('id', orderId).single();
  if (orderError) throw orderError;
  return (await enrichMaintenance(supabase, [order]))[0];
}

async function updateMaintenanceStatus(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const orderId = String(payload.order_id || '');
  const status = String(payload.status || '') as MaintenanceStatus;
  const descricao = String(payload.descricao || '').trim() || null;
  const resolucao = String(payload.resolucao || '').trim() || null;
  if (!orderId) throw new Error('Ordem nao informada.');
  if (!MAINTENANCE_STATUSES.includes(status)) throw new Error('Status de manutencao invalido.');

  const { data: current, error: currentError } = await supabase.from('hk_maintenance_orders').select('id, room_id').eq('id', orderId).single();
  if (currentError) throw currentError;

  const values: Record<string, unknown> = { status };
  if (status === 'concluida') {
    values.concluida_em = new Date().toISOString();
    values.resolucao = resolucao;
  }

  const { data: order, error } = await supabase.from('hk_maintenance_orders').update(values).eq('id', orderId).select('*').single();
  if (error) throw error;

  if (status === 'concluida' && current.room_id) {
    const { error: roomError } = await supabase.from('hk_rooms').update({ status: 'sujo', updated_at: new Date().toISOString() }).eq('id', current.room_id);
    if (roomError) throw roomError;
  }

  const { error: eventError } = await supabase.from('hk_maintenance_events').insert({
    order_id: orderId,
    status,
    descricao,
    feito_por: userId,
  });
  if (eventError) throw eventError;

  return (await enrichMaintenance(supabase, [order]))[0];
}

async function saveLostFound(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const id = payload.id ? String(payload.id) : '';
  const descricao = String(payload.descricao || '').trim();
  if (descricao.length < 3) throw new Error('Descreva o item encontrado.');

  const values = {
    room_id: payload.room_id || null,
    descricao,
    foto_url: String(payload.foto_url || '').trim() || null,
    local_guarda: String(payload.local_guarda || '').trim() || null,
    hospede_nome: String(payload.hospede_nome || '').trim() || null,
    hospede_contato: String(payload.hospede_contato || '').trim() || null,
    reserva_id: payload.reserva_id || null,
  };

  const query = id
    ? supabase.from('hk_lost_found').update(values).eq('id', id)
    : supabase.from('hk_lost_found').insert({ ...values, encontrado_por: userId, encontrado_em: new Date().toISOString() });

  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return (await enrichLostFound(supabase, [data]))[0];
}

async function updateLostFoundStatus(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const id = String(payload.id || '');
  const status = String(payload.status || '') as LostFoundStatus;
  const devolvidoPara = String(payload.devolvido_para || '').trim() || null;
  if (!id) throw new Error('Item nao informado.');
  if (!LOST_FOUND_STATUSES.includes(status)) throw new Error('Status de achado invalido.');

  const values: Record<string, unknown> = { status };
  if (status === 'notificado') values.notificado_em = new Date().toISOString();
  if (status === 'devolvido') {
    values.devolvido_em = new Date().toISOString();
    values.devolvido_para = devolvidoPara;
  }

  const { data, error } = await supabase.from('hk_lost_found').update(values).eq('id', id).select('*').single();
  if (error) throw error;
  return (await enrichLostFound(supabase, [data]))[0];
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const body = await req.json() as { action?: Action; payload?: Record<string, unknown> };
    const action = body.action;
    const payload = body.payload || {};
    const { supabase, userId, role, permissions } = await getContext(req);
    assertHousekeepingAccess(role, permissions);
    if (!userId) return json({ error: 'Sessao invalida.' }, 401);

    if (action === 'summary') return json({ data: await summary(supabase, role, userId) });
    if (action === 'update_room_status') {
      assertManagerAccess(role, permissions);
      return json({ data: await updateRoomStatus(supabase, payload) });
    }
    if (action === 'start_cleaning') return json({ data: await startCleaning(supabase, payload) }, 201);
    if (action === 'update_checklist') return json({ data: await updateChecklist(supabase, payload) });
    if (action === 'finish_cleaning') {
      const result = await finishCleaning(supabase, payload);
      return result instanceof Response ? result : json({ data: result });
    }
    if (action === 'save_maintenance_order') return json({ data: await saveMaintenanceOrder(supabase, userId, payload) }, 201);
    if (action === 'update_maintenance_status') return json({ data: await updateMaintenanceStatus(supabase, userId, payload) });
    if (action === 'save_lost_found') return json({ data: await saveLostFound(supabase, userId, payload) }, 201);
    if (action === 'update_lost_found_status') return json({ data: await updateLostFoundStatus(supabase, payload) });

    return json({ error: 'Acao invalida.' }, 400);
  } catch (error) {
    const status = typeof (error as { status?: unknown }).status === 'number' ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : 'Erro inesperado na governanca.';
    return json({ error: message }, status);
  }
});
