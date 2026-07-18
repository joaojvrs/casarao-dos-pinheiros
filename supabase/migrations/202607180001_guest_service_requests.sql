-- Guest-initiated service requests (housekeeping / amenities from the Guest Portal).
-- Before this migration these requests lived only in the browser's memory and never
-- reached the team. Now they are persisted, linked to the booking, and consumed by the
-- Attendant Portal (via service-role edge functions with polling).

create table if not exists public.guest_service_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  guest_name text,
  room_name text,
  scheduled_time text,
  services jsonb not null default '[]'::jsonb,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'cancelled')),
  handled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guest_service_requests_status_idx
  on public.guest_service_requests(status, created_at desc);
create index if not exists guest_service_requests_booking_idx
  on public.guest_service_requests(booking_id);

-- Access is exclusively through service-role edge functions (menu-operations for guests,
-- attendant-operations for staff). RLS is enabled with no permissive policies so that
-- anon/authenticated clients cannot read or write the table directly.
alter table public.guest_service_requests enable row level security;
