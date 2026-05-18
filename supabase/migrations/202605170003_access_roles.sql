alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('guest', 'attendant', 'kitchen', 'housekeeping', 'manager', 'admin', 'master'));

alter table public.profiles
  add column if not exists permissions jsonb not null default '{}'::jsonb;

drop policy if exists "Admins can read team profiles" on public.profiles;
create policy "Admins can read team profiles"
  on public.profiles
  for select
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'guest') in ('master', 'admin', 'manager'));

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'guest')
$$;

create or replace function public.current_app_permissions()
returns jsonb
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' -> 'permissions', '{}'::jsonb)
$$;
