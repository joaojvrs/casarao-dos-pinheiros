import { supabase } from '../lib/supabase';
import type {
  HKChecklistItem,
  HKLostFound,
  HKMaintenanceOrder,
  HKRoom,
  HKSummary,
  LostFoundStatus,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  RoomStatus,
} from '../types/housekeeping';

type HousekeepingAction =
  | 'summary'
  | 'update_room_status'
  | 'start_cleaning'
  | 'update_checklist'
  | 'finish_cleaning'
  | 'save_maintenance_order'
  | 'update_maintenance_status'
  | 'save_lost_found'
  | 'update_lost_found_status';

interface FunctionResponse<T> {
  data: T;
}

async function parseFunctionError(error: unknown) {
  const response = (error as { context?: Response }).context;
  if (!response) return error instanceof Error ? error.message : 'Nao foi possivel concluir a operacao.';

  try {
    const body = await response.json() as { error?: string; missing?: HKChecklistItem[] };
    if (body.missing?.length) {
      return `${body.error || 'Checklist incompleto.'} Itens pendentes: ${body.missing.map(item => item.label).join(', ')}`;
    }
    return body.error || 'Nao foi possivel concluir a operacao.';
  } catch {
    return 'Nao foi possivel concluir a operacao.';
  }
}

async function invokeHousekeeping<T>(action: HousekeepingAction, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke<FunctionResponse<T>>('housekeeping-operations', {
    body: { action, payload },
  });

  if (error) throw new Error(await parseFunctionError(error));
  if (!data) throw new Error('Operacao sem retorno da governanca.');
  return data.data;
}

export function fetchHKSummary() {
  return invokeHousekeeping<HKSummary>('summary');
}

export function updateRoomStatus(room_id: string, status: RoomStatus, camareira_id?: string) {
  return invokeHousekeeping<HKRoom>('update_room_status', { room_id, status, camareira_id });
}

export function startCleaning(room_id: string, camareira_id: string) {
  return invokeHousekeeping<{ log: unknown; room: HKRoom }>('start_cleaning', { room_id, camareira_id });
}

export function updateChecklist(log_id: string, checklist: HKChecklistItem[]) {
  return invokeHousekeeping<unknown>('update_checklist', { log_id, checklist });
}

export function finishCleaning(log_id: string, room_id: string, observacao?: string) {
  return invokeHousekeeping<{ log: unknown; room: HKRoom }>('finish_cleaning', { log_id, room_id, observacao });
}

export function saveMaintenanceOrder(data: {
  id?: string;
  room_id?: string;
  local_livre?: string;
  categoria: MaintenanceCategory;
  descricao: string;
  prioridade: MaintenancePriority;
  responsavel_id?: string;
  foto_url?: string;
}) {
  return invokeHousekeeping<HKMaintenanceOrder>('save_maintenance_order', data as unknown as Record<string, unknown>);
}

export function updateMaintenanceStatus(order_id: string, status: MaintenanceStatus, descricao?: string, resolucao?: string) {
  return invokeHousekeeping<HKMaintenanceOrder>('update_maintenance_status', { order_id, status, descricao, resolucao });
}

export function saveLostFound(data: {
  id?: string;
  room_id?: string;
  descricao: string;
  foto_url?: string;
  local_guarda?: string;
  hospede_nome?: string;
  hospede_contato?: string;
  reserva_id?: string;
}) {
  return invokeHousekeeping<HKLostFound>('save_lost_found', data as unknown as Record<string, unknown>);
}

export function updateLostFoundStatus(id: string, status: LostFoundStatus, devolvido_para?: string) {
  return invokeHousekeeping<HKLostFound>('update_lost_found_status', { id, status, devolvido_para });
}
