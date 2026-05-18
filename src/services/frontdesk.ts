import { supabase } from '../lib/supabase';
import type { PaymentMethod } from '../types/financial';
import type {
  CheckoutInput,
  FDGuestHistory,
  FDGuestProfile,
  FDIncident,
  FDKeyEvent,
  FDRoomAssignment,
  FDSummary,
  IncidentStatus,
  IncidentType,
  KeyEventType,
} from '../types/frontdesk';

type FrontDeskAction =
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

async function invokeFrontDesk<T>(action: FrontDeskAction, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke<FunctionResponse<T>>('frontdesk-operations', {
    body: { action, payload },
  });

  if (error) throw new Error(await parseFunctionError(error));
  if (!data) throw new Error('Operacao sem retorno da recepcao.');
  return data.data;
}

export function fetchFDSummary(data?: string) {
  return invokeFrontDesk<FDSummary>('summary', { data });
}

export function getReservations(periodo_inicio: string, periodo_fim: string, status?: string, busca?: string) {
  return invokeFrontDesk<FDRoomAssignment[]>('get_reservations', { periodo_inicio, periodo_fim, status, busca });
}

export function assignRoom(data: {
  booking_id: string;
  room_id: string;
  checkin_previsto: string;
  checkout_previsto: string;
  adultos: number;
  criancas?: number;
  observacao?: string;
}) {
  return invokeFrontDesk<FDRoomAssignment>('assign_room', data as unknown as Record<string, unknown>);
}

export function checkin(assignment_id: string, chave_identificador?: string, preferencias?: Record<string, unknown>) {
  return invokeFrontDesk<FDRoomAssignment>('checkin', { assignment_id, chave_identificador, preferencias });
}

export function checkout(assignment_id: string, saldo_ok: boolean, forma_pagamento_final?: PaymentMethod, observacao?: string) {
  return invokeFrontDesk<FDRoomAssignment>('checkout', { assignment_id, saldo_ok, forma_pagamento_final, observacao } satisfies CheckoutInput as unknown as Record<string, unknown>);
}

export function noShow(assignment_id: string, observacao?: string) {
  return invokeFrontDesk<FDRoomAssignment>('no_show', { assignment_id, observacao });
}

export function cancelAssignment(assignment_id: string, motivo: string) {
  return invokeFrontDesk<FDRoomAssignment>('cancel_assignment', { assignment_id, motivo });
}

export function reassignRoom(assignment_id: string, novo_room_id: string, motivo: string) {
  return invokeFrontDesk<FDRoomAssignment>('reassign_room', { assignment_id, novo_room_id, motivo });
}

export function emitKey(assignment_id: string, tipo: KeyEventType, identificador?: string, motivo?: string) {
  return invokeFrontDesk<FDKeyEvent>('emit_key', { assignment_id, tipo, identificador, motivo });
}

export function saveGuestProfile(data: Partial<FDGuestProfile> & { nome: string }) {
  return invokeFrontDesk<FDGuestProfile>('save_guest_profile', data as unknown as Record<string, unknown>);
}

export function getGuestHistory(guest_profile_id?: string, email?: string) {
  return invokeFrontDesk<FDGuestHistory>('get_guest_history', { guest_profile_id, email });
}

export function saveIncident(data: {
  id?: string;
  assignment_id?: string;
  guest_profile_id?: string;
  tipo: IncidentType;
  descricao: string;
  status?: IncidentStatus;
  resolucao?: string;
}) {
  return invokeFrontDesk<FDIncident>('save_incident', data as unknown as Record<string, unknown>);
}
