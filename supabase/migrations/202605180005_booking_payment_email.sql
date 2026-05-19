create table if not exists public.booking_email_outbox (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  recipient text not null,
  subject text not null,
  body text not null,
  provider text not null default 'mock',
  status text not null default 'mocked' check (status in ('sent', 'mocked', 'failed')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists booking_email_outbox_booking_idx on public.booking_email_outbox(booking_id, created_at desc);

alter table public.booking_email_outbox enable row level security;
