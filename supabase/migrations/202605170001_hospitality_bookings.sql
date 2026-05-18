create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create table if not exists public.accommodations (
  id text primary key,
  name text not null,
  capacity integer not null check (capacity > 0),
  nightly_rate integer not null check (nightly_rate >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cpf text not null unique,
  phone text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  confirmation_code text not null unique,
  guest_id uuid not null references public.guests(id),
  accommodation_id text not null references public.accommodations(id),
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  check_in date not null,
  check_out date not null,
  guests_count integer not null check (guests_count > 0),
  nights integer generated always as (check_out - check_in) stored,
  lodging_total integer not null check (lodging_total >= 0),
  extras_total integer not null default 0 check (extras_total >= 0),
  experiences_total integer not null default 0 check (experiences_total >= 0),
  total integer not null check (total >= 0),
  notes text,
  source text not null default 'booking_portal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);

alter table public.bookings
  add constraint bookings_no_date_overlap
  exclude using gist (
    accommodation_id with =,
    daterange(check_in, check_out, '[)') with &&
  )
  where (status in ('pending', 'confirmed'));

create table if not exists public.booking_extras (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  code text not null check (code in ('extra_mattress', 'crib')),
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  total integer generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_experiences (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  name text not null,
  unit_price integer not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bookings_accommodation_dates_idx on public.bookings (accommodation_id, check_in, check_out);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists guests_cpf_idx on public.guests (cpf);

alter table public.accommodations enable row level security;
alter table public.guests enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_extras enable row level security;
alter table public.booking_experiences enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Public can read active accommodations" on public.accommodations;
create policy "Public can read active accommodations"
  on public.accommodations
  for select
  using (active = true);

insert into public.accommodations (id, name, capacity, nightly_rate, active)
values
  ('suica', 'Cabana Suica', 4, 168000, true),
  ('mata', 'Cabana da Mata', 4, 158000, true),
  ('casarao', 'Quarto do Casarao', 3, 92000, true)
on conflict (id) do update set
  name = excluded.name,
  capacity = excluded.capacity,
  nightly_rate = excluded.nightly_rate,
  active = excluded.active,
  updated_at = now();

create or replace function public.create_booking_atomic(
  p_guest jsonb,
  p_booking jsonb,
  p_extras jsonb default '[]'::jsonb,
  p_experiences jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest_id uuid;
  v_booking record;
begin
  insert into public.guests (cpf, name, phone, email, updated_at)
  values (
    p_guest->>'cpf',
    p_guest->>'name',
    p_guest->>'phone',
    p_guest->>'email',
    now()
  )
  on conflict (cpf) do update set
    name = excluded.name,
    phone = excluded.phone,
    email = excluded.email,
    updated_at = now()
  returning id into v_guest_id;

  insert into public.bookings (
    confirmation_code,
    guest_id,
    accommodation_id,
    status,
    check_in,
    check_out,
    guests_count,
    lodging_total,
    extras_total,
    experiences_total,
    total,
    notes
  )
  values (
    p_booking->>'confirmation_code',
    v_guest_id,
    p_booking->>'accommodation_id',
    coalesce(p_booking->>'status', 'confirmed'),
    (p_booking->>'check_in')::date,
    (p_booking->>'check_out')::date,
    (p_booking->>'guests_count')::integer,
    (p_booking->>'lodging_total')::integer,
    (p_booking->>'extras_total')::integer,
    (p_booking->>'experiences_total')::integer,
    (p_booking->>'total')::integer,
    nullif(p_booking->>'notes', '')
  )
  returning id, confirmation_code, status, nights, total into v_booking;

  insert into public.booking_extras (booking_id, code, name, quantity, unit_price)
  select
    v_booking.id,
    extra.code,
    extra.name,
    extra.quantity,
    extra.unit_price
  from jsonb_to_recordset(p_extras) as extra(code text, name text, quantity integer, unit_price integer);

  insert into public.booking_experiences (booking_id, name, unit_price)
  select
    v_booking.id,
    experience.name,
    experience.unit_price
  from jsonb_to_recordset(p_experiences) as experience(name text, unit_price integer);

  insert into public.audit_logs (entity, entity_id, action, metadata)
  values (
    'bookings',
    v_booking.id,
    'created',
    jsonb_build_object(
      'accommodation_id', p_booking->>'accommodation_id',
      'check_in', p_booking->>'check_in',
      'check_out', p_booking->>'check_out',
      'total', (p_booking->>'total')::integer
    )
  );

  return jsonb_build_object(
    'bookingId', v_booking.id,
    'confirmationCode', v_booking.confirmation_code,
    'status', v_booking.status,
    'nights', v_booking.nights,
    'total', v_booking.total
  );
end;
$$;
