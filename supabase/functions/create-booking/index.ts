import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ExtraCode = 'extra_mattress' | 'crib';

interface BookingRequest {
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
  extras: Array<{
    code: ExtraCode;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  experiences: string[];
  notes?: string;
}

const EXTRA_PRICES: Record<ExtraCode, { name: string; unitPrice: number; max: number }> = {
  extra_mattress: { name: 'Adicional de colchao', unitPrice: 12000, max: 3 },
  crib: { name: 'Adicional de berco', unitPrice: 8000, max: 2 },
};

const EXPERIENCE_UNIT_PRICE = 16000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, '');
}

function isValidCpf(cpfValue: string) {
  const cpf = normalizeCpf(cpfValue);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digit = (factor: number) => {
    let total = 0;
    for (let i = 0; i < factor - 1; i += 1) total += Number(cpf[i]) * (factor - i);
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return digit(10) === Number(cpf[9]) && digit(11) === Number(cpf[10]);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function daysBetween(checkIn: string, checkOut: string) {
  return Math.round((new Date(`${checkOut}T00:00:00Z`).getTime() - new Date(`${checkIn}T00:00:00Z`).getTime()) / 86400000);
}

function confirmationCode() {
  return `VDE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const payload = await req.json() as BookingRequest;
    const cpf = normalizeCpf(payload.guest?.cpf || '');
    const today = new Date().toISOString().slice(0, 10);

    if (!payload.accommodationId) return json({ error: 'Selecione uma acomodacao.' }, 400);
    if (!isIsoDate(payload.checkIn) || !isIsoDate(payload.checkOut)) return json({ error: 'Informe check-in e checkout validos.' }, 400);
    if (payload.checkIn < today) return json({ error: 'O check-in nao pode ser no passado.' }, 400);
    if (payload.checkOut <= payload.checkIn) return json({ error: 'O checkout precisa ser posterior ao check-in.' }, 400);
    if (daysBetween(payload.checkIn, payload.checkOut) > 60) return json({ error: 'Hospedagens acima de 60 diarias precisam de aprovacao manual.' }, 400);
    if (!payload.guest?.name || payload.guest.name.trim().length < 3) return json({ error: 'Informe o nome completo do hospede.' }, 400);
    if (!isValidCpf(cpf)) return json({ error: 'Informe um CPF valido.' }, 400);
    if (!payload.guest?.phone || payload.guest.phone.replace(/\D/g, '').length < 10) return json({ error: 'Informe um telefone valido.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.guest?.email || '')) return json({ error: 'Informe um e-mail valido.' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Backend sem configuracao do Supabase.' }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: accommodation, error: accommodationError } = await supabase
      .from('accommodations')
      .select('id, name, capacity, nightly_rate, active')
      .eq('id', payload.accommodationId)
      .eq('active', true)
      .single();

    if (accommodationError || !accommodation) return json({ error: 'Acomodacao indisponivel para reserva.' }, 404);

    const safeExtras = (payload.extras || [])
      .filter(extra => extra.quantity > 0)
      .map(extra => {
        const rule = EXTRA_PRICES[extra.code];
        if (!rule) throw new Error('Adicional invalido.');
        if (!Number.isInteger(extra.quantity) || extra.quantity < 0 || extra.quantity > rule.max) {
          throw new Error(`Quantidade invalida para ${rule.name}.`);
        }
        return { code: extra.code, name: rule.name, quantity: extra.quantity, unit_price: rule.unitPrice };
      });

    const extraMattressQty = safeExtras.find(extra => extra.code === 'extra_mattress')?.quantity || 0;
    if (!Number.isInteger(payload.guestsCount) || payload.guestsCount <= 0 || payload.guestsCount > accommodation.capacity + extraMattressQty) {
      return json({ error: 'Quantidade de hospedes excede a capacidade permitida para esta acomodacao.' }, 400);
    }

    const experiences = Array.from(new Set((payload.experiences || []).map(item => String(item).trim()).filter(Boolean)));
    if (experiences.length > 8) return json({ error: 'Selecione no maximo 8 experiencias por hospedagem.' }, 400);

    const { count: overlapping, error: overlapError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('accommodation_id', payload.accommodationId)
      .in('status', ['pending', 'confirmed'])
      .lt('check_in', payload.checkOut)
      .gt('check_out', payload.checkIn);

    if (overlapError) throw overlapError;
    if ((overlapping || 0) > 0) return json({ error: 'Esta acomodacao ja possui hospedagem nesse periodo.' }, 409);

    const nights = daysBetween(payload.checkIn, payload.checkOut);
    const lodgingTotal = accommodation.nightly_rate * nights;
    const extrasTotal = safeExtras.reduce((sum, extra) => sum + extra.quantity * extra.unit_price, 0);
    const experiencesTotal = experiences.length * EXPERIENCE_UNIT_PRICE;
    const total = lodgingTotal + extrasTotal + experiencesTotal;

    const { data: booking, error: bookingError } = await supabase.rpc('create_booking_atomic', {
      p_guest: {
        cpf,
        name: payload.guest.name.trim(),
        phone: payload.guest.phone.trim(),
        email: payload.guest.email.trim().toLowerCase(),
      },
      p_booking: {
        confirmation_code: confirmationCode(),
        accommodation_id: accommodation.id,
        status: 'confirmed',
        check_in: payload.checkIn,
        check_out: payload.checkOut,
        guests_count: payload.guestsCount,
        lodging_total: lodgingTotal,
        extras_total: extrasTotal,
        experiences_total: experiencesTotal,
        total,
        notes: payload.notes?.trim() || null,
      },
      p_extras: safeExtras,
      p_experiences: experiences.map(name => ({ name, unit_price: EXPERIENCE_UNIT_PRICE })),
    });

    if (bookingError) {
      if (bookingError.code === '23P01') return json({ error: 'Esta acomodacao acabou de ser reservada nesse periodo.' }, 409);
      throw bookingError;
    }

    const guestEmail = payload.guest.email.trim().toLowerCase();
    const { error: profileRoleError } = await supabase
      .from('profiles')
      .update({
        role: 'guest',
        permissions: {},
        updated_at: new Date().toISOString(),
      })
      .eq('email', guestEmail)
      .eq('role', 'visitor');

    if (profileRoleError) throw profileRoleError;

    return json({
      booking,
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao criar hospedagem.';
    return json({ error: message }, 500);
  }
});
