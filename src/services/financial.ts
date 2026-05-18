import { supabase } from '../lib/supabase';
import type {
  CostCenter,
  DRE,
  FinCashMovement,
  FinCashSession,
  FinFolio,
  FinFolioItem,
  FinFolioPayment,
  FinPayable,
  FinReceivable,
  FinSummary,
  PaymentMethod,
} from '../types/financial';

type FinancialAction =
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

interface FunctionResponse<T> {
  data: T;
}

async function parseFunctionError(error: unknown) {
  const response = (error as { context?: Response }).context;
  if (!response) return error instanceof Error ? error.message : 'Nao foi possivel concluir a operacao.';

  try {
    const body = await response.json() as { error?: string };
    return body.error || 'Nao foi possivel concluir a operacao.';
  } catch {
    return 'Nao foi possivel concluir a operacao.';
  }
}

async function invokeFinancial<T>(action: FinancialAction, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke<FunctionResponse<T>>('financial-operations', {
    body: { action, payload },
  });

  if (error) throw new Error(await parseFunctionError(error));
  if (!data) throw new Error('Operacao sem retorno do financeiro.');
  return data.data;
}

export function fetchFinSummary(periodo_inicio?: string, periodo_fim?: string) {
  return invokeFinancial<FinSummary>('summary', { periodo_inicio, periodo_fim });
}

export function openFolio(data: {
  reserva_id?: string;
  hospede_nome: string;
  hospede_email?: string;
  quarto?: string;
  checkin?: string;
  checkout?: string;
  valor_diaria?: number;
}) {
  return invokeFinancial<FinFolio>('open_folio', data as unknown as Record<string, unknown>);
}

export function addFolioItem(data: {
  folio_id: string;
  centro_custo: CostCenter;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  referencia_id?: string;
  referencia_tipo?: string;
}) {
  return invokeFinancial<{ item: FinFolioItem; folio: FinFolio }>('add_folio_item', data as unknown as Record<string, unknown>);
}

export function removeFolioItem(item_id: string) {
  return invokeFinancial<FinFolio>('remove_folio_item', { item_id });
}

export function addFolioPayment(data: {
  folio_id: string;
  forma_pagamento: PaymentMethod;
  valor: number;
  parcelas?: number;
  observacao?: string;
}) {
  return invokeFinancial<{ payment: FinFolioPayment; folio: FinFolio }>('add_folio_payment', data as unknown as Record<string, unknown>);
}

export function closeFolio(folio_id: string, observacao?: string) {
  return invokeFinancial<FinFolio>('close_folio', { folio_id, observacao });
}

export function openCashSession(saldo_abertura: number, turno: 'manha' | 'tarde' | 'noite') {
  return invokeFinancial<FinCashSession>('open_cash_session', { saldo_abertura, turno });
}

export function closeCashSession(session_id: string, saldo_fechamento: number, observacao?: string) {
  return invokeFinancial<FinCashSession>('close_cash_session', { session_id, saldo_fechamento, observacao });
}

export function addCashMovement(data: {
  session_id: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  descricao: string;
  valor: number;
  forma_pagamento: PaymentMethod;
  centro_custo?: CostCenter;
  referencia_id?: string;
  referencia_tipo?: string;
}) {
  return invokeFinancial<FinCashMovement>('add_cash_movement', data as unknown as Record<string, unknown>);
}

export function saveReceivable(data: {
  id?: string;
  descricao: string;
  origem: string;
  valor: number;
  vencimento: string;
  centro_custo: CostCenter;
  referencia_id?: string;
  observacao?: string;
}) {
  return invokeFinancial<FinReceivable>('save_receivable', data as unknown as Record<string, unknown>);
}

export function receiveReceivable(id: string, forma_pagamento: PaymentMethod, observacao?: string) {
  return invokeFinancial<FinReceivable>('receive_receivable', { id, forma_pagamento, observacao });
}

export function savePayable(data: {
  id?: string;
  descricao: string;
  fornecedor?: string;
  valor: number;
  vencimento: string;
  centro_custo: CostCenter;
  observacao?: string;
}) {
  return invokeFinancial<FinPayable>('save_payable', data as unknown as Record<string, unknown>);
}

export function payPayable(id: string, forma_pagamento: PaymentMethod, observacao?: string) {
  return invokeFinancial<FinPayable>('pay_payable', { id, forma_pagamento, observacao });
}

export function getDRE(periodo_inicio: string, periodo_fim: string) {
  return invokeFinancial<DRE>('get_dre', { periodo_inicio, periodo_fim });
}

export function getCashReport(session_id?: string) {
  return invokeFinancial<{
    session: FinCashSession;
    movimentacoes_agrupadas: Record<string, Record<string, number>>;
    totais: Record<string, unknown>;
  }>('get_cash_report', { session_id });
}

export function exportDREAsCSV(dre: DRE) {
  const rows = [
    ['Periodo', dre.periodo.inicio, dre.periodo.fim],
    ['Receitas', '', ''],
    ['Hospedagem', dre.receitas.hospedagem],
    ['Restaurante', dre.receitas.restaurante],
    ['Eventos', dre.receitas.eventos],
    ['Servicos', dre.receitas.servicos],
    ['Total receitas', dre.receitas.total],
    ['Despesas', '', ''],
    ['Operacional', dre.despesas.operacional],
    ['Fornecedores', dre.despesas.fornecedores],
    ['Outros', dre.despesas.outros],
    ['Total despesas', dre.despesas.total],
    ['Resultado bruto', dre.resultado_bruto],
  ];
  const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dre-${dre.periodo.inicio}-${dre.periodo.fim}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
