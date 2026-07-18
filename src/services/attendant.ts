import { supabase } from '../lib/supabase';

export type AttendantOrderStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type ServiceRequestStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';

export interface AttendantOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface AttendantOrder {
  id: string;
  orderNumber: string;
  status: AttendantOrderStatus;
  total: number;
  notes: string | null;
  createdAt: string;
  bookingId: string | null;
  room: string;
  guestName: string;
  items: AttendantOrderItem[];
}

export interface AttendantServiceRequest {
  id: string;
  bookingId: string | null;
  guestName: string;
  room: string;
  scheduledTime: string;
  services: string[];
  notes: string;
  status: ServiceRequestStatus;
  createdAt: string;
}

export interface AttendantBoard {
  orders: AttendantOrder[];
  requests: AttendantServiceRequest[];
  metrics: {
    pendingOrders: number;
    pendingRequests: number;
    deliveredToday: number;
  };
}

type Action = 'board' | 'update_order_status' | 'update_request_status';

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

async function invokeAttendant<T>(action: Action, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke<FunctionResponse<T>>('attendant-operations', {
    body: { action, payload },
  });
  if (error) throw new Error(await parseFunctionError(error));
  if (!data) throw new Error('Operacao sem retorno do atendimento.');
  return data.data;
}

export function fetchAttendantBoard() {
  return invokeAttendant<AttendantBoard>('board');
}

export function updateGuestOrderStatus(orderId: string, status: AttendantOrderStatus) {
  return invokeAttendant<{ id: string; status: AttendantOrderStatus }>('update_order_status', { orderId, status });
}

export function updateServiceRequestStatus(requestId: string, status: ServiceRequestStatus) {
  return invokeAttendant<{ id: string; status: ServiceRequestStatus }>('update_request_status', { requestId, status });
}
