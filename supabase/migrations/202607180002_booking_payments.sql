-- Payment infrastructure ready for a real PIX gateway (Mercado Pago, Asaas, Efí, …).
-- Today payments are mocked/auto-approved. This adds:
--   1. bookings.payment_status so a booking can be "awaiting PIX" vs "paid".
--   2. booking_payments: one row per payment attempt, updatable by a gateway webhook
--      or confirmed manually by the front desk / finance team.
-- When no gateway is configured the create-booking function keeps auto-approving (mock),
-- so current behavior is preserved until credentials are plugged in.

alter table public.bookings
  add column if not exists payment_status text not null default 'paid'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'cancelled'));

create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  method text not null check (method in ('pix', 'credit_card', 'courtesy', 'owner_paid', 'cash', 'other')),
  amount integer not null default 0 check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  provider text not null default 'mock',
  provider_payment_id text,
  pix_qr_code text,
  pix_copy_paste text,
  expires_at timestamptz,
  paid_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete set null,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_payments_booking_idx on public.booking_payments(booking_id);
create index if not exists booking_payments_status_idx on public.booking_payments(status, created_at desc);
create index if not exists booking_payments_provider_ref_idx on public.booking_payments(provider, provider_payment_id);

-- Access exclusively through service-role edge functions (create-booking, payment-webhook,
-- frontdesk-operations). RLS on with no permissive policies blocks direct client access.
alter table public.booking_payments enable row level security;
