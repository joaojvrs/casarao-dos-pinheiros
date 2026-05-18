export type ShiftType = 'M' | 'T' | 'N' | 'F';
export type EmployeeStatus = 'ativo' | 'afastado' | 'ferias';
export type OccurrenceType =
  | 'atraso'
  | 'falta_injustificada'
  | 'advertencia_verbal'
  | 'advertencia_escrita'
  | 'elogio'
  | 'outro';
export type TimeRecordStatus = 'no_horario' | 'atrasado' | 'hora_extra' | 'falta';
export type HRAlertSeverity = 'warning' | 'error' | 'info';

export interface HREmployeeProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

export interface HREmployee {
  id: string;
  profile_id: string;
  cargo: string | null;
  setor: string | null;
  turno_padrao: ShiftType | null;
  data_admissao: string | null;
  status: EmployeeStatus;
  foto_url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: HREmployeeProfile | HREmployeeProfile[] | null;
}

export interface HRSchedule {
  id: string;
  employee_id: string;
  data: string;
  turno: ShiftType;
  created_at: string;
}

export interface HRTimeRecord {
  id: string;
  employee_id: string;
  data: string;
  entrada: string | null;
  saida_intervalo: string | null;
  retorno_intervalo: string | null;
  saida: string | null;
  horas_trabalhadas: number | null;
  status: TimeRecordStatus;
  observacao: string | null;
  created_at: string;
}

export interface HROccurrence {
  id: string;
  employee_id: string;
  tipo: OccurrenceType;
  descricao: string | null;
  data: string;
  registrado_por: string | null;
  created_at: string;
}

export interface HRProductivity {
  id: string;
  employee_id: string;
  data: string | null;
  metrica: string | null;
  valor: number | null;
  created_at: string;
}

export interface HRAlert {
  type: string;
  message: string;
  severity: HRAlertSeverity;
}

export interface HRMetrics {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  overtimeAlerts: number;
}

export interface HRSummary {
  employees: HREmployee[];
  schedules: HRSchedule[];
  timeRecords: HRTimeRecord[];
  occurrences: HROccurrence[];
  productivity: HRProductivity[];
  alerts: HRAlert[];
  metrics: HRMetrics;
}

export interface HRWeeklyReportRow {
  nome: string;
  cargo: string;
  setor: string;
  total_horas: string;
  extras: string;
  faltas: number;
  ocorrencias: number;
}

export interface SaveEmployeeInput {
  id?: string;
  profileId: string;
  cargo?: string;
  setor?: string;
  turnoPadrao?: ShiftType;
  dataAdmissao?: string;
  status?: EmployeeStatus;
  fotoUrl?: string;
  observacoes?: string;
}

export interface SaveScheduleInput {
  employeeId: string;
  data: string;
  turno: ShiftType;
}

export interface SaveTimeRecordInput {
  employeeId: string;
  data: string;
  entrada?: string;
  saidaIntervalo?: string;
  retornoIntervalo?: string;
  saida?: string;
  observacao?: string;
}

export interface SaveOccurrenceInput {
  employeeId: string;
  tipo: OccurrenceType;
  descricao?: string;
  data: string;
}
