import { supabase } from '../lib/supabase';
import type { GuestStay } from '../types/booking';
import type {
  GarconMenu,
  GuestOrderRecord,
  MenuProduct,
  RestaurantOrderStatus,
  RestaurantPaymentMethod,
  RestaurantProductInput,
  RestaurantSummary,
} from '../types/restaurant';

type RestaurantAction =
  | 'summary'
  | 'garcon_menu'
  | 'save_product'
  | 'open_tab'
  | 'create_order'
  | 'update_order_status'
  | 'close_tab'
  | 'open_cash'
  | 'close_cash'
  | 'adjust_stock';

type MenuAction = 'guest_menu' | 'guest_stay' | 'place_guest_order' | 'guest_orders';

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

async function invokeRestaurant<T>(action: RestaurantAction, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke<FunctionResponse<T>>('restaurant-operations', {
    body: { action, payload },
  });

  if (error) throw new Error(await parseFunctionError(error));
  if (!data) throw new Error('Operacao sem retorno do restaurante.');
  return data.data;
}

async function invokeMenu<T>(action: MenuAction, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke<FunctionResponse<T>>('menu-operations', {
    body: { action, payload },
  });

  if (error) throw new Error(await parseFunctionError(error));
  if (!data) throw new Error('Operacao sem retorno do cardapio.');
  return data.data;
}

export function getRestaurantSummary() {
  return invokeRestaurant<RestaurantSummary>('summary');
}

export function getGuestMenu() {
  return invokeMenu<MenuProduct[]>('guest_menu');
}

export function getGuestStay() {
  return invokeMenu<GuestStay | null>('guest_stay');
}

export function placeGuestOrder(input: {
  items: Array<{ productId: string; quantity: number; notes?: string }>;
  notes?: string;
  roomName?: string;
  bookingId?: string;
  deliveryLocation?: string;
}) {
  return invokeMenu<{ orderId: string; orderNumber: string }>('place_guest_order', input as unknown as Record<string, unknown>);
}

export function getGuestOrders() {
  return invokeMenu<GuestOrderRecord[]>('guest_orders');
}

export function getGarconMenu() {
  return invokeRestaurant<GarconMenu>('garcon_menu');
}

export function saveRestaurantProduct(input: RestaurantProductInput) {
  return invokeRestaurant<{ id: string }>('save_product', input as unknown as Record<string, unknown>);
}

export function openRestaurantTab(input: { tableCode: string; location: string; bookingId?: string }) {
  return invokeRestaurant<{ id: string; code: string }>('open_tab', input as unknown as Record<string, unknown>);
}

export function createRestaurantOrder(input: {
  tabId: string;
  origin: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number; notes?: string }>;
}) {
  return invokeRestaurant<{ id: string; order_number: string }>('create_order', input as unknown as Record<string, unknown>);
}

export function updateRestaurantOrderStatus(orderId: string, status: RestaurantOrderStatus) {
  return invokeRestaurant<{ id: string }>('update_order_status', { orderId, status });
}

export function closeRestaurantTab(input: { tabId: string; paymentMethod: RestaurantPaymentMethod; discount?: number }) {
  return invokeRestaurant<{ id: string; sale_number: string; total: number }>('close_tab', input as unknown as Record<string, unknown>);
}

export function openRestaurantCash(input: { openingAmount: number; notes?: string }) {
  return invokeRestaurant<{ id: string }>('open_cash', input as unknown as Record<string, unknown>);
}

export function closeRestaurantCash(input: { sessionId: string; closingAmount: number; notes?: string }) {
  return invokeRestaurant<{ id: string }>('close_cash', input as unknown as Record<string, unknown>);
}

export function adjustRestaurantStock(input: { productId: string; quantity: number; reason?: string }) {
  return invokeRestaurant<{ id: string; new_quantity: number }>('adjust_stock', input as unknown as Record<string, unknown>);
}
