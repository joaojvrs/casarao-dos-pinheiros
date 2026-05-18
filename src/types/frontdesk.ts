import type { PaymentMethod } from './financial';

export type AssignmentStatus = 'reservado' | 'checked_in' | 'checked_out' | 'no_show' | 'cancelado';
export type KeyEventType = 'emitida' | 'reemitida' | 'devolvida' | 'bloqueada';
export type GuestClass = 'regular' | 'vip' | 'problema' | 'bloqueado';
export type IncidentType = 'reclamacao' | 'solicitacao' | 'dano' | 'extravio' | 'elogio' | 'seguranca' | 'outro';
export type IncidentStatus = 'aberto' | 'em_tratamento' | 'resolvido';

export interface FDKeyEvent {
  id: string;
  assignment_id: string;
  room_id: string;
  tipo: KeyEventType;
  identificador: string | null;
  motivo: string | null;
  emitido_por: string | null;
  created_at: string;
  emitido_por_profile?: { nome: string } | null;
}

export interface FDRoomAssignment {
  id: string;
  booking_id: string;
  room_id: string;
  quarto_numero: string;
  checkin_previsto: string;
  checkout_previsto: string;
  checkin_real: string | null;
  checkout_real: string | null;
  status: AssignmentStatus;
  folio_id: string | null;
  adultos: number;
  criancas: number;
  observacao: string | null;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
  room?: { numero: string; tipo: string; andar: number; capacidade: number; status?: string } | null;
  booking?: {
    hospede_nome: string;
    hospede_email: string;
    telefone: string;
    valor_diaria: number;
    extras: unknown;
    confirmation_code?: string;
    total?: number;
  } | null;
  folio?: {
    total_geral: number;
    total_pago: number;
    saldo_devedor: number;
    status: string;
  } | null;
  key_events?: FDKeyEvent[];
}

export interface FDGuestProfile {
  id: string;
  profile_id: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  nacionalidade: string | null;
  preferencias: Record<string, unknown>;
  observacoes_internas: string | null;
  total_estadias: number;
  total_gasto: number;
  ultima_estadia: string | null;
  classificacao: GuestClass;
  created_at: string;
  updated_at: string;
}

export interface FDIncident {
  id: string;
  assignment_id: string | null;
  guest_profile_id: string | null;
  tipo: IncidentType;
  descricao: string;
  status: IncidentStatus;
  registrado_por: string | null;
  resolvido_por: string | null;
  resolucao: string | null;
  created_at: string;
  updated_at: string;
  registrado_por_profile?: { nome: string } | null;
}

export interface FDMetrics {
  total_quartos: number;
  ocupados: number;
  disponiveis: number;
  checkins_pendentes_hoje: number;
  checkouts_pendentes_hoje: number;
  taxa_ocupacao: number;
  receita_hoje: number;
}

export interface FDSummary {
  checkins_hoje: FDRoomAssignment[];
  checkouts_hoje: FDRoomAssignment[];
  ocupacao_atual: FDRoomAssignment[];
  quartos_disponiveis: Array<{ id: string; numero: string; tipo: string; andar: number; capacidade: number; status: string }>;
  incidents_abertos: FDIncident[];
  metricas: FDMetrics;
}

export interface FDGuestHistory {
  perfil: FDGuestProfile;
  estadias: FDRoomAssignment[];
  consumos: unknown[];
  incidents: FDIncident[];
  chaves: FDKeyEvent[];
}

export interface CheckoutInput {
  assignment_id: string;
  saldo_ok: boolean;
  forma_pagamento_final?: PaymentMethod;
  observacao?: string;
}
