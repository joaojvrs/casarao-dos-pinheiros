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
  notes: string;
}

export interface CreateBookingResult {
  bookingId: string;
  confirmationCode: string;
  status: 'pending' | 'confirmed';
  nights: number;
  total: number;
}
