import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Action =
  | 'summary'
  | 'get_reservations'
  | 'assign_room'
  | 'checkin'
  | 'checkout'
  | 'no_show'
  | 'cancel_assignment'
  | 'reassign_room'
  | 'emit_key'
  | 'save_guest_profile'
  | 'get_guest_history'
  | 'save_incident';

const ASSIGNMENT_ACTIVE = ['reservado', 'checked_in'];
const KEY_TYPES = ['emitida', 'reemitida', 'devolvida', 'bloqueada'];
const INCIDENT_TYPES = ['reclamacao', 'solicitacao', 'dano', 'extravio', 'elogio', 'seguranca', 'outro'];
const INCIDENT_STATUSES = ['aberto', 'em_tratamento', 'resolvido'];
const PAYMENT_METHODS = ['dinheiro', 'debito', 'credito', 'pix', 'transferencia', 'faturado'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function dateOnly(value: unknown) {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('Data invalida.');
  return text;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.round((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000));
}

function decimal(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error('Valor invalido.');
  return Math.round(number * 100) / 100;
}

function assertOneOf(value: string, values: string[], message: string) {
  if (!values.includes(value)) throw new Error(message);
}

function compactProfile(profile: { id: string; full_name?: string | null; email?: string | null } | undefined) {
  if (!profile) return null;
  return { nome: profile.full_name || profile.email || 'Equipe' };
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
  if (error || !requester.user) return { supabase, userId: null, role: 'visitor', permissions: {} as Record<string, boolean>, authHeader };

  const role = String(requester.user.app_metadata?.role || 'visitor');
  const permissions = (requester.user.app_metadata?.permissions || {}) as Record<string, boolean>;
  return { supabase, userId: requester.user.id, role, permissions, authHeader };
}

function canAccess(role: string, permissions: Record<string, boolean>) {
  return ['attendant', 'master', 'admin', 'manager'].includes(role) || Boolean(permissions.bookings) || Boolean(permissions.guests);
}

function canManage(role: string) {
  return ['master', 'admin', 'manager'].includes(role);
}

function assertAccess(role: string, permissions: Record<string, boolean>) {
  if (canAccess(role, permissions)) return;
  throw Object.assign(new Error('Acesso restrito a recepcao.'), { status: 403 });
}

async function loadProfiles(supabase: ReturnType<typeof createClient>, ids: Array<string | null | undefined>) {
  const unique = Array.from(new Set(ids.filter(Boolean))) as string[];
  if (!unique.length) return new Map<string, { id: string; full_name: string | null; email: string | null }>();
  const { data, error } = await supabase.from('profiles').select('id, full_name, email').in('id', unique);
  if (error) throw error;
  return new Map((data || []).map(profile => [profile.id, profile]));
}

async function invokeFinancial<T>(authHeader: string, action: string, payload: Record<string, unknown>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (!supabaseUrl || !anonKey) throw new Error('Backend sem configuracao para chamar financeiro.');
  const response = await fetch(`${supabaseUrl}/functions/v1/financial-operations`, {
    method: 'POST',
    headers: { Authorization: authHeader, apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Operacao financeira falhou.');
  return body.data as T;
}

async function recalculateFolio(supabase: ReturnType<typeof createClient>, folioId: string) {
  const [itemsResult, paymentsResult] = await Promise.all([
    supabase.from('fin_folio_items').select('centro_custo, valor_total').eq('folio_id', folioId),
    supabase.from('fin_folio_payments').select('valor').eq('folio_id', folioId),
  ]);
  if (itemsResult.error) throw itemsResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const totals = { hospedagem: 0, restaurante: 0, eventos: 0, servicos: 0 };
  for (const item of itemsResult.data || []) {
    totals[item.centro_custo as keyof typeof totals] += Number(item.valor_total || 0);
  }
  const totalPago = (paymentsResult.data || []).reduce((sum, payment) => sum + Number(payment.valor || 0), 0);

  const { error } = await supabase
    .from('fin_folios')
    .update({
      total_hospedagem: decimal(totals.hospedagem),
      total_restaurante: decimal(totals.restaurante),
      total_eventos: decimal(totals.eventos),
      total_servicos: decimal(totals.servicos),
      total_pago: decimal(totalPago),
      updated_at: new Date().toISOString(),
    })
    .eq('id', folioId);
  if (error) throw error;
}

async function ensureCheckinFolio(supabase: ReturnType<typeof createClient>, userId: string, current: Record<string, any>, booking: Record<string, any>, guest: Record<string, any>) {
  const { data: existing, error: existingError } = await supabase
    .from('fin_folios')
    .select('id, status')
    .eq('reserva_id', current.booking_id)
    .neq('status', 'cancelado')
    .maybeSingle();
  if (existingError) throw existingError;

  let folioId = existing?.id as string | undefined;
  if (!folioId) {
    const { data: created, error: createError } = await supabase
      .from('fin_folios')
      .insert({
        reserva_id: current.booking_id,
        hospede_nome: guest.name,
        hospede_email: guest.email,
        quarto: current.quarto_numero,
        checkin: current.checkin_previsto,
        checkout: current.checkout_previsto,
        status: 'aberto',
        created_by: userId,
      })
      .select('id')
      .single();
    if (createError) throw createError;
    folioId = created.id;
  }

  const { data: lodgingItem, error: itemLookupError } = await supabase
    .from('fin_folio_items')
    .select('id')
    .eq('folio_id', folioId)
    .eq('referencia_id', current.booking_id)
    .eq('referencia_tipo', 'reserva')
    .eq('centro_custo', 'hospedagem')
    .maybeSingle();
  if (itemLookupError) throw itemLookupError;

  if (!lodgingItem) {
    const nights = daysBetween(current.checkin_previsto, current.checkout_previsto);
    const { error: itemError } = await supabase.from('fin_folio_items').insert({
      folio_id: folioId,
      centro_custo: 'hospedagem',
      descricao: `Diaria - Quarto ${current.quarto_numero} (${current.hk_rooms.tipo})`,
      quantidade: nights,
      valor_unitario: decimal(Number(booking.lodging_total || 0) / 100 / Math.max(1, nights)),
      referencia_id: current.booking_id,
      referencia_tipo: 'reserva',
      lancado_por: userId,
    });
    if (itemError) throw itemError;
  }

  await recalculateFolio(supabase, folioId);
  return { id: folioId };
}

async function loadAssignments(supabase: ReturnType<typeof createClient>, filters: { data?: string; status?: string; start?: string; end?: string; search?: string } = {}) {
  let query = supabase
    .from('fd_room_assignments')
    .select(`
      *,
      hk_rooms(id, numero, tipo, andar, capacidade, status),
      bookings(id, confirmation_code, status, check_in, check_out, guests_count, lodging_total, extras_total, experiences_total, total, guests(name, email, phone)),
      fin_folios(id, total_geral, total_pago, saldo_devedor, status)
    `);

  if (filters.data) {
    query = query.or(`checkin_previsto.eq.${filters.data},checkout_previsto.eq.${filters.data}`);
  }
  if (filters.status && filters.status !== 'todas') query = query.eq('status', filters.status);
  if (filters.start) query = query.gte('checkin_previsto', filters.start);
  if (filters.end) query = query.lte('checkin_previsto', filters.end);
  query = query.order('checkin_previsto', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];
  let keys: unknown[] = [];
  if (rows.length > 0) {
    const { data: keyRows, error: keyError } = await supabase.from('fd_key_events').select('*').in('assignment_id', rows.map(row => row.id));
    if (keyError) throw keyError;
    keys = keyRows || [];
  }

  const keyMap = new Map<string, unknown[]>();
  for (const key of keys || []) keyMap.set(key.assignment_id, [...(keyMap.get(key.assignment_id) || []), key]);

  return rows
    .map(row => normalizeAssignment(row, keyMap.get(row.id) || []))
    .filter(row => {
      const search = String(filters.search || '').trim().toLowerCase();
      if (!search) return true;
      return row.booking?.hospede_nome.toLowerCase().includes(search) || row.booking?.hospede_email.toLowerCase().includes(search);
    });
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function normalizeAssignment(row: Record<string, any>, keyEvents: unknown[] = []) {
  const booking = first(row.bookings);
  const guest = first(booking?.guests);
  const room = first(row.hk_rooms);
  const folio = first(row.fin_folios);
  return {
    ...row,
    room: room ? { numero: room.numero, tipo: room.tipo, andar: room.andar, capacidade: room.capacidade, status: room.status } : null,
    booking: booking ? {
      hospede_nome: guest?.name || 'Hospede',
      hospede_email: guest?.email || '',
      telefone: guest?.phone || '',
      valor_diaria: Math.round(Number(booking.lodging_total || 0) / Math.max(1, daysBetween(booking.check_in, booking.check_out))),
      extras: { extras_total: booking.extras_total, experiences_total: booking.experiences_total },
      confirmation_code: booking.confirmation_code,
      total: booking.total,
    } : null,
    folio: folio ? {
      total_geral: Number(folio.total_geral || 0),
      total_pago: Number(folio.total_pago || 0),
      saldo_devedor: Number(folio.saldo_devedor || 0),
      status: folio.status,
    } : null,
    key_events: keyEvents,
  };
}

async function summary(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const data = payload.data ? dateOnly(payload.data) : today();
  const [todayAssignments, occupancy, roomsResult, incidentsResult] = await Promise.all([
    loadAssignments(supabase, { data }),
    loadAssignments(supabase, { status: 'checked_in' }),
    supabase.from('hk_rooms').select('*').order('numero'),
    supabase.from('fd_incidents').select('*').in('status', ['aberto', 'em_tratamento']).order('created_at', { ascending: false }),
  ]);
  if (roomsResult.error) throw roomsResult.error;
  if (incidentsResult.error) throw incidentsResult.error;

  const rooms = roomsResult.data || [];
  const occupiedIds = new Set(occupancy.map(item => item.room_id));
  const availableRooms = rooms.filter(room => room.status === 'limpo' && !occupiedIds.has(room.id));
  const checkins = todayAssignments.filter(item => item.checkin_previsto === data && item.status === 'reservado');
  const checkouts = todayAssignments.filter(item => item.checkout_previsto === data && item.status === 'checked_in');

  return {
    checkins_hoje: checkins,
    checkouts_hoje: checkouts,
    ocupacao_atual: occupancy,
    quartos_disponiveis: availableRooms,
    incidents_abertos: incidentsResult.data || [],
    metricas: {
      total_quartos: rooms.length,
      ocupados: occupancy.length,
      disponiveis: availableRooms.length,
      checkins_pendentes_hoje: checkins.length,
      checkouts_pendentes_hoje: checkouts.length,
      taxa_ocupacao: rooms.length ? Math.round((occupancy.length / rooms.length) * 1000) / 10 : 0,
      receita_hoje: todayAssignments.filter(item => item.checkin_previsto === data).reduce((sum, item) => sum + Number(item.folio?.total_geral || 0), 0),
    },
  };
}

async function assertRoomAvailable(supabase: ReturnType<typeof createClient>, roomId: string, checkin: string, checkout: string, ignoreAssignmentId?: string) {
  const { data: room, error } = await supabase.from('hk_rooms').select('*').eq('id', roomId).single();
  if (error) throw error;
  if (room.status !== 'limpo') throw new Error('Quarto precisa estar limpo para atribuicao.');

  let query = supabase
    .from('fd_room_assignments')
    .select('id')
    .eq('room_id', roomId)
    .in('status', ASSIGNMENT_ACTIVE)
    .lt('checkin_previsto', checkout)
    .gt('checkout_previsto', checkin);
  if (ignoreAssignmentId) query = query.neq('id', ignoreAssignmentId);
  const { data, error: overlapError } = await query;
  if (overlapError) throw overlapError;
  if ((data || []).length > 0) throw new Error('Quarto ja esta atribuido neste periodo.');
  return room;
}

async function assignRoom(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const bookingId = String(payload.booking_id || '');
  const roomId = String(payload.room_id || '');
  const checkin = dateOnly(payload.checkin_previsto);
  const checkout = dateOnly(payload.checkout_previsto);
  const room = await assertRoomAvailable(supabase, roomId, checkin, checkout);

  const { data: existing, error: existingError } = await supabase.from('fd_room_assignments').select('id').eq('booking_id', bookingId).in('status', ASSIGNMENT_ACTIVE);
  if (existingError) throw existingError;
  if ((existing || []).length > 0) throw new Error('Reserva ja possui quarto ativo.');

  const { data, error } = await supabase.from('fd_room_assignments').insert({
    booking_id: bookingId,
    room_id: roomId,
    quarto_numero: room.numero,
    checkin_previsto: checkin,
    checkout_previsto: checkout,
    adultos: Number(payload.adultos || 1),
    criancas: Number(payload.criancas || 0),
    observacao: String(payload.observacao || '').trim() || null,
    assigned_by: userId,
  }).select('id').single();
  if (error) throw error;
  return (await loadAssignments(supabase)).find(item => item.id === data.id);
}

async function checkin(supabase: ReturnType<typeof createClient>, userId: string, role: string, authHeader: string, payload: Record<string, unknown>) {
  const assignmentId = String(payload.assignment_id || '');
  const { data: current, error } = await supabase.from('fd_room_assignments').select('*, hk_rooms(*), bookings(*, guests(*))').eq('id', assignmentId).single();
  if (error) throw error;
  if (current.status !== 'reservado') throw Object.assign(new Error('A reserva precisa estar reservada para check-in.'), { status: 409 });
  if (current.hk_rooms.status !== 'limpo') {
    throw Object.assign(new Error(`Quarto ${current.quarto_numero} esta ${current.hk_rooms.status}. Envie para limpeza ou reatribua para um quarto limpo antes do check-in.`), { status: 409 });
  }
  if (current.checkin_previsto > today() && !canManage(role)) throw Object.assign(new Error('Check-in antecipado exige gestor.'), { status: 403 });

  const booking = first(current.bookings) || current.bookings;
  const guest = first(booking.guests) || booking.guests;
  const folio = await ensureCheckinFolio(supabase, userId, current, booking, guest);

  await supabase.from('fd_room_assignments').update({ status: 'checked_in', checkin_real: new Date().toISOString(), folio_id: folio.id, updated_at: new Date().toISOString() }).eq('id', assignmentId);
  await supabase.from('bookings').update({ status: 'checked_in', updated_at: new Date().toISOString() }).eq('id', current.booking_id);
  await supabase.from('hk_rooms').update({ status: 'ocupado', updated_at: new Date().toISOString() }).eq('id', current.room_id);

  const keyId = String(payload.chave_identificador || '').trim();
  if (keyId) {
    await supabase.from('fd_key_events').insert({ assignment_id: assignmentId, room_id: current.room_id, tipo: 'emitida', identificador: keyId, emitido_por: userId });
  }
  if (payload.preferencias && guest.email) {
    const { data: profile } = await supabase.from('fd_guest_profiles').select('id, preferencias').ilike('email', guest.email).maybeSingle();
    if (profile) {
      await supabase.from('fd_guest_profiles').update({ preferencias: { ...(profile.preferencias || {}), ...(payload.preferencias as Record<string, unknown>) }, updated_at: new Date().toISOString() }).eq('id', profile.id);
    }
  }
  return (await loadAssignments(supabase)).find(item => item.id === assignmentId);
}

async function checkout(supabase: ReturnType<typeof createClient>, userId: string, authHeader: string, payload: Record<string, unknown>) {
  const assignmentId = String(payload.assignment_id || '');
  const { data: current, error } = await supabase.from('fd_room_assignments').select('*, bookings(*, guests(*)), fin_folios(*)').eq('id', assignmentId).single();
  if (error) throw error;
  if (current.status !== 'checked_in') throw new Error('Estadia precisa estar em check-in para checkout.');
  const folio = first(current.fin_folios) || current.fin_folios;
  const saldo = Number(folio?.saldo_devedor || 0);
  if (saldo > 0 && !payload.saldo_ok) throw new Error(`Saldo em aberto: R$ ${saldo.toFixed(2)}.`);
  const method = String(payload.forma_pagamento_final || '');
  if (saldo > 0) {
    assertOneOf(method, PAYMENT_METHODS, 'Informe a forma de pagamento final.');
    await invokeFinancial(authHeader, 'add_folio_payment', { folio_id: current.folio_id, forma_pagamento: method, valor: saldo, observacao: payload.observacao });
  }
  if (current.folio_id) await invokeFinancial(authHeader, 'close_folio', { folio_id: current.folio_id, observacao: payload.observacao });

  await supabase.from('fd_room_assignments').update({ status: 'checked_out', checkout_real: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', assignmentId);
  await supabase.from('bookings').update({ status: 'checked_out', updated_at: new Date().toISOString() }).eq('id', current.booking_id);
  await supabase.from('hk_rooms').update({ status: 'sujo', camareira_id: null, updated_at: new Date().toISOString() }).eq('id', current.room_id);
  await supabase.from('fd_key_events').insert({ assignment_id: assignmentId, room_id: current.room_id, tipo: 'devolvida', emitido_por: userId });

  const guest = first(current.bookings?.guests) || current.bookings?.guests;
  if (guest?.email) {
    const { data: profile } = await supabase.from('fd_guest_profiles').select('*').ilike('email', guest.email).maybeSingle();
    if (profile) {
      await supabase.from('fd_guest_profiles').update({
        total_estadias: Number(profile.total_estadias || 0) + 1,
        total_gasto: Number(profile.total_gasto || 0) + Number(folio?.total_geral || 0),
        ultima_estadia: today(),
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);
    }
  }
  return (await loadAssignments(supabase)).find(item => item.id === assignmentId);
}

async function updateSimpleStatus(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>, status: 'no_show' | 'cancelado') {
  const id = String(payload.assignment_id || '');
  const { data: current, error } = await supabase.from('fd_room_assignments').select('*').eq('id', id).single();
  if (error) throw error;
  if (status === 'no_show' && current.status !== 'reservado') throw new Error('Apenas reservas podem virar no-show.');
  if (status === 'cancelado' && current.status === 'checked_in') throw new Error('Faça checkout antes de cancelar uma estadia ativa.');
  if (status === 'no_show' && current.checkin_previsto > today()) throw new Error('No-show so pode ser marcado no dia ou depois do check-in previsto.');
  await supabase.from('fd_room_assignments').update({ status, observacao: String(payload.observacao || payload.motivo || '').trim() || current.observacao, updated_at: new Date().toISOString() }).eq('id', id);
  await supabase.from('bookings').update({ status: status === 'no_show' ? 'no_show' : 'cancelled', updated_at: new Date().toISOString() }).eq('id', current.booking_id);
  return (await loadAssignments(supabase)).find(item => item.id === id);
}

async function reassignRoom(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const assignmentId = String(payload.assignment_id || '');
  const newRoomId = String(payload.novo_room_id || '');
  const { data: current, error } = await supabase.from('fd_room_assignments').select('*, hk_rooms(*)').eq('id', assignmentId).single();
  if (error) throw error;
  const newRoom = await assertRoomAvailable(supabase, newRoomId, current.checkin_previsto, current.checkout_previsto, assignmentId);
  await supabase.from('fd_room_assignments').update({ room_id: newRoomId, quarto_numero: newRoom.numero, updated_at: new Date().toISOString() }).eq('id', assignmentId);
  await supabase.from('hk_rooms').update({ status: 'sujo', updated_at: new Date().toISOString() }).eq('id', current.room_id);
  if (current.status === 'checked_in') await supabase.from('hk_rooms').update({ status: 'ocupado', updated_at: new Date().toISOString() }).eq('id', newRoomId);
  await supabase.from('fd_incidents').insert({ assignment_id: assignmentId, tipo: 'solicitacao', descricao: String(payload.motivo || 'Reacomodacao de quarto.'), registrado_por: userId });
  return (await loadAssignments(supabase)).find(item => item.id === assignmentId);
}

async function emitKey(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const type = String(payload.tipo || '');
  assertOneOf(type, KEY_TYPES, 'Tipo de chave invalido.');
  if (['reemitida', 'bloqueada'].includes(type) && !String(payload.motivo || '').trim()) throw new Error('Informe o motivo.');
  const assignmentId = String(payload.assignment_id || '');
  const { data: assignment, error } = await supabase.from('fd_room_assignments').select('*').eq('id', assignmentId).single();
  if (error) throw error;
  if (['emitida', 'reemitida'].includes(type) && assignment.status !== 'checked_in') throw new Error('Chaves so podem ser emitidas para estadias ativas.');
  const { data, error: insertError } = await supabase.from('fd_key_events').insert({
    assignment_id: assignmentId,
    room_id: assignment.room_id,
    tipo: type,
    identificador: String(payload.identificador || '').trim() || null,
    motivo: String(payload.motivo || '').trim() || null,
    emitido_por: userId,
  }).select('*').single();
  if (insertError) throw insertError;
  return data;
}

async function saveGuestProfile(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const id = String(payload.id || '');
  const record = {
    profile_id: String(payload.profile_id || '').trim() || null,
    nome: String(payload.nome || '').trim(),
    email: String(payload.email || '').trim().toLowerCase() || null,
    telefone: String(payload.telefone || '').trim() || null,
    cpf: String(payload.cpf || '').trim() || null,
    data_nascimento: payload.data_nascimento ? dateOnly(payload.data_nascimento) : null,
    nacionalidade: String(payload.nacionalidade || 'Brasileira').trim(),
    observacoes_internas: String(payload.observacoes_internas || '').trim() || null,
    classificacao: String(payload.classificacao || 'regular'),
    updated_at: new Date().toISOString(),
  };
  if (record.nome.length < 2) throw new Error('Informe o nome do hospede.');

  if (id) {
    const { data: current } = await supabase.from('fd_guest_profiles').select('preferencias').eq('id', id).maybeSingle();
    const { data, error } = await supabase.from('fd_guest_profiles').update({ ...record, preferencias: { ...(current?.preferencias || {}), ...((payload.preferencias || {}) as Record<string, unknown>) } }).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from('fd_guest_profiles').insert({ ...record, preferencias: payload.preferencias || {} }).select('*').single();
  if (error) throw error;
  return data;
}

async function getGuestHistory(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const id = String(payload.guest_profile_id || '');
  const email = String(payload.email || '').trim().toLowerCase();
  if (!id && !email) throw new Error('Informe o perfil ou e-mail.');
  let profileQuery = supabase.from('fd_guest_profiles').select('*');
  profileQuery = id ? profileQuery.eq('id', id) : profileQuery.ilike('email', email);
  const { data: profile, error } = await profileQuery.maybeSingle();
  if (error) throw error;
  if (!profile) throw new Error('Perfil nao encontrado.');
  const [assignments, incidents, folios] = await Promise.all([
    loadAssignments(supabase, { search: profile.email || profile.nome }),
    supabase.from('fd_incidents').select('*').eq('guest_profile_id', profile.id).order('created_at', { ascending: false }),
    supabase.from('fin_folios').select('id, fin_folio_items(centro_custo, valor_total)').ilike('hospede_email', profile.email || ''),
  ]);
  if (incidents.error) throw incidents.error;
  if (folios.error) throw folios.error;
  return { perfil: profile, estadias: assignments, consumos: folios.data || [], incidents: incidents.data || [], chaves: [] };
}

async function saveIncident(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const id = String(payload.id || '');
  const status = String(payload.status || 'aberto');
  const type = String(payload.tipo || 'outro');
  assertOneOf(type, INCIDENT_TYPES, 'Tipo de ocorrencia invalido.');
  assertOneOf(status, INCIDENT_STATUSES, 'Status invalido.');
  if (status === 'resolvido' && !String(payload.resolucao || '').trim()) throw new Error('Informe a resolucao.');
  const record = {
    assignment_id: String(payload.assignment_id || '').trim() || null,
    guest_profile_id: String(payload.guest_profile_id || '').trim() || null,
    tipo: type,
    descricao: String(payload.descricao || '').trim(),
    status,
    resolucao: String(payload.resolucao || '').trim() || null,
    resolvido_por: status === 'resolvido' ? userId : null,
    updated_at: new Date().toISOString(),
  };
  if (record.descricao.length < 3) throw new Error('Descreva a ocorrencia.');
  if (id) {
    const { data, error } = await supabase.from('fd_incidents').update(record).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('fd_incidents').insert({ ...record, registrado_por: userId }).select('*').single();
  if (error) throw error;
  return data;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const { action, payload = {} } = await req.json() as { action: Action; payload?: Record<string, unknown> };
    const { supabase, userId, role, permissions, authHeader } = await getContext(req);
    assertAccess(role, permissions);
    if (!userId) throw Object.assign(new Error('Sessao invalida.'), { status: 401 });

    let data: unknown;
    switch (action) {
      case 'summary':
        data = await summary(supabase, payload);
        break;
      case 'get_reservations':
        data = await loadAssignments(supabase, { start: dateOnly(payload.periodo_inicio), end: dateOnly(payload.periodo_fim), status: String(payload.status || 'todas'), search: String(payload.busca || '') });
        break;
      case 'assign_room':
        data = await assignRoom(supabase, userId, payload);
        break;
      case 'checkin':
        data = await checkin(supabase, userId, role, authHeader, payload);
        break;
      case 'checkout':
        data = await checkout(supabase, userId, authHeader, payload);
        break;
      case 'no_show':
        data = await updateSimpleStatus(supabase, payload, 'no_show');
        break;
      case 'cancel_assignment':
        if (!canManage(role)) throw Object.assign(new Error('Somente gestores podem cancelar.'), { status: 403 });
        data = await updateSimpleStatus(supabase, payload, 'cancelado');
        break;
      case 'reassign_room':
        if (!canManage(role)) throw Object.assign(new Error('Somente gestores podem trocar quarto.'), { status: 403 });
        data = await reassignRoom(supabase, userId, payload);
        break;
      case 'emit_key':
        data = await emitKey(supabase, userId, payload);
        break;
      case 'save_guest_profile':
        data = await saveGuestProfile(supabase, payload);
        break;
      case 'get_guest_history':
        data = await getGuestHistory(supabase, payload);
        break;
      case 'save_incident':
        data = await saveIncident(supabase, userId, payload);
        break;
      default:
        return json({ error: 'Acao invalida.' }, 400);
    }

    return json({ data });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : 'Erro inesperado na recepcao.';
    return json({ error: message }, status);
  }
});
