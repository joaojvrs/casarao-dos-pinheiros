create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text not null,
  role text not null default 'guest' check (role in ('guest', 'attendant', 'kitchen', 'housekeeping', 'manager', 'admin', 'master')),
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile basics" on public.profiles;
create policy "Users can update their own profile basics"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), 'guest'));

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
