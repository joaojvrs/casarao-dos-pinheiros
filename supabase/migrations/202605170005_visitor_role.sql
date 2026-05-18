alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  alter column role set default 'visitor';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('visitor', 'guest', 'attendant', 'kitchen', 'housekeeping', 'manager', 'admin', 'master'));

update public.profiles profile
set
  role = 'visitor',
  permissions = '{}'::jsonb,
  updated_at = now()
where profile.role = 'guest'
  and not exists (
    select 1
    from public.guests guest
    join public.bookings booking on booking.guest_id = guest.id
    where lower(guest.email) = lower(profile.email)
      and booking.status in ('pending', 'confirmed')
  );

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'visitor')
$$;
