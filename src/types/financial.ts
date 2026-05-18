export type PaymentMethod = 'dinheiro' | 'debito' | 'credito' | 'pix' | 'transferencia' | 'faturado';
export type CostCenter = 'hospedagem' | 'restaurante' | 'eventos' | 'servicos';
export type FolioStatus = 'aberto' | 'fechado' | 'cancelado';
export type CashStatus = 'aberto' | 'fechado';
export type MovementType = 'entrada' | 'saida';
export type ReceivableStatus = 'pendente' | 'recebido' | 'vencido' | 'cancelado';
export type PayableStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado';

export interface FinFolioItem {
  id: string;
  folio_id: string;
  centro_custo: CostCenter;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  referencia_id: string | null;
  referencia_tipo: string | null;
  nf_numero: string | null;
  nf_status: string | null;
  lancado_por: string | null;
  created_at: string;
}

export interface FinFolioPayment {
  id: string;
  folio_id: string;
  forma_pagamento: PaymentMethod;
  valor: number;
  parcelas: number;
  observacao: string | null;
  registrado_por: string | null;
  created_at: string;
}

export interface FinFolio {
  id: string;
  reserva_id: string | null;
  hospede_nome: string;
  hospede_email: string | null;
  quarto: string | null;
  checkin: string | null;
  checkout: string | null;
  status: FolioStatus;
  total_hospedagem: number;
  total_restaurante: number;
  total_eventos: number;
  total_servicos: number;
  total_geral: number;
  total_pago: number;
  saldo_devedor: number;
  observacao: string | null;
  nf_numero: string | null;
  nf_status: string | null;
  fechado_por: string | null;
  fechado_em: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items: FinFolioItem[];
  payments: FinFolioPayment[];
}

export interface FinCashMovement {
  id: string;
  session_id: string;
  tipo: MovementType;
  categoria: string;
  descricao: string;
  valor: number;
  forma_pagamento: PaymentMethod | null;
  centro_custo: CostCenter | null;
  referencia_id: string | null;
  referencia_tipo: string | null;
  nf_numero: string | null;
  nf_status: string | null;
  registrado_por: string | null;
  created_at: string;
  registrado_por_profile?: { nome: string } | null;
}

export interface FinCashSession {
  id: string;
  operador_id: string;
  turno: 'manha' | 'tarde' | 'noite';
  aberto_em: string;
  fechado_em: string | null;
  saldo_abertura: number;
  saldo_fechamento: number | null;
  saldo_esperado: number | null;
  diferenca: number | null;
  status: CashStatus;
  observacao: string | null;
  created_at: string;
  operador?: { nome: string } | null;
  movements: FinCashMovement[];
}

export interface FinReceivable {
  id: string;
  descricao: string;
  origem: string;
  valor: number;
  vencimento: string;
  status: ReceivableStatus;
  recebido_em: string | null;
  forma_pagamento: PaymentMethod | null;
  centro_custo: CostCenter | null;
  referencia_id: string | null;
  observacao: string | null;
  nf_numero: string | null;
  nf_status: string | null;
  created_by: string | null;
  created_at: string;
}

export interface FinPayable {
  id: string;
  descricao: string;
  fornecedor: string | null;
  valor: number;
  vencimento: string;
  status: PayableStatus;
  pago_em: string | null;
  forma_pagamento: PaymentMethod | null;
  centro_custo: CostCenter | null;
  observacao: string | null;
  nf_numero: string | null;
  nf_status: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DRECentro {
  hospedagem: number;
  restaurante: number;
  eventos: number;
  servicos: number;
  total: number;
}

export interface DRE {
  periodo: { inicio: string; fim: string };
  receitas: DRECentro;
  despesas: { operacional: number; fornecedores: number; outros: number; total: number };
  resultado_bruto: number;
  resultado_por_centro: Record<CostCenter, number>;
}

export interface FinMetrics {
  receita_hoje: number;
  receita_mes: number;
  ticket_medio_folio: number;
  folios_abertos: number;
  saldo_caixa_atual: number;
  receivables_vencidos: number;
  payables_vencidos: number;
}

export interface FinSummary {
  folios_abertos: FinFolio[];
  caixa_atual: FinCashSession | null;
  movimentacoes_hoje: FinCashMovement[];
  receivables_pendentes: FinReceivable[];
  payables_pendentes: FinPayable[];
  dre: DRE;
  metricas: FinMetrics;
}
