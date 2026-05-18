create table if not exists public.hk_rooms (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  andar integer not null,
  tipo text not null check (tipo in ('standard','superior','suite','deluxe')),
  capacidade integer not null default 2,
  status text not null default 'limpo' check (status in ('limpo','sujo','em_limpeza','bloqueado','em_manutencao')),
  camareira_id uuid references public.profiles(id),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.hk_cleaning_logs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.hk_rooms(id) on delete cascade,
  camareira_id uuid references public.profiles(id),
  iniciado_em timestamptz,
  concluido_em timestamptz,
  checklist jsonb default '[]',
  observacao text,
  status text default 'pendente' check (status in ('pendente','em_andamento','concluido')),
  created_at timestamptz default now()
);

create table if not exists public.hk_maintenance_orders (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.hk_rooms(id) on delete set null,
  local_livre text,
  categoria text not null check (categoria in ('eletrica','hidraulica','climatizacao','mobiliario','outros')),
  descricao text not null,
  prioridade text not null default 'media' check (prioridade in ('alta','media','baixa')),
  status text not null default 'aberta' check (status in ('aberta','em_andamento','concluida','cancelada')),
  responsavel_id uuid references public.profiles(id),
  aberta_por uuid references public.profiles(id),
  foto_url text,
  resolucao text,
  aberta_em timestamptz default now(),
  concluida_em timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.hk_maintenance_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.hk_maintenance_orders(id) on delete cascade,
  status text not null,
  descricao text,
  feito_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.hk_lost_found (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.hk_rooms(id) on delete set null,
  descricao text not null,
  foto_url text,
  encontrado_por uuid references public.profiles(id),
  encontrado_em timestamptz default now(),
  local_guarda text,
  hospede_nome text,
  hospede_contato text,
  reserva_id uuid,
  status text default 'aguardando' check (status in ('aguardando','notificado','devolvido','descartado')),
  notificado_em timestamptz,
  devolvido_em timestamptz,
  devolvido_para text,
  created_at timestamptz default now()
);

create index if not exists hk_rooms_status_idx on public.hk_rooms(status);
create index if not exists hk_rooms_camareira_idx on public.hk_rooms(camareira_id);
create index if not exists hk_cleaning_logs_room_idx on public.hk_cleaning_logs(room_id, created_at desc);
create index if not exists hk_cleaning_logs_camareira_idx on public.hk_cleaning_logs(camareira_id, created_at desc);
create index if not exists hk_maintenance_orders_status_idx on public.hk_maintenance_orders(status, prioridade, aberta_em desc);
create index if not exists hk_maintenance_orders_room_idx on public.hk_maintenance_orders(room_id);
create index if not exists hk_lost_found_status_idx on public.hk_lost_found(status, created_at desc);

alter table public.hk_rooms enable row level security;
alter table public.hk_cleaning_logs enable row level security;
alter table public.hk_maintenance_orders enable row level security;
alter table public.hk_maintenance_events enable row level security;
alter table public.hk_lost_found enable row level security;

create or replace function public.can_manage_housekeeping()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'visitor') in ('master', 'admin', 'manager')
    or coalesce((auth.jwt() -> 'app_metadata' -> 'permissions' ->> 'housekeeping')::boolean, false)
$$;

create or replace function public.is_housekeeping_staff()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'visitor') = 'housekeeping'
$$;

drop policy if exists "Housekeeping can read rooms" on public.hk_rooms;
create policy "Housekeeping can read rooms"
  on public.hk_rooms for select
  using (public.can_manage_housekeeping() or public.is_housekeeping_staff());

drop policy if exists "Housekeeping managers can update rooms" on public.hk_rooms;
create policy "Housekeeping managers can update rooms"
  on public.hk_rooms for update
  using (
    public.can_manage_housekeeping()
    or (public.is_housekeeping_staff() and camareira_id = auth.uid())
  )
  with check (
    public.can_manage_housekeeping()
    or (public.is_housekeeping_staff() and (camareira_id = auth.uid() or camareira_id is null))
  );

drop policy if exists "Housekeeping can read own cleaning logs" on public.hk_cleaning_logs;
create policy "Housekeeping can read own cleaning logs"
  on public.hk_cleaning_logs for select
  using (public.can_manage_housekeeping() or camareira_id = auth.uid());

drop policy if exists "Housekeeping can insert own cleaning logs" on public.hk_cleaning_logs;
create policy "Housekeeping can insert own cleaning logs"
  on public.hk_cleaning_logs for insert
  with check (public.can_manage_housekeeping() or camareira_id = auth.uid());

drop policy if exists "Housekeeping can update own cleaning logs" on public.hk_cleaning_logs;
create policy "Housekeeping can update own cleaning logs"
  on public.hk_cleaning_logs for update
  using (public.can_manage_housekeeping() or camareira_id = auth.uid())
  with check (public.can_manage_housekeeping() or camareira_id = auth.uid());

drop policy if exists "Housekeeping can read maintenance orders" on public.hk_maintenance_orders;
create policy "Housekeeping can read maintenance orders"
  on public.hk_maintenance_orders for select
  using (public.can_manage_housekeeping() or public.is_housekeeping_staff());

drop policy if exists "Housekeeping can insert maintenance orders" on public.hk_maintenance_orders;
create policy "Housekeeping can insert maintenance orders"
  on public.hk_maintenance_orders for insert
  with check (public.can_manage_housekeeping() or public.is_housekeeping_staff());

drop policy if exists "Housekeeping managers can update maintenance orders" on public.hk_maintenance_orders;
create policy "Housekeeping managers can update maintenance orders"
  on public.hk_maintenance_orders for update
  using (public.can_manage_housekeeping() or responsavel_id = auth.uid() or aberta_por = auth.uid())
  with check (public.can_manage_housekeeping() or responsavel_id = auth.uid() or aberta_por = auth.uid());

drop policy if exists "Housekeeping can read maintenance events" on public.hk_maintenance_events;
create policy "Housekeeping can read maintenance events"
  on public.hk_maintenance_events for select
  using (
    public.can_manage_housekeeping()
    or public.is_housekeeping_staff()
  );

drop policy if exists "Housekeeping can insert maintenance events" on public.hk_maintenance_events;
create policy "Housekeeping can insert maintenance events"
  on public.hk_maintenance_events for insert
  with check (public.can_manage_housekeeping() or public.is_housekeeping_staff());

drop policy if exists "Housekeeping managers can read lost found" on public.hk_lost_found;
create policy "Housekeeping managers can read lost found"
  on public.hk_lost_found for select
  using (public.can_manage_housekeeping());

drop policy if exists "Housekeeping managers can insert lost found" on public.hk_lost_found;
create policy "Housekeeping managers can insert lost found"
  on public.hk_lost_found for insert
  with check (public.can_manage_housekeeping());

drop policy if exists "Housekeeping managers can update lost found" on public.hk_lost_found;
create policy "Housekeeping managers can update lost found"
  on public.hk_lost_found for update
  using (public.can_manage_housekeeping())
  with check (public.can_manage_housekeeping());

insert into public.hk_rooms (numero, andar, tipo, capacidade, status) values
  ('101', 1, 'standard',  2, 'limpo'),
  ('102', 1, 'standard',  2, 'sujo'),
  ('103', 1, 'superior',  3, 'em_limpeza'),
  ('104', 1, 'superior',  2, 'limpo'),
  ('105', 1, 'suite',     4, 'bloqueado'),
  ('201', 2, 'standard',  2, 'sujo'),
  ('202', 2, 'standard',  2, 'limpo'),
  ('203', 2, 'superior',  3, 'em_manutencao'),
  ('204', 2, 'deluxe',    4, 'limpo'),
  ('205', 2, 'suite',     4, 'em_limpeza')
on conflict (numero) do nothing;

insert into public.hk_maintenance_orders (room_id, local_livre, categoria, descricao, prioridade, status, resolucao, aberta_em, concluida_em)
select room.id, seed.local_livre, seed.categoria, seed.descricao, seed.prioridade, seed.status, seed.resolucao, seed.aberta_em, seed.concluida_em
from (
  values
    ('203', null, 'climatizacao', 'Ar-condicionado nao resfria adequadamente.', 'alta', 'aberta', null, now() - interval '2 hours', null),
    ('105', null, 'mobiliario', 'Fechadura do armario emperrada.', 'media', 'aberta', null, now() - interval '4 hours', null),
    ('102', null, 'hidraulica', 'Vazamento leve no sifao do banheiro.', 'media', 'em_andamento', null, now() - interval '1 day', null),
    (null, 'Corredor 2º andar', 'eletrica', 'Luminaria oscilando proxima ao elevador.', 'baixa', 'concluida', 'Luminaria revisada e lampada substituida.', now() - interval '3 days', now() - interval '2 days')
) as seed(numero, local_livre, categoria, descricao, prioridade, status, resolucao, aberta_em, concluida_em)
left join public.hk_rooms room on room.numero = seed.numero
where not exists (
  select 1 from public.hk_maintenance_orders existing where existing.descricao = seed.descricao
);

insert into public.hk_maintenance_events (order_id, status, descricao, created_at)
select id, status, case when status = 'concluida' then 'Ordem concluida' else 'Ordem aberta' end, aberta_em
from public.hk_maintenance_orders
where not exists (
  select 1 from public.hk_maintenance_events event where event.order_id = hk_maintenance_orders.id
);

insert into public.hk_lost_found (room_id, descricao, local_guarda, hospede_nome, hospede_contato, status, notificado_em, devolvido_em, devolvido_para, created_at)
select room.id, seed.descricao, seed.local_guarda, seed.hospede_nome, seed.hospede_contato, seed.status, seed.notificado_em, seed.devolvido_em, seed.devolvido_para, seed.created_at
from (
  values
    ('102', 'Carregador USB-C branco encontrado na mesa lateral.', 'Armario governanca - gaveta 3', null, null, 'aguardando', null, null, null, now() - interval '5 hours'),
    ('201', 'Oculos de sol com armação preta.', 'Armario governanca - prateleira 1', 'Marina Costa', '+55 54 99999-2211', 'notificado', now() - interval '1 day', null, null, now() - interval '2 days'),
    ('104', 'Livro de capa azul deixado no criado-mudo.', 'Recepcao', 'Rafael Lima', '+55 54 98888-1020', 'devolvido', now() - interval '4 days', now() - interval '3 days', 'Rafael Lima', now() - interval '5 days')
) as seed(numero, descricao, local_guarda, hospede_nome, hospede_contato, status, notificado_em, devolvido_em, devolvido_para, created_at)
left join public.hk_rooms room on room.numero = seed.numero
where not exists (
  select 1 from public.hk_lost_found existing where existing.descricao = seed.descricao
);
