export interface AccommodationOption {
  id: string;
  name: string;
  image: string;
  capacity: number;
  rate: number;
  mood: string;
}

export interface BookingExtraInput {
  code: 'extra_mattress' | 'crib';
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateBookingInput {
  accommodationId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  guest: {
    name: string;
    cpf: string;
    phone: string;
    email: string;
  };
  extras: BookingExtraInput[];
  experiences: string[];
  payment: {
    method: 'pix' | 'credit_card';
    holderName?: string;
    lastFour?: string;
    installments?: number;
  };
  notes: string;
}

export interface CreateBookingResult {
  bookingId: string;
  confirmationCode: string;
  status: 'pending' | 'confirmed';
  nights: number;
  total: number;
  paymentStatus: 'paid';
  paymentMethod: 'pix' | 'credit_card';
  emailStatus: 'sent' | 'mocked' | 'failed';
}

export type GuestStayStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'no_show'
  | 'cancelled'
  | 'completed';

export interface GuestStay {
  bookingId: string;
  confirmationCode: string;
  status: GuestStayStatus;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  nights: number;
  total: number;
  accommodation: {
    id: string;
    name: string;
    image: string;
  };
  guest: {
    name: string;
    email: string;
    phone: string;
  };
  room?: {
    number: string;
    status: string;
    checkinReal: string | null;
    checkoutReal: string | null;
  } | null;
  canOrder: boolean;
  phase: 'upcoming' | 'active' | 'past';
}
