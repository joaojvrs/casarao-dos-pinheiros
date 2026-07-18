import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ExtraCode = 'extra_mattress' | 'crib';
type PaymentMethod = 'pix' | 'credit_card' | 'courtesy' | 'owner_paid';

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
  payment: {
    method: PaymentMethod;
    holderName?: string;
    lastFour?: string;
    installments?: number;
  };
  notes?: string;
  lgpdConsent?: boolean;
}

type EmailStatus = 'sent' | 'mocked' | 'failed';

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

function formatBRLCents(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
}

async function getAuthenticatedUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function describePaymentMethod(method: PaymentMethod): string {
  if (method === 'courtesy') return 'Cortesia';
  if (method === 'owner_paid') return 'Pago pelo responsavel';
  if (method === 'pix') return 'PIX';
  return 'Cartao de credito';
}

async function sendInstructionsEmail(supabase: ReturnType<typeof createClient>, input: {
  bookingId: string;
  recipient: string;
  guestName: string;
  confirmationCode: string;
  checkIn: string;
  checkOut: string;
  accommodationName: string;
  total: number;
  paymentMethod: PaymentMethod;
}) {
  const isInternal = input.paymentMethod === 'courtesy' || input.paymentMethod === 'owner_paid';
  const subject = `Sua hospedagem no Vale do Eden - ${input.confirmationCode}`;
  const body = [
    `Ola, ${input.guestName}.`,
    '',
    isInternal
      ? `Sua hospedagem foi confirmada. (${describePaymentMethod(input.paymentMethod)})`
      : `Sua hospedagem foi confirmada com pagamento aprovado.`,
    `Codigo: ${input.confirmationCode}`,
    `Acomodacao: ${input.accommodationName}`,
    `Periodo: ${input.checkIn} ate ${input.checkOut}`,
    input.total > 0 ? `Total: ${formatBRLCents(input.total)}` : `Total: Cortesia (sem cobranca)`,
    `Modalidade: ${describePaymentMethod(input.paymentMethod)}`,
    '',
    'Proximos passos:',
    '1. Acesse sua conta no site e entre no Portal do Hospede.',
    '2. Leve documento com foto no check-in.',
    '3. A recepcao fara a atribuicao do quarto e emitira a chave na chegada.',
    '4. Pedidos, frigobar, experiencias e concierge ficam disponiveis no Portal do Hospede.',
    '',
    'Equipe Casarao Vale do Eden',
  ].join('\n');

  let status: EmailStatus = 'mocked';
  let provider = 'mock';
  let providerMessageId: string | null = null;
  let errorMessage: string | null = null;

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('BOOKING_EMAIL_FROM') || 'Casarao Vale do Eden <reservas@valeeden.com.br>';
  if (resendKey) {
    provider = 'resend';
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: input.recipient, subject, text: body }),
      });
      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseBody?.message || 'Falha ao enviar email.');
      status = 'sent';
      providerMessageId = responseBody?.id || null;
    } catch (error) {
      status = 'failed';
      errorMessage = error instanceof Error ? error.message : 'Falha ao enviar email.';
    }
  }

  await supabase.from('booking_email_outbox').insert({
    booking_id: input.bookingId,
    recipient: input.recipient,
    subject,
    body,
    provider,
    status,
    provider_message_id: providerMessageId,
    error: errorMessage,
  });

  return status;
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

async function createFrontdeskAssignment(supabase: ReturnType<typeof createClient>, input: {
  bookingId: string;
  accommodationId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
}) {
  const { data: mappedRooms, error: mapError } = await supabase
    .from('accommodation_room_map')
    .select('priority, hk_rooms(id, numero, status)')
    .eq('accommodation_id', input.accommodationId)
    .eq('active', true)
    .order('priority', { ascending: true });

  if (mapError) throw mapError;

  for (const mapped of mappedRooms || []) {
    const room = first(mapped.hk_rooms as Record<string, unknown> | Record<string, unknown>[] | null);
    if (!room?.id || String(room.status) !== 'limpo') continue;

    const { data: overlaps, error: overlapError } = await supabase
      .from('fd_room_assignments')
      .select('id')
      .eq('room_id', room.id)
      .in('status', ['reservado', 'checked_in'])
      .lt('checkin_previsto', input.checkOut)
      .gt('checkout_previsto', input.checkIn);

    if (overlapError) throw overlapError;
    if ((overlaps || []).length > 0) continue;

    const { data: assignment, error: assignmentError } = await supabase
      .from('fd_room_assignments')
      .insert({
        booking_id: input.bookingId,
        room_id: room.id,
        quarto_numero: room.numero,
        checkin_previsto: input.checkIn,
        checkout_previsto: input.checkOut,
        status: 'reservado',
        adultos: input.guestsCount,
        criancas: 0,
        observacao: 'Atribuicao automatica criada no fechamento da hospedagem.',
      })
      .select('id, quarto_numero')
      .single();

    if (assignmentError) throw assignmentError;
    return { status: 'assigned', assignmentId: assignment.id, roomNumber: assignment.quarto_numero };
  }

  await supabase.from('audit_logs').insert({
    entity: 'bookings',
    entity_id: input.bookingId,
    action: 'frontdesk_assignment_pending',
    metadata: {
      accommodation_id: input.accommodationId,
      check_in: input.checkIn,
      check_out: input.checkOut,
      reason: 'Nenhum quarto mapeado ou disponivel para atribuicao automatica.',
    },
  });

  return { status: 'pending_manual_assignment' };
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

    const user = await getAuthenticatedUser(req, supabase);
    if (!user?.email) return json({ error: 'Entre na sua conta para finalizar a hospedagem.' }, 401);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const isMasterOrAdmin = profile?.role === 'master' || profile?.role === 'admin';

    if (!isMasterOrAdmin && user.email.toLowerCase() !== payload.guest.email.trim().toLowerCase()) {
      return json({ error: 'A hospedagem precisa usar o e-mail da conta autenticada.' }, 403);
    }

    // LGPD: a real guest must consent to personal-data processing. Internal bookings
    // (master/admin creating courtesy/owner-paid stays) are exempt from the checkbox.
    if (!isMasterOrAdmin && payload.lgpdConsent !== true) {
      return json({ error: 'E necessario aceitar o tratamento de dados (LGPD) para concluir a hospedagem.' }, 400);
    }

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
      .in('status', ['pending', 'confirmed', 'checked_in'])
      .lt('check_in', payload.checkOut)
      .gt('check_out', payload.checkIn);

    if (overlapError) throw overlapError;
    if ((overlapping || 0) > 0) {
      return json({ error: 'Esta acomodacao ja possui uma hospedagem ativa ou confirmada nesse periodo. Escolha outra data ou outra acomodacao.' }, 409);
    }

    const nights = daysBetween(payload.checkIn, payload.checkOut);
    const paymentMethod: PaymentMethod = payload.payment?.method;
    const validMethods: PaymentMethod[] = isMasterOrAdmin
      ? ['pix', 'credit_card', 'courtesy', 'owner_paid']
      : ['pix', 'credit_card'];
    if (!validMethods.includes(paymentMethod)) {
      return json({ error: 'Metodo de pagamento invalido.' }, 400);
    }
    if (paymentMethod === 'credit_card' && !/^\d{4}$/.test(String(payload.payment?.lastFour || ''))) {
      return json({ error: 'Informe os 4 ultimos digitos do cartao para o pagamento mockado.' }, 400);
    }

    const isCourtesy = paymentMethod === 'courtesy';
    const lodgingTotal = isCourtesy ? 0 : accommodation.nightly_rate * nights;
    const extrasTotal = isCourtesy ? 0 : safeExtras.reduce((sum, extra) => sum + extra.quantity * extra.unit_price, 0);
    const experiencesTotal = isCourtesy ? 0 : experiences.length * EXPERIENCE_UNIT_PRICE;
    const total = lodgingTotal + extrasTotal + experiencesTotal;
    const experienceUnitPrice = isCourtesy ? 0 : EXPERIENCE_UNIT_PRICE;
    const extrasForDb = safeExtras.map(extra => isCourtesy ? { ...extra, unit_price: 0 } : extra);

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
      p_extras: extrasForDb,
      p_experiences: experiences.map(name => ({ name, unit_price: experienceUnitPrice })),
    });

    if (bookingError) {
      if (bookingError.code === '23P01') {
        return json({ error: 'Esta acomodacao acabou de ser reservada nesse periodo. Escolha outra data ou outra acomodacao.' }, 409);
      }
      throw bookingError;
    }

    const frontdeskAssignment = await createFrontdeskAssignment(supabase, {
      bookingId: booking.bookingId,
      accommodationId: accommodation.id,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      guestsCount: payload.guestsCount,
    });

    const guestEmail = payload.guest.email.trim().toLowerCase();

    if (paymentMethod === 'courtesy' || paymentMethod === 'owner_paid') {
      await supabase.from('bookings').update({ source: `internal_${paymentMethod}` }).eq('id', booking.bookingId);
    }

    if (payload.lgpdConsent === true) {
      await supabase.from('bookings')
        .update({ lgpd_consent: true, lgpd_consent_at: new Date().toISOString() })
        .eq('id', booking.bookingId);
    }

    if (!isMasterOrAdmin) {
      const { error: profileRoleError } = await supabase
        .from('profiles')
        .update({
          role: 'guest',
          permissions: {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .in('role', ['visitor', 'guest']);

      if (profileRoleError) throw profileRoleError;

      await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: { ...(user.app_metadata || {}), role: 'guest', permissions: {} },
        user_metadata: { ...(user.user_metadata || {}), role: 'guest' },
      });
    }

    const auditAction = paymentMethod === 'courtesy'
      ? 'internal_booking_courtesy'
      : paymentMethod === 'owner_paid'
        ? 'internal_booking_owner_paid'
        : 'mock_payment_approved';

    await supabase.from('audit_logs').insert({
      entity: 'bookings',
      entity_id: booking.bookingId,
      action: auditAction,
      metadata: {
        method: paymentMethod,
        amount: total,
        installments: paymentMethod === 'credit_card' ? (payload.payment?.installments || 1) : null,
        last_four: paymentMethod === 'credit_card' ? payload.payment?.lastFour : null,
        internal: isMasterOrAdmin,
      },
    });

    // Payment record. PIX stays "pending" only when a real gateway is configured
    // (PAYMENT_PROVIDER env); otherwise everything is auto-approved (mock), preserving
    // the current instant-confirmation behavior until credentials are plugged in.
    const gatewayProvider = Deno.env.get('PAYMENT_PROVIDER') || '';
    const paymentPending = paymentMethod === 'pix' && Boolean(gatewayProvider) && total > 0;
    const paymentStatusValue = paymentPending ? 'pending' : 'paid';
    const paymentProvider = paymentMethod === 'courtesy' || paymentMethod === 'owner_paid'
      ? 'internal'
      : (paymentPending ? gatewayProvider : 'mock');

    await supabase.from('booking_payments').insert({
      booking_id: booking.bookingId,
      method: paymentMethod,
      amount: total,
      status: paymentStatusValue,
      provider: paymentProvider,
      paid_at: paymentStatusValue === 'paid' ? new Date().toISOString() : null,
    });

    if (paymentStatusValue !== 'paid') {
      await supabase.from('bookings').update({ payment_status: paymentStatusValue }).eq('id', booking.bookingId);
    }

    const emailStatus = await sendInstructionsEmail(supabase, {
      bookingId: booking.bookingId,
      recipient: guestEmail,
      guestName: payload.guest.name.trim(),
      confirmationCode: booking.confirmationCode,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      accommodationName: accommodation.name,
      total,
      paymentMethod,
    });

    return json({
      booking: {
        ...booking,
        paymentStatus: 'paid',
        paymentMethod,
        emailStatus,
        frontdeskAssignment,
      },
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao criar hospedagem.';
    return json({ error: message }, 500);
  }
});
