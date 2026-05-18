export type RoomStatus = 'limpo' | 'sujo' | 'em_limpeza' | 'bloqueado' | 'em_manutencao' | 'ocupado';
export type RoomType = 'standard' | 'superior' | 'suite' | 'deluxe';
export type MaintenanceStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
export type MaintenanceCategory = 'eletrica' | 'hidraulica' | 'climatizacao' | 'mobiliario' | 'outros';
export type MaintenancePriority = 'alta' | 'media' | 'baixa';
export type LostFoundStatus = 'aguardando' | 'notificado' | 'devolvido' | 'descartado';
export type OccurrenceType = 'atraso' | 'falta_injustificada' | 'advertencia_verbal' | 'advertencia_escrita' | 'elogio' | 'outro';

export interface HKProfileRef {
  id?: string;
  nome: string;
  avatar_url?: string | null;
}

export interface HKRoom {
  id: string;
  numero: string;
  andar: number;
  tipo: RoomType;
  capacidade: number;
  status: RoomStatus;
  camareira_id: string | null;
  camareira?: HKProfileRef | null;
  updated_at: string;
  created_at: string;
}

export interface HKChecklistItem {
  id: string;
  label: string;
  done: boolean;
  foto_url: string | null;
}

export interface HKCleaningLog {
  id: string;
  room_id: string;
  camareira_id: string | null;
  camareira?: { nome: string } | null;
  iniciado_em: string | null;
  concluido_em: string | null;
  checklist: HKChecklistItem[];
  observacao: string | null;
  status: 'pendente' | 'em_andamento' | 'concluido';
  created_at: string;
}

export interface HKMaintenanceEvent {
  id: string;
  order_id: string;
  status: string;
  descricao: string | null;
  feito_por: string | null;
  created_at: string;
  feito_por_profile?: { nome: string } | null;
}

export interface HKMaintenanceOrder {
  id: string;
  room_id: string | null;
  room?: { numero: string } | null;
  local_livre: string | null;
  categoria: MaintenanceCategory;
  descricao: string;
  prioridade: MaintenancePriority;
  status: MaintenanceStatus;
  responsavel_id: string | null;
  responsavel?: { nome: string } | null;
  aberta_por: string | null;
  foto_url: string | null;
  resolucao: string | null;
  aberta_em: string;
  concluida_em: string | null;
  created_at: string;
  events: HKMaintenanceEvent[];
}

export interface HKLostFound {
  id: string;
  room_id: string | null;
  room?: { numero: string } | null;
  descricao: string;
  foto_url: string | null;
  encontrado_por: string | null;
  encontrado_por_profile?: { nome: string } | null;
  encontrado_em: string;
  local_guarda: string | null;
  hospede_nome: string | null;
  hospede_contato: string | null;
  reserva_id: string | null;
  status: LostFoundStatus;
  notificado_em: string | null;
  devolvido_em: string | null;
  devolvido_para: string | null;
  created_at: string;
}

export interface HKMetrics {
  quartos_limpos: number;
  quartos_sujos: number;
  em_limpeza: number;
  ocupados: number;
  bloqueados: number;
  em_manutencao: number;
  ordens_abertas: number;
  ordens_alta_prioridade: number;
  achados_aguardando: number;
}

export interface HKSummary {
  rooms: HKRoom[];
  cleaning_logs_today: HKCleaningLog[];
  maintenance_orders: HKMaintenanceOrder[];
  lost_found: HKLostFound[];
  metrics: HKMetrics;
}
