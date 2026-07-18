import { createClient } from '@supabase/supabase-js';

// Generic PIX / payment gateway webhook. Deploy with verify_jwt = false because the
// caller is an external gateway, not a logged-in user. Authentication is done with a
// shared secret (PAYMENT_WEBHOOK_SECRET) sent as `?secret=` or the `x-webhook-secret`
// header. Adapt `extractEvent` to the specific provider you plug in.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface PaymentEvent {
  providerPaymentId: string | null;
  bookingId: string | null;
  status: 'paid' | 'failed' | 'refunded' | 'cancelled' | 'pending';
}

// Map a provider payload to our internal event. Extend the branches per gateway.
function extractEvent(body: Record<string, unknown>): PaymentEvent {
  // Normalized shape (also what our own tooling can send):
  const rawStatus = String(
    body.status || (body.data as Record<string, unknown>)?.status || '',
  ).toLowerCase();

  const paidStatuses = ['paid', 'approved', 'received', 'confirmed', 'completed'];
  const failedStatuses = ['failed', 'rejected', 'error'];
  const refundedStatuses = ['refunded', 'charged_back'];
  const cancelledStatuses = ['cancelled', 'canceled', 'expired'];

  let status: PaymentEvent['status'] = 'pending';
  if (paidStatuses.includes(rawStatus)) status = 'paid';
  else if (failedStatuses.includes(rawStatus)) status = 'failed';
  else if (refundedStatuses.includes(rawStatus)) status = 'refunded';
  else if (cancelledStatuses.includes(rawStatus)) status = 'cancelled';

  const data = (body.data as Record<string, unknown>) || {};
  return {
    providerPaymentId: (body.providerPaymentId || body.id || data.id) ? String(body.providerPaymentId || body.id || data.id) : null,
    bookingId: (body.bookingId || data.bookingId || body.external_reference || data.external_reference)
      ? String(body.bookingId || data.bookingId || body.external_reference || data.external_reference)
      : null,
    status,
  };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  const secret = Deno.env.get('PAYMENT_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'Webhook nao configurado.' }, 503);
  const url = new URL(req.url);
  const provided = req.headers.get('x-webhook-secret') || url.searchParams.get('secret') || '';
  if (provided !== secret) return json({ error: 'Assinatura invalida.' }, 401);

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const event = extractEvent(body);
    if (!event.providerPaymentId && !event.bookingId) {
      return json({ error: 'Evento sem identificador de pagamento.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Backend sem configuracao.' }, 500);
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Locate the payment row by provider reference, else by booking.
    let query = supabase.from('booking_payments').select('id, booking_id, status').limit(1);
    query = event.providerPaymentId
      ? query.eq('provider_payment_id', event.providerPaymentId)
      : query.eq('booking_id', event.bookingId).order('created_at', { ascending: false });
    const { data: payment, error: findError } = await query.maybeSingle();
    if (findError) throw findError;
    if (!payment) return json({ error: 'Pagamento nao encontrado.' }, 404);

    const bookingId = payment.booking_id || event.bookingId;
    const paidAt = event.status === 'paid' ? new Date().toISOString() : null;

    const { error: updateError } = await supabase
      .from('booking_payments')
      .update({ status: event.status, paid_at: paidAt, raw: body, updated_at: new Date().toISOString() })
      .eq('id', payment.id);
    if (updateError) throw updateError;

    if (bookingId) {
      const bookingUpdate: Record<string, unknown> = { payment_status: event.status };
      if (event.status === 'cancelled' || event.status === 'failed') {
        // Payment failed/expired — do not auto-cancel the booking, leave it for the team.
      }
      const { error: bookingError } = await supabase.from('bookings').update(bookingUpdate).eq('id', bookingId);
      if (bookingError) throw bookingError;

      await supabase.from('audit_logs').insert({
        entity: 'bookings',
        entity_id: bookingId,
        action: `payment_${event.status}`,
        metadata: { provider_payment_id: event.providerPaymentId, source: 'webhook' },
      });
    }

    return json({ ok: true, status: event.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar webhook.';
    return json({ error: message }, 500);
  }
});
