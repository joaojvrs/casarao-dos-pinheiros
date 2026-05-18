import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Action =
  | 'summary'
  | 'open_folio'
  | 'add_folio_item'
  | 'remove_folio_item'
  | 'add_folio_payment'
  | 'close_folio'
  | 'open_cash_session'
  | 'close_cash_session'
  | 'add_cash_movement'
  | 'save_receivable'
  | 'receive_receivable'
  | 'save_payable'
  | 'pay_payable'
  | 'get_dre'
  | 'get_cash_report';

const PAYMENT_METHODS = ['dinheiro', 'debito', 'credito', 'pix', 'transferencia', 'faturado'];
const COST_CENTERS = ['hospedagem', 'restaurante', 'eventos', 'servicos'];
const TURNS = ['manha', 'tarde', 'noite'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function decimal(value: unknown, message = 'Valor invalido.') {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(message);
  return Math.round(number * 100) / 100;
}

function positiveDecimal(value: unknown, message = 'Valor precisa ser maior que zero.') {
  const number = decimal(value, message);
  if (number <= 0) throw new Error(message);
  return number;
}

function optionalDate(value: unknown) {
  const text = String(value || '').trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('Data invalida.');
  return text;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function monthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  return { inicio: start, fim: end };
}

function dayBounds(date = todayDate()) {
  return { start: `${date}T00:00:00.000Z`, end: `${date}T23:59:59.999Z` };
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
  if (error || !requester.user) return { supabase, userId: null, role: 'visitor', permissions: {} as Record<string, boolean> };

  const role = String(requester.user.app_metadata?.role || 'visitor');
  const permissions = (requester.user.app_metadata?.permissions || {}) as Record<string, boolean>;
  return { supabase, userId: requester.user.id, role, permissions };
}

function canAccessFinancial(role: string, permissions: Record<string, boolean>) {
  return ['master', 'admin', 'manager'].includes(role) || Boolean(permissions.payments);
}

function canManageFinancial(role: string) {
  return ['master', 'admin', 'manager'].includes(role);
}

function assertFinancialAccess(role: string, permissions: Record<string, boolean>) {
  if (canAccessFinancial(role, permissions)) return;
  throw Object.assign(new Error('Acesso restrito ao financeiro.'), { status: 403 });
}

async function loadProfiles(supabase: ReturnType<typeof createClient>, ids: Array<string | null | undefined>) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean))) as string[];
  if (!uniqueIds.length) return new Map<string, { id: string; full_name: string | null; email: string | null }>();

  const { data, error } = await supabase.from('profiles').select('id, full_name, email').in('id', uniqueIds);
  if (error) throw error;
  return new Map((data || []).map(profile => [profile.id, profile]));
}

async function loadFolio(supabase: ReturnType<typeof createClient>, folioId: string) {
  const [folioResult, itemsResult, paymentsResult] = await Promise.all([
    supabase.from('fin_folios').select('*').eq('id', folioId).single(),
    supabase.from('fin_folio_items').select('*').eq('folio_id', folioId).order('created_at', { ascending: false }),
    supabase.from('fin_folio_payments').select('*').eq('folio_id', folioId).order('created_at', { ascending: false }),
  ]);

  if (folioResult.error) throw folioResult.error;
  if (itemsResult.error) throw itemsResult.error;
  if (paymentsResult.error) throw paymentsResult.error;
  return { ...folioResult.data, items: itemsResult.data || [], payments: paymentsResult.data || [] };
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
  return loadFolio(supabase, folioId);
}

async function getOpenCashSession(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('fin_cash_sessions')
    .select('*')
    .eq('operador_id', userId)
    .eq('status', 'aberto')
    .order('aberto_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function insertCashMovementForPayment(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  data: {
    tipo: 'entrada' | 'saida';
    categoria: string;
    descricao: string;
    valor: number;
    forma_pagamento: string;
    centro_custo?: string | null;
    referencia_id?: string | null;
    referencia_tipo?: string | null;
  },
) {
  if (data.forma_pagamento === 'faturado') return null;
  const session = await getOpenCashSession(supabase, userId);
  if (!session) throw new Error('Abra um caixa antes de registrar movimentacoes financeiras.');

  const { data: movement, error } = await supabase
    .from('fin_cash_movements')
    .insert({ ...data, session_id: session.id, registrado_por: userId })
    .select('*')
    .single();
  if (error) throw error;
  return movement;
}

async function assertCashReadyForPayment(supabase: ReturnType<typeof createClient>, userId: string, formaPagamento: string) {
  if (formaPagamento === 'faturado') return;
  const session = await getOpenCashSession(supabase, userId);
  if (!session) throw new Error('Abra um caixa antes de registrar movimentacoes financeiras.');
}

async function loadCashSession(supabase: ReturnType<typeof createClient>, sessionId: string) {
  const [sessionResult, movementsResult] = await Promise.all([
    supabase.from('fin_cash_sessions').select('*').eq('id', sessionId).single(),
    supabase.from('fin_cash_movements').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
  ]);
  if (sessionResult.error) throw sessionResult.error;
  if (movementsResult.error) throw movementsResult.error;

  const profiles = await loadProfiles(supabase, [sessionResult.data.operador_id, ...(movementsResult.data || []).map(item => item.registrado_por)]);
  return {
    ...sessionResult.data,
    operador: compactProfile(profiles.get(sessionResult.data.operador_id)),
    movements: (movementsResult.data || []).map(item => ({
      ...item,
      registrado_por_profile: compactProfile(profiles.get(item.registrado_por)),
    })),
  };
}

async function getDreData(supabase: ReturnType<typeof createClient>, inicio: string, fim: string) {
  const start = `${inicio}T00:00:00.000Z`;
  const end = `${fim}T23:59:59.999Z`;

  const [itemsResult, movementsResult] = await Promise.all([
    supabase.from('fin_folio_items').select('centro_custo, valor_total, created_at').gte('created_at', start).lte('created_at', end),
    supabase.from('fin_cash_movements').select('tipo, categoria, valor, centro_custo, created_at').gte('created_at', start).lte('created_at', end),
  ]);
  if (itemsResult.error) throw itemsResult.error;
  if (movementsResult.error) throw movementsResult.error;

  const receitas = { hospedagem: 0, restaurante: 0, eventos: 0, servicos: 0, total: 0 };
  for (const item of itemsResult.data || []) {
    const center = item.centro_custo as keyof typeof receitas;
    if (center in receitas) receitas[center] += Number(item.valor_total || 0);
  }
  receitas.total = receitas.hospedagem + receitas.restaurante + receitas.eventos + receitas.servicos;

  const despesas = { operacional: 0, fornecedores: 0, outros: 0, total: 0 };
  const despesasPorCentro = { hospedagem: 0, restaurante: 0, eventos: 0, servicos: 0 };
  for (const movement of movementsResult.data || []) {
    if (movement.tipo !== 'saida') continue;
    const value = Number(movement.valor || 0);
    if (movement.categoria === 'despesa_operacional') despesas.operacional += value;
    else if (movement.categoria === 'fornecedor') despesas.fornecedores += value;
    else despesas.outros += value;

    const center = movement.centro_custo as keyof typeof despesasPorCentro;
    if (center in despesasPorCentro) despesasPorCentro[center] += value;
  }
  despesas.total = despesas.operacional + despesas.fornecedores + despesas.outros;

  return {
    periodo: { inicio, fim },
    receitas: {
      hospedagem: decimal(receitas.hospedagem),
      restaurante: decimal(receitas.restaurante),
      eventos: decimal(receitas.eventos),
      servicos: decimal(receitas.servicos),
      total: decimal(receitas.total),
    },
    despesas: {
      operacional: decimal(despesas.operacional),
      fornecedores: decimal(despesas.fornecedores),
      outros: decimal(despesas.outros),
      total: decimal(despesas.total),
    },
    resultado_bruto: decimal(receitas.total - despesas.total),
    resultado_por_centro: {
      hospedagem: decimal(receitas.hospedagem - despesasPorCentro.hospedagem),
      restaurante: decimal(receitas.restaurante - despesasPorCentro.restaurante),
      eventos: decimal(receitas.eventos - despesasPorCentro.eventos),
      servicos: decimal(receitas.servicos - despesasPorCentro.servicos),
    },
  };
}

async function summary(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const fallback = monthRange();
  const inicio = optionalDate(payload.periodo_inicio) || fallback.inicio;
  const fim = optionalDate(payload.periodo_fim) || fallback.fim;
  const today = dayBounds();
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  const dueLimit = sevenDays.toISOString().slice(0, 10);

  const [
    foliosResult,
    cashResult,
    todayMovementsResult,
    receivablesResult,
    payablesResult,
    todayPaymentsResult,
    monthFoliosResult,
  ] = await Promise.all([
    supabase.from('fin_folios').select('*').eq('status', 'aberto').order('created_at', { ascending: false }),
    supabase.from('fin_cash_sessions').select('*').eq('operador_id', userId).eq('status', 'aberto').order('aberto_em', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('fin_cash_movements').select('*').gte('created_at', today.start).lte('created_at', today.end).order('created_at', { ascending: false }),
    supabase.from('fin_receivables').select('*').in('status', ['pendente', 'vencido']).lte('vencimento', dueLimit).order('vencimento'),
    supabase.from('fin_payables').select('*').in('status', ['pendente', 'vencido']).lte('vencimento', dueLimit).order('vencimento'),
    supabase.from('fin_folio_payments').select('valor, created_at').gte('created_at', today.start).lte('created_at', today.end),
    supabase.from('fin_folios').select('total_geral, created_at').gte('created_at', `${inicio}T00:00:00.000Z`).lte('created_at', `${fim}T23:59:59.999Z`),
  ]);

  for (const result of [foliosResult, cashResult, todayMovementsResult, receivablesResult, payablesResult, todayPaymentsResult, monthFoliosResult]) {
    if (result.error) throw result.error;
  }

  const folios = await Promise.all((foliosResult.data || []).map(folio => loadFolio(supabase, folio.id)));
  const caixaAtual = cashResult.data ? await loadCashSession(supabase, cashResult.data.id) : null;
  const dre = await getDreData(supabase, inicio, fim);
  const receitaHoje = (todayPaymentsResult.data || []).reduce((sum, payment) => sum + Number(payment.valor || 0), 0);
  const monthFolios = monthFoliosResult.data || [];
  const ticketMedio = monthFolios.length ? monthFolios.reduce((sum, folio) => sum + Number(folio.total_geral || 0), 0) / monthFolios.length : 0;
  const caixaMovements = caixaAtual?.movements || [];
  const saldoCaixa = caixaAtual
    ? Number(caixaAtual.saldo_abertura || 0)
      + caixaMovements.filter(item => item.tipo === 'entrada').reduce((sum, item) => sum + Number(item.valor || 0), 0)
      - caixaMovements.filter(item => item.tipo === 'saida').reduce((sum, item) => sum + Number(item.valor || 0), 0)
    : 0;

  return {
    folios_abertos: folios,
    caixa_atual: caixaAtual,
    movimentacoes_hoje: todayMovementsResult.data || [],
    receivables_pendentes: receivablesResult.data || [],
    payables_pendentes: payablesResult.data || [],
    dre,
    metricas: {
      receita_hoje: decimal(receitaHoje),
      receita_mes: dre.receitas.total,
      ticket_medio_folio: decimal(ticketMedio),
      folios_abertos: folios.length,
      saldo_caixa_atual: decimal(saldoCaixa),
      receivables_vencidos: (receivablesResult.data || []).filter(item => item.status === 'vencido' || item.vencimento < todayDate()).length,
      payables_vencidos: (payablesResult.data || []).filter(item => item.status === 'vencido' || item.vencimento < todayDate()).length,
    },
  };
}

async function openFolio(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const reservaId = String(payload.reserva_id || '').trim() || null;
  const hospedeNome = String(payload.hospede_nome || '').trim();
  const checkin = optionalDate(payload.checkin);
  const checkout = optionalDate(payload.checkout);
  if (hospedeNome.length < 3) throw new Error('Informe o nome do hospede.');
  if (checkin && checkout && checkin > checkout) throw new Error('Check-in precisa ser anterior ou igual ao checkout.');

  if (reservaId) {
    const { data: duplicate, error } = await supabase.from('fin_folios').select('id').eq('reserva_id', reservaId).neq('status', 'cancelado').maybeSingle();
    if (error) throw error;
    if (duplicate) throw new Error('Ja existe um folio para esta reserva.');
  }

  const { data: folio, error } = await supabase
    .from('fin_folios')
    .insert({
      reserva_id: reservaId,
      hospede_nome: hospedeNome,
      hospede_email: String(payload.hospede_email || '').trim() || null,
      quarto: String(payload.quarto || '').trim() || null,
      checkin,
      checkout,
      status: 'aberto',
      created_by: userId,
    })
    .select('id')
    .single();
  if (error) throw error;

  const valorDiaria = Number(payload.valor_diaria || 0);
  if (reservaId && checkin && checkout && valorDiaria > 0) {
    const nights = Math.max(1, Math.round((new Date(`${checkout}T00:00:00Z`).getTime() - new Date(`${checkin}T00:00:00Z`).getTime()) / 86400000));
    const { error: itemError } = await supabase.from('fin_folio_items').insert({
      folio_id: folio.id,
      centro_custo: 'hospedagem',
      descricao: `Diarias da reserva (${nights} noite${nights === 1 ? '' : 's'})`,
      quantidade: nights,
      valor_unitario: decimal(valorDiaria),
      referencia_id: reservaId,
      referencia_tipo: 'reserva',
      lancado_por: userId,
    });
    if (itemError) throw itemError;
  }

  return recalculateFolio(supabase, folio.id);
}

async function addFolioItem(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const folioId = String(payload.folio_id || '');
  const centroCusto = String(payload.centro_custo || '');
  assertOneOf(centroCusto, COST_CENTERS, 'Centro de custo invalido.');
  const quantidade = positiveDecimal(payload.quantidade || 1, 'Quantidade precisa ser maior que zero.');
  const valorUnitario = positiveDecimal(payload.valor_unitario, 'Valor unitario precisa ser maior que zero.');

  const folio = await loadFolio(supabase, folioId);
  if (folio.status !== 'aberto') throw new Error('Folio precisa estar aberto para receber lancamentos.');

  const { data: item, error } = await supabase.from('fin_folio_items').insert({
    folio_id: folioId,
    centro_custo: centroCusto,
    descricao: String(payload.descricao || '').trim(),
    quantidade,
    valor_unitario: valorUnitario,
    referencia_id: String(payload.referencia_id || '').trim() || null,
    referencia_tipo: String(payload.referencia_tipo || '').trim() || 'manual',
    lancado_por: userId,
  }).select('*').single();
  if (error) throw error;

  return { item, folio: await recalculateFolio(supabase, folioId) };
}

async function removeFolioItem(supabase: ReturnType<typeof createClient>, role: string, payload: Record<string, unknown>) {
  if (!canManageFinancial(role)) throw Object.assign(new Error('Somente gestores podem remover lancamentos.'), { status: 403 });
  const itemId = String(payload.item_id || '');

  const { data: item, error: itemError } = await supabase.from('fin_folio_items').select('id, folio_id').eq('id', itemId).single();
  if (itemError) throw itemError;
  const folio = await loadFolio(supabase, item.folio_id);
  if (folio.status !== 'aberto') throw new Error('Nao e possivel remover itens de folio fechado.');

  const { error } = await supabase.from('fin_folio_items').delete().eq('id', itemId);
  if (error) throw error;
  return recalculateFolio(supabase, item.folio_id);
}

async function addFolioPayment(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const folioId = String(payload.folio_id || '');
  const formaPagamento = String(payload.forma_pagamento || '');
  assertOneOf(formaPagamento, PAYMENT_METHODS, 'Forma de pagamento invalida.');
  const valor = positiveDecimal(payload.valor, 'Valor do pagamento precisa ser maior que zero.');
  const folio = await loadFolio(supabase, folioId);
  if (folio.status !== 'aberto') throw new Error('Folio precisa estar aberto para receber pagamento.');
  if (valor > Number(folio.saldo_devedor || 0)) throw new Error(`Pagamento excede o saldo devedor de R$ ${Number(folio.saldo_devedor || 0).toFixed(2)}.`);
  await assertCashReadyForPayment(supabase, userId, formaPagamento);

  const { data: payment, error } = await supabase.from('fin_folio_payments').insert({
    folio_id: folioId,
    forma_pagamento: formaPagamento,
    valor,
    parcelas: Number(payload.parcelas || 1),
    observacao: String(payload.observacao || '').trim() || null,
    registrado_por: userId,
  }).select('*').single();
  if (error) throw error;

  await insertCashMovementForPayment(supabase, userId, {
    tipo: 'entrada',
    categoria: 'folio',
    descricao: `Pagamento folio ${folio.hospede_nome}`,
    valor,
    forma_pagamento: formaPagamento,
    centro_custo: 'hospedagem',
    referencia_id: folioId,
    referencia_tipo: 'folio',
  });

  return { payment, folio: await recalculateFolio(supabase, folioId) };
}

async function closeFolio(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const folioId = String(payload.folio_id || '');
  const folio = await recalculateFolio(supabase, folioId);
  const saldo = decimal(folio.saldo_devedor || 0);
  if (saldo > 0) throw new Error(`Ainda ha saldo em aberto de R$ ${saldo.toFixed(2)}.`);

  const { data, error } = await supabase.from('fin_folios').update({
    status: 'fechado',
    fechado_por: userId,
    fechado_em: new Date().toISOString(),
    observacao: String(payload.observacao || folio.observacao || '').trim() || null,
    updated_at: new Date().toISOString(),
  }).eq('id', folioId).select('*').single();
  if (error) throw error;
  return { ...data, items: folio.items, payments: folio.payments };
}

async function openCashSession(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const turno = String(payload.turno || '');
  assertOneOf(turno, TURNS, 'Turno invalido.');
  const existing = await getOpenCashSession(supabase, userId);
  if (existing) throw new Error('Voce ja possui um caixa aberto.');

  const { data, error } = await supabase.from('fin_cash_sessions').insert({
    operador_id: userId,
    turno,
    saldo_abertura: decimal(payload.saldo_abertura || 0),
  }).select('*').single();
  if (error) throw error;
  return loadCashSession(supabase, data.id);
}

async function closeCashSession(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const sessionId = String(payload.session_id || '');
  const closing = decimal(payload.saldo_fechamento || 0);
  const session = await loadCashSession(supabase, sessionId);
  const dinheiro = session.movements.filter(item => item.forma_pagamento === 'dinheiro');
  const entradas = dinheiro.filter(item => item.tipo === 'entrada').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const saidas = dinheiro.filter(item => item.tipo === 'saida').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const esperado = decimal(Number(session.saldo_abertura || 0) + entradas - saidas);

  const { data, error } = await supabase.from('fin_cash_sessions').update({
    status: 'fechado',
    fechado_em: new Date().toISOString(),
    saldo_fechamento: closing,
    saldo_esperado: esperado,
    diferenca: decimal(closing - esperado),
    observacao: String(payload.observacao || '').trim() || null,
  }).eq('id', sessionId).select('id').single();
  if (error) throw error;
  return loadCashSession(supabase, data.id);
}

async function addCashMovement(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const sessionId = String(payload.session_id || '');
  const tipo = String(payload.tipo || '');
  assertOneOf(tipo, ['entrada', 'saida'], 'Tipo de movimentacao invalido.');
  const { data: session, error: sessionError } = await supabase.from('fin_cash_sessions').select('id, status').eq('id', sessionId).single();
  if (sessionError) throw sessionError;
  if (session.status !== 'aberto') throw new Error('Caixa precisa estar aberto.');

  const { data, error } = await supabase.from('fin_cash_movements').insert({
    session_id: sessionId,
    tipo,
    categoria: String(payload.categoria || '').trim(),
    descricao: String(payload.descricao || '').trim(),
    valor: positiveDecimal(payload.valor),
    forma_pagamento: String(payload.forma_pagamento || '').trim() || null,
    centro_custo: String(payload.centro_custo || '').trim() || null,
    referencia_id: String(payload.referencia_id || '').trim() || null,
    referencia_tipo: String(payload.referencia_tipo || '').trim() || null,
    registrado_por: userId,
  }).select('*').single();
  if (error) throw error;
  return data;
}

async function saveReceivable(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const record = {
    descricao: String(payload.descricao || '').trim(),
    origem: String(payload.origem || '').trim(),
    valor: positiveDecimal(payload.valor),
    vencimento: optionalDate(payload.vencimento),
    centro_custo: String(payload.centro_custo || '').trim() || null,
    referencia_id: String(payload.referencia_id || '').trim() || null,
    observacao: String(payload.observacao || '').trim() || null,
  };
  if (!record.descricao || !record.origem || !record.vencimento) throw new Error('Preencha os dados da conta a receber.');

  if (payload.id) {
    const { data, error } = await supabase.from('fin_receivables').update(record).eq('id', payload.id).select('*').single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from('fin_receivables').insert({ ...record, created_by: userId }).select('*').single();
  if (error) throw error;
  return data;
}

async function receiveReceivable(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const id = String(payload.id || '');
  const formaPagamento = String(payload.forma_pagamento || '');
  assertOneOf(formaPagamento, PAYMENT_METHODS, 'Forma de pagamento invalida.');
  await assertCashReadyForPayment(supabase, userId, formaPagamento);

  const { data, error } = await supabase.from('fin_receivables').update({
    status: 'recebido',
    recebido_em: new Date().toISOString(),
    forma_pagamento: formaPagamento,
    observacao: String(payload.observacao || '').trim() || null,
  }).eq('id', id).select('*').single();
  if (error) throw error;

  await insertCashMovementForPayment(supabase, userId, {
    tipo: 'entrada',
    categoria: data.origem === 'ota_booking' || data.origem === 'ota_airbnb' || data.origem === 'ota_expedia' ? 'ota_repasse' : 'outros',
    descricao: data.descricao,
    valor: Number(data.valor || 0),
    forma_pagamento: formaPagamento,
    centro_custo: data.centro_custo,
    referencia_id: data.id,
    referencia_tipo: 'receivable',
  });
  return data;
}

async function savePayable(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const record = {
    descricao: String(payload.descricao || '').trim(),
    fornecedor: String(payload.fornecedor || '').trim() || null,
    valor: positiveDecimal(payload.valor),
    vencimento: optionalDate(payload.vencimento),
    centro_custo: String(payload.centro_custo || '').trim() || null,
    observacao: String(payload.observacao || '').trim() || null,
  };
  if (!record.descricao || !record.vencimento) throw new Error('Preencha os dados da conta a pagar.');

  if (payload.id) {
    const { data, error } = await supabase.from('fin_payables').update(record).eq('id', payload.id).select('*').single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from('fin_payables').insert({ ...record, created_by: userId }).select('*').single();
  if (error) throw error;
  return data;
}

async function payPayable(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const id = String(payload.id || '');
  const formaPagamento = String(payload.forma_pagamento || '');
  assertOneOf(formaPagamento, PAYMENT_METHODS, 'Forma de pagamento invalida.');
  await assertCashReadyForPayment(supabase, userId, formaPagamento);

  const { data, error } = await supabase.from('fin_payables').update({
    status: 'pago',
    pago_em: new Date().toISOString(),
    forma_pagamento: formaPagamento,
    observacao: String(payload.observacao || '').trim() || null,
  }).eq('id', id).select('*').single();
  if (error) throw error;

  await insertCashMovementForPayment(supabase, userId, {
    tipo: 'saida',
    categoria: data.fornecedor ? 'fornecedor' : 'despesa_operacional',
    descricao: data.descricao,
    valor: Number(data.valor || 0),
    forma_pagamento: formaPagamento,
    centro_custo: data.centro_custo,
    referencia_id: data.id,
    referencia_tipo: 'payable',
  });
  return data;
}

async function getCashReport(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  let sessionId = String(payload.session_id || '');
  if (!sessionId) {
    const session = await getOpenCashSession(supabase, userId);
    if (!session) throw new Error('Nenhum caixa aberto encontrado.');
    sessionId = session.id;
  }
  const session = await loadCashSession(supabase, sessionId);
  const entradas_por_forma: Record<string, number> = {};
  const saidas_por_categoria: Record<string, number> = {};
  for (const movement of session.movements) {
    if (movement.tipo === 'entrada') entradas_por_forma[movement.forma_pagamento || 'outros'] = decimal((entradas_por_forma[movement.forma_pagamento || 'outros'] || 0) + Number(movement.valor || 0));
    if (movement.tipo === 'saida') saidas_por_categoria[movement.categoria || 'outros'] = decimal((saidas_por_categoria[movement.categoria || 'outros'] || 0) + Number(movement.valor || 0));
  }
  const entradasDinheiro = session.movements.filter(item => item.tipo === 'entrada' && item.forma_pagamento === 'dinheiro').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const saidasDinheiro = session.movements.filter(item => item.tipo === 'saida' && item.forma_pagamento === 'dinheiro').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  return {
    session,
    movimentacoes_agrupadas: { entradas_por_forma, saidas_por_categoria },
    totais: {
      entradas_por_forma,
      saidas_por_categoria,
      saldo_em_dinheiro: decimal(Number(session.saldo_abertura || 0) + entradasDinheiro - saidasDinheiro),
    },
  };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const { action, payload = {} } = await req.json() as { action: Action; payload?: Record<string, unknown> };
    const { supabase, userId, role, permissions } = await getContext(req);
    assertFinancialAccess(role, permissions);
    if (!userId) throw Object.assign(new Error('Sessao invalida.'), { status: 401 });

    let data: unknown;
    switch (action) {
      case 'summary':
        data = await summary(supabase, userId, payload);
        break;
      case 'open_folio':
        data = await openFolio(supabase, userId, payload);
        break;
      case 'add_folio_item':
        data = await addFolioItem(supabase, userId, payload);
        break;
      case 'remove_folio_item':
        data = await removeFolioItem(supabase, role, payload);
        break;
      case 'add_folio_payment':
        data = await addFolioPayment(supabase, userId, payload);
        break;
      case 'close_folio':
        data = await closeFolio(supabase, userId, payload);
        break;
      case 'open_cash_session':
        data = await openCashSession(supabase, userId, payload);
        break;
      case 'close_cash_session':
        data = await closeCashSession(supabase, payload);
        break;
      case 'add_cash_movement':
        data = await addCashMovement(supabase, userId, payload);
        break;
      case 'save_receivable':
        data = await saveReceivable(supabase, userId, payload);
        break;
      case 'receive_receivable':
        data = await receiveReceivable(supabase, userId, payload);
        break;
      case 'save_payable':
        data = await savePayable(supabase, userId, payload);
        break;
      case 'pay_payable':
        data = await payPayable(supabase, userId, payload);
        break;
      case 'get_dre':
        data = await getDreData(supabase, optionalDate(payload.periodo_inicio) || monthRange().inicio, optionalDate(payload.periodo_fim) || monthRange().fim);
        break;
      case 'get_cash_report':
        data = await getCashReport(supabase, userId, payload);
        break;
      default:
        return json({ error: 'Acao invalida.' }, 400);
    }

    return json({ data });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : 'Erro inesperado no financeiro.';
    return json({ error: message }, status);
  }
});
