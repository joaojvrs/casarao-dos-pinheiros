alter table public.bookings
  drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check
  check (status in ('pending', 'confirmed', 'checked_in', 'checked_out', 'no_show', 'cancelled', 'completed'));

alter table public.bookings
  drop constraint if exists bookings_no_date_overlap;

alter table public.bookings
  add constraint bookings_no_date_overlap
  exclude using gist (
    accommodation_id with =,
    daterange(check_in, check_out, '[)') with &&
  )
  where (status in ('pending', 'confirmed', 'checked_in'));

alter table public.hk_rooms
  drop constraint if exists hk_rooms_status_check;

alter table public.hk_rooms
  add constraint hk_rooms_status_check
  check (status in ('limpo','sujo','em_limpeza','bloqueado','em_manutencao','ocupado'));

create table if not exists public.fd_room_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  room_id uuid not null references public.hk_rooms(id),
  quarto_numero text not null,
  checkin_previsto date not null,
  checkout_previsto date not null,
  checkin_real timestamptz,
  checkout_real timestamptz,
  status text not null default 'reservado' check (status in ('reservado','checked_in','checked_out','no_show','cancelado')),
  folio_id uuid references public.fin_folios(id),
  adultos integer default 1,
  criancas integer default 0,
  observacao text,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(booking_id, room_id)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fd_room_assignments_folio_id_fkey'
  ) then
    alter table public.fd_room_assignments
      add constraint fd_room_assignments_folio_id_fkey
      foreign key (folio_id) references public.fin_folios(id);
  end if;
end $$;

create table if not exists public.fd_key_events (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.fd_room_assignments(id) on delete cascade,
  room_id uuid not null references public.hk_rooms(id),
  tipo text not null check (tipo in ('emitida','reemitida','devolvida','bloqueada')),
  identificador text,
  motivo text,
  emitido_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.fd_guest_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id),
  nome text not null,
  email text,
  telefone text,
  cpf text,
  data_nascimento date,
  nacionalidade text default 'Brasileira',
  preferencias jsonb default '{}',
  observacoes_internas text,
  total_estadias integer default 0,
  total_gasto numeric(10,2) default 0,
  ultima_estadia date,
  classificacao text default 'regular' check (classificacao in ('regular','vip','problema','bloqueado')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.fd_incidents (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.fd_room_assignments(id),
  guest_profile_id uuid references public.fd_guest_profiles(id),
  tipo text not null check (tipo in ('reclamacao','solicitacao','dano','extravio','elogio','seguranca','outro')),
  descricao text not null,
  status text default 'aberto' check (status in ('aberto','em_tratamento','resolvido')),
  registrado_por uuid references public.profiles(id),
  resolvido_por uuid references public.profiles(id),
  resolucao text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists fd_room_assignments_status_idx on public.fd_room_assignments(status, checkin_previsto, checkout_previsto);
create index if not exists fd_room_assignments_room_idx on public.fd_room_assignments(room_id, checkin_previsto, checkout_previsto);
create index if not exists fd_key_events_assignment_idx on public.fd_key_events(assignment_id, created_at desc);
create unique index if not exists fd_guest_profiles_email_key on public.fd_guest_profiles(lower(email)) where email is not null;
create index if not exists fd_guest_profiles_email_idx on public.fd_guest_profiles(lower(email));
create index if not exists fd_incidents_status_idx on public.fd_incidents(status, created_at desc);

alter table public.fd_room_assignments enable row level security;
alter table public.fd_key_events enable row level security;
alter table public.fd_guest_profiles enable row level security;
alter table public.fd_incidents enable row level security;

create or replace function public.can_manage_frontdesk()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'visitor') in ('master', 'admin', 'manager')
$$;

create or replace function public.can_access_frontdesk()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'visitor') in ('attendant', 'master', 'admin', 'manager')
    or coalesce((auth.jwt() -> 'app_metadata' -> 'permissions' ->> 'bookings')::boolean, false)
    or coalesce((auth.jwt() -> 'app_metadata' -> 'permissions' ->> 'guests')::boolean, false)
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['fd_room_assignments','fd_key_events','fd_guest_profiles','fd_incidents']
  loop
    execute format('drop policy if exists "Frontdesk staff can read %I" on public.%I', table_name, table_name);
    execute format('create policy "Frontdesk staff can read %I" on public.%I for select using (public.can_access_frontdesk())', table_name, table_name);
    execute format('drop policy if exists "Frontdesk staff can insert %I" on public.%I', table_name, table_name);
    execute format('create policy "Frontdesk staff can insert %I" on public.%I for insert with check (public.can_access_frontdesk())', table_name, table_name);
    execute format('drop policy if exists "Frontdesk staff can update %I" on public.%I', table_name, table_name);
    execute format('create policy "Frontdesk staff can update %I" on public.%I for update using (public.can_access_frontdesk()) with check (public.can_access_frontdesk())', table_name, table_name);
  end loop;
end $$;

do $$
declare
  v_operator uuid;
  v_guest_id uuid;
  v_booking_id uuid;
  v_room_id uuid;
  v_folio_id uuid;
  v_assignment_id uuid;
  v_seed record;
begin
  select id into v_operator from public.profiles where role in ('master','admin','manager','attendant') order by created_at limit 1;

  insert into public.accommodations (id, name, capacity, nightly_rate, active)
  values
    ('fd-202', 'UH 202 Front Desk', 2, 168000, true),
    ('fd-204', 'UH 204 Front Desk', 4, 158000, true)
  on conflict (id) do nothing;

  insert into public.fd_guest_profiles (nome, email, telefone, cpf, preferencias, classificacao, total_estadias, total_gasto, ultima_estadia)
  values
    ('Marina Costa', 'marina.frontdesk@email.com', '+55 54 99999-2211', '11122233344', '{"andar":"alto","cama":"casal","travesseiro":"extra"}', 'vip', 4, 8200.00, current_date - 45),
    ('Rafael Lima', 'rafael.frontdesk@email.com', '+55 54 98888-1020', '22233344455', '{"alergias":"nozes","fumante":false}', 'regular', 1, 2140.00, current_date - 2),
    ('Bianca Torres', 'bianca.frontdesk@email.com', '+55 54 97777-3030', '33344455566', '{"andar":"terreo","observacao":"prefere check-out tardio"}', 'problema', 2, 3900.00, current_date - 90)
  on conflict do nothing;

  insert into public.guests (name, cpf, phone, email)
  values
    ('Marina Costa', '11122233344', '+55 54 99999-2211', 'marina.frontdesk@email.com'),
    ('Rafael Lima', '22233344455', '+55 54 98888-1020', 'rafael.frontdesk@email.com'),
    ('Bianca Torres', '33344455566', '+55 54 97777-3030', 'bianca.frontdesk@email.com'),
    ('Lucas Andrade', '44455566677', '+55 54 96666-4040', 'lucas.frontdesk@email.com'),
    ('Helena Prado', '55566677788', '+55 54 95555-5050', 'helena.frontdesk@email.com')
  on conflict (cpf) do update set name = excluded.name, phone = excluded.phone, email = excluded.email, updated_at = now();

  for v_seed in
    select *
    from (
      values
        ('FD-MARINA', 'Marina Costa', '11122233344', 'suica', '101', current_date, current_date + 3, 'checked_in', 168000, 504000, 2, 0),
        ('FD-RAFAEL', 'Rafael Lima', '22233344455', 'mata', '104', current_date, current_date + 2, 'checked_in', 158000, 316000, 2, 1),
        ('FD-BIANCA', 'Bianca Torres', '33344455566', 'casarao', '102', current_date - 2, current_date, 'checked_in', 92000, 184000, 1, 0),
        ('FD-LUCAS', 'Lucas Andrade', '44455566677', 'fd-202', '202', current_date + 1, current_date + 4, 'confirmed', 168000, 504000, 2, 0),
        ('FD-HELENA', 'Helena Prado', '55566677788', 'fd-204', '204', current_date + 1, current_date + 3, 'confirmed', 158000, 316000, 2, 2)
    ) as seed(code, guest_name, cpf, accommodation_id, room_number, check_in, check_out, booking_status, lodging_total, total, adults, children)
  loop
    v_booking_id := null;
    v_room_id := null;
    v_folio_id := null;
    v_assignment_id := null;

    select id into v_guest_id from public.guests where cpf = v_seed.cpf;
    select id into v_room_id from public.hk_rooms where numero = v_seed.room_number;

    insert into public.bookings (confirmation_code, guest_id, accommodation_id, status, check_in, check_out, guests_count, lodging_total, extras_total, experiences_total, total, source)
    select v_seed.code, v_guest_id, v_seed.accommodation_id, v_seed.booking_status, v_seed.check_in, v_seed.check_out, v_seed.adults + v_seed.children, v_seed.lodging_total, 0, 0, v_seed.total, 'frontdesk_seed'
    where not exists (select 1 from public.bookings existing where existing.confirmation_code = v_seed.code)
    returning id into v_booking_id;

    if v_booking_id is null then
      select id into v_booking_id from public.bookings where confirmation_code = v_seed.code limit 1;
    end if;

    v_folio_id := null;
    if v_seed.booking_status = 'checked_in' then
      insert into public.fin_folios (reserva_id, hospede_nome, hospede_email, quarto, checkin, checkout, status, total_hospedagem, total_pago, created_by)
      select v_booking_id, v_seed.guest_name, guest.email, v_seed.room_number, v_seed.check_in, v_seed.check_out, 'aberto', v_seed.total / 100.0, 0.00, v_operator
      from public.guests guest
      where guest.id = v_guest_id
        and not exists (select 1 from public.fin_folios existing where existing.reserva_id = v_booking_id)
      returning id into v_folio_id;

      if v_folio_id is null then
        select id into v_folio_id from public.fin_folios where reserva_id = v_booking_id limit 1;
      end if;
    end if;

    insert into public.fd_room_assignments (booking_id, room_id, quarto_numero, checkin_previsto, checkout_previsto, checkin_real, status, folio_id, adultos, criancas, assigned_by)
    select v_booking_id, v_room_id, v_seed.room_number, v_seed.check_in, v_seed.check_out,
      case when v_seed.booking_status = 'checked_in' then now() - interval '2 hours' else null end,
      case when v_seed.booking_status = 'checked_in' then 'checked_in' else 'reservado' end,
      v_folio_id,
      v_seed.adults,
      v_seed.children,
      v_operator
    where not exists (
      select 1 from public.fd_room_assignments existing
      where existing.booking_id = v_booking_id and existing.room_id = v_room_id
    )
    returning id into v_assignment_id;

    update public.hk_rooms set status = 'ocupado', updated_at = now()
    where id = v_room_id
      and exists (select 1 from public.fd_room_assignments where id = v_assignment_id and status = 'checked_in');

    insert into public.fd_key_events (assignment_id, room_id, tipo, identificador, emitido_por)
    select v_assignment_id, v_room_id, 'emitida', 'CARD-' || right(v_assignment_id::text, 4), v_operator
    where v_assignment_id is not null
      and exists (select 1 from public.fd_room_assignments where id = v_assignment_id and status = 'checked_in')
      and not exists (select 1 from public.fd_key_events existing where existing.assignment_id = v_assignment_id and existing.tipo = 'emitida');
  end loop;

  insert into public.fd_incidents (assignment_id, guest_profile_id, tipo, descricao, status, registrado_por, resolucao, resolvido_por)
  select assignment.id, profile.id, seed.tipo, seed.descricao, seed.status, v_operator, seed.resolucao, case when seed.status = 'resolvido' then v_operator else null end
  from (
    values
      ('FD-MARINA', 'solicitacao', 'Hospede solicitou travesseiros extras antes do check-in.', 'aberto', null),
      ('FD-BIANCA', 'reclamacao', 'Relatou ruido no corredor durante a noite. Resolvido com troca de quarto em estadia anterior.', 'resolvido', 'Pedido de desculpas registrado e cortesia aplicada.')
  ) as seed(code, tipo, descricao, status, resolucao)
  join public.bookings booking on booking.confirmation_code = seed.code
  join public.fd_room_assignments assignment on assignment.booking_id = booking.id
  join public.guests guest on guest.id = booking.guest_id
  left join public.fd_guest_profiles profile on lower(profile.email) = lower(guest.email)
  where not exists (select 1 from public.fd_incidents existing where existing.descricao = seed.descricao);
end $$;
