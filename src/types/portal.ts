export type PaymentMethod = 'pix' | 'room';
export type OrderStatus = 'pending' | 'preparing' | 'delivered';
export type PaymentStatus = 'pending' | 'paid' | 'charged';
export type HKStatus = 'pending' | 'in_progress' | 'done';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface GuestOrder {
  id: string;
  room: string;
  guestName: string;
  items: OrderItem[];
  total: number;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  placedAt: string;
}

export interface HKRequest {
  id: string;
  time: string;
  services: string[];
  status: HKStatus;
  requestedAt: string;
}
