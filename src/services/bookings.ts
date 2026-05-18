import { supabase } from '../lib/supabase';
import type { CreateBookingInput, CreateBookingResult } from '../types/booking';

interface EdgeBookingResponse {
  booking: CreateBookingResult;
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const { data, error } = await supabase.functions.invoke<EdgeBookingResponse>('create-booking', {
    body: input,
  });

  if (error) {
    const response = (error as { context?: Response }).context;
    if (response) {
      let backendMessage = '';
      try {
        const body = await response.json() as { error?: string };
        backendMessage = body.error || '';
      } catch {
        backendMessage = '';
      }
      if (backendMessage) throw new Error(backendMessage);
    }
    throw new Error(error.message || 'Nao foi possivel criar a hospedagem.');
  }

  if (!data?.booking) {
    throw new Error('A hospedagem nao retornou confirmacao do servidor.');
  }

  return data.booking;
}
