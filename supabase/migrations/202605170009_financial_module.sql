create table if not exists public.fin_folios (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid,
  hospede_nome text not null,
  hospede_email text,
  quarto text,
  checkin date,
  checkout date,
  status text not null default 'aberto' check (status in ('aberto','fechado','cancelado')),
  total_hospedagem numeric(10,2) default 0,
  total_restaurante numeric(10,2) default 0,
  total_eventos numeric(10,2) default 0,
  total_servicos numeric(10,2) default 0,
  total_geral numeric(10,2) generated always as (
    total_hospedagem + total_restaurante + total_eventos + total_servicos
  ) stored,
  total_pago numeric(10,2) default 0,
  saldo_devedor numeric(10,2) generated always as (
    (total_hospedagem + total_restaurante + total_eventos + total_servicos) - total_pago
  ) stored,
  observacao text,
  nf_numero text,
  nf_status text default 'pendente',
  fechado_por uuid references public.profiles(id),
  fechado_em timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.fin_folio_items (
  id uuid primary key default gen_random_uuid(),
  folio_id uuid not null references public.fin_folios(id) on delete cascade,
  centro_custo text not null check (centro_custo in ('hospedagem','restaurante','eventos','servicos')),
  descricao text not null,
  quantidade numeric(10,3) default 1,
  valor_unitario numeric(10,2) not null,
  valor_total numeric(10,2) generated always as (quantidade * valor_unitario) stored,
  referencia_id uuid,
  referencia_tipo text,
  nf_numero text,
  nf_status text default 'pendente',
  lancado_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.fin_folio_payments (
  id uuid primary key default gen_random_uuid(),
  folio_id uuid not null references public.fin_folios(id) on delete cascade,
  forma_pagamento text not null check (forma_pagamento in ('dinheiro','debito','credito','pix','transferencia','faturado')),
  valor numeric(10,2) not null,
  parcelas integer default 1,
  observacao text,
  registrado_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.fin_cash_sessions (
  id uuid primary key default gen_random_uuid(),
  operador_id uuid not null references public.profiles(id),
  turno text check (turno in ('manha','tarde','noite')),
  aberto_em timestamptz default now(),
  fechado_em timestamptz,
  saldo_abertura numeric(10,2) not null default 0,
  saldo_fechamento numeric(10,2),
  saldo_esperado numeric(10,2),
  diferenca numeric(10,2),
  status text default 'aberto' check (status in ('aberto','fechado')),
  observacao text,
  created_at timestamptz default now()
);

create table if not exists public.fin_cash_movements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fin_cash_sessions(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','saida')),
  categoria text not null,
  descricao text not null,
  valor numeric(10,2) not null,
  forma_pagamento text check (forma_pagamento in ('dinheiro','debito','credito','pix','transferencia','faturado')),
  centro_custo text check (centro_custo in ('hospedagem','restaurante','eventos','servicos')),
  referencia_id uuid,
  referencia_tipo text,
  nf_numero text,
  nf_status text default 'pendente',
  registrado_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.fin_receivables (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  origem text not null,
  valor numeric(10,2) not null,
  vencimento date not null,
  status text default 'pendente' check (status in ('pendente','recebido','vencido','cancelado')),
  recebido_em timestamptz,
  forma_pagamento text,
  centro_custo text check (centro_custo in ('hospedagem','restaurante','eventos','servicos')),
  referencia_id uuid,
  observacao text,
  nf_numero text,
  nf_status text default 'pendente',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.fin_payables (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  fornecedor text,
  valor numeric(10,2) not null,
  vencimento date not null,
  status text default 'pendente' check (status in ('pendente','pago','vencido','cancelado')),
  pago_em timestamptz,
  forma_pagamento text,
  centro_custo text check (centro_custo in ('hospedagem','restaurante','eventos','servicos')),
  observacao text,
  nf_numero text,
  nf_status text default 'pendente',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index if not exists fin_folios_status_idx on public.fin_folios(status, created_at desc);
create index if not exists fin_folios_reserva_idx on public.fin_folios(reserva_id) where reserva_id is not null;
create index if not exists fin_folio_items_folio_idx on public.fin_folio_items(folio_id, created_at desc);
create index if not exists fin_folio_payments_folio_idx on public.fin_folio_payments(folio_id, created_at desc);
create index if not exists fin_cash_sessions_status_idx on public.fin_cash_sessions(status, aberto_em desc);
create index if not exists fin_cash_movements_session_idx on public.fin_cash_movements(session_id, created_at desc);
create index if not exists fin_receivables_due_idx on public.fin_receivables(vencimento, status);
create index if not exists fin_payables_due_idx on public.fin_payables(vencimento, status);

alter table public.fin_folios enable row level security;
alter table public.fin_folio_items enable row level security;
alter table public.fin_folio_payments enable row level security;
alter table public.fin_cash_sessions enable row level security;
alter table public.fin_cash_movements enable row level security;
alter table public.fin_receivables enable row level security;
alter table public.fin_payables enable row level security;

create or replace function public.can_access_financial()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'visitor') in ('master', 'admin', 'manager')
    or coalesce((auth.jwt() -> 'app_metadata' -> 'permissions' ->> 'payments')::boolean, false)
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'fin_folios',
    'fin_folio_items',
    'fin_folio_payments',
    'fin_cash_sessions',
    'fin_cash_movements',
    'fin_receivables',
    'fin_payables'
  ]
  loop
    execute format('drop policy if exists "Financial staff can read %I" on public.%I', table_name, table_name);
    execute format('create policy "Financial staff can read %I" on public.%I for select using (public.can_access_financial())', table_name, table_name);
    execute format('drop policy if exists "Financial staff can insert %I" on public.%I', table_name, table_name);
    execute format('create policy "Financial staff can insert %I" on public.%I for insert with check (public.can_access_financial())', table_name, table_name);
    execute format('drop policy if exists "Financial staff can update %I" on public.%I', table_name, table_name);
    execute format('create policy "Financial staff can update %I" on public.%I for update using (public.can_access_financial()) with check (public.can_access_financial())', table_name, table_name);
    execute format('drop policy if exists "Financial staff can delete %I" on public.%I', table_name, table_name);
    execute format('create policy "Financial staff can delete %I" on public.%I for delete using (public.can_access_financial())', table_name, table_name);
  end loop;
end $$;

do $$
declare
  v_folio uuid;
  v_cash uuid;
  v_operator uuid;
begin
  select id into v_operator
  from public.profiles
  where role in ('master','admin','manager')
  order by created_at
  limit 1;

  insert into public.fin_folios (hospede_nome, hospede_email, quarto, checkin, checkout, status, total_hospedagem, total_restaurante, total_servicos, total_pago, observacao, created_by)
  select 'Marina Costa', 'marina.costa@email.com', '102', current_date - 1, current_date + 2, 'aberto', 1320.00, 186.00, 0.00, 300.00, 'Folio aberto para estadia em andamento.', v_operator
  where not exists (select 1 from public.fin_folios where hospede_email = 'marina.costa@email.com' and quarto = '102')
  returning id into v_folio;

  if v_folio is null then
    select id into v_folio from public.fin_folios where hospede_email = 'marina.costa@email.com' and quarto = '102' limit 1;
  end if;

  insert into public.fin_folio_items (folio_id, centro_custo, descricao, quantidade, valor_unitario, referencia_tipo, lancado_por)
  select v_folio, seed.centro_custo, seed.descricao, seed.quantidade, seed.valor_unitario, seed.referencia_tipo, v_operator
  from (
    values
      ('hospedagem', 'Diarias suite superior', 3::numeric, 440.00::numeric, 'reserva'),
      ('restaurante', 'Tabua Vale do Eden', 1::numeric, 186.00::numeric, 'comanda')
  ) as seed(centro_custo, descricao, quantidade, valor_unitario, referencia_tipo)
  where not exists (
    select 1 from public.fin_folio_items existing
    where existing.folio_id = v_folio and existing.descricao = seed.descricao
  );

  insert into public.fin_folio_payments (folio_id, forma_pagamento, valor, parcelas, observacao, registrado_por)
  select v_folio, 'pix', 300.00, 1, 'Antecipacao parcial.', v_operator
  where not exists (select 1 from public.fin_folio_payments where folio_id = v_folio and valor = 300.00);

  insert into public.fin_folios (hospede_nome, hospede_email, quarto, checkin, checkout, status, total_hospedagem, total_restaurante, total_servicos, total_pago, fechado_por, fechado_em, observacao, created_by)
  select 'Rafael Lima', 'rafael.lima@email.com', '204', current_date - 5, current_date - 2, 'fechado', 1800.00, 220.00, 120.00, 2140.00, v_operator, now() - interval '2 days', 'Folio fechado no checkout.', v_operator
  where not exists (select 1 from public.fin_folios where hospede_email = 'rafael.lima@email.com' and quarto = '204')
  returning id into v_folio;

  if v_folio is null then
    select id into v_folio from public.fin_folios where hospede_email = 'rafael.lima@email.com' and quarto = '204' limit 1;
  end if;

  insert into public.fin_folio_items (folio_id, centro_custo, descricao, quantidade, valor_unitario, referencia_tipo, lancado_por)
  select v_folio, seed.centro_custo, seed.descricao, seed.quantidade, seed.valor_unitario, seed.referencia_tipo, v_operator
  from (
    values
      ('hospedagem', 'Diarias deluxe', 3::numeric, 600.00::numeric, 'reserva'),
      ('restaurante', 'Consumo frigobar e cafe', 1::numeric, 220.00::numeric, 'comanda'),
      ('servicos', 'Lavanderia expressa', 1::numeric, 120.00::numeric, 'servico')
  ) as seed(centro_custo, descricao, quantidade, valor_unitario, referencia_tipo)
  where not exists (
    select 1 from public.fin_folio_items existing
    where existing.folio_id = v_folio and existing.descricao = seed.descricao
  );

  insert into public.fin_folio_payments (folio_id, forma_pagamento, valor, parcelas, observacao, registrado_por)
  select v_folio, 'credito', 2140.00, 2, 'Pagamento no checkout.', v_operator
  where not exists (select 1 from public.fin_folio_payments where folio_id = v_folio and valor = 2140.00);

  insert into public.fin_folios (hospede_nome, hospede_email, quarto, checkin, checkout, status, total_hospedagem, total_eventos, total_pago, observacao, created_by)
  select 'Bianca Torres', 'bianca.torres@email.com', '105', current_date, current_date + 1, 'aberto', 980.00, 450.00, 0.00, 'Reserva com saldo devedor total.', v_operator
  where not exists (select 1 from public.fin_folios where hospede_email = 'bianca.torres@email.com' and quarto = '105')
  returning id into v_folio;

  if v_folio is null then
    select id into v_folio from public.fin_folios where hospede_email = 'bianca.torres@email.com' and quarto = '105' limit 1;
  end if;

  insert into public.fin_folio_items (folio_id, centro_custo, descricao, quantidade, valor_unitario, referencia_tipo, lancado_por)
  select v_folio, seed.centro_custo, seed.descricao, seed.quantidade, seed.valor_unitario, seed.referencia_tipo, v_operator
  from (
    values
      ('hospedagem', 'Diaria suite', 1::numeric, 980.00::numeric, 'reserva'),
      ('eventos', 'Mesa de degustacao privativa', 1::numeric, 450.00::numeric, 'evento')
  ) as seed(centro_custo, descricao, quantidade, valor_unitario, referencia_tipo)
  where not exists (
    select 1 from public.fin_folio_items existing
    where existing.folio_id = v_folio and existing.descricao = seed.descricao
  );

  if v_operator is not null then
    insert into public.fin_cash_sessions (operador_id, turno, saldo_abertura, status, observacao)
    select v_operator, 'manha', 350.00, 'aberto', 'Caixa seed para demonstracao.'
    where not exists (select 1 from public.fin_cash_sessions where operador_id = v_operator and status = 'aberto')
    returning id into v_cash;

    if v_cash is null then
      select id into v_cash from public.fin_cash_sessions where operador_id = v_operator and status = 'aberto' order by aberto_em desc limit 1;
    end if;

    insert into public.fin_cash_movements (session_id, tipo, categoria, descricao, valor, forma_pagamento, centro_custo, registrado_por)
    select v_cash, seed.tipo, seed.categoria, seed.descricao, seed.valor, seed.forma_pagamento, seed.centro_custo, v_operator
    from (
      values
        ('entrada', 'folio', 'Pagamento parcial Marina Costa', 300.00, 'pix', 'hospedagem'),
        ('entrada', 'servico_avulso', 'Day use piscina', 180.00, 'credito', 'servicos'),
        ('entrada', 'ota_repasse', 'Repasse manual Booking.com', 920.00, 'transferencia', 'hospedagem'),
        ('saida', 'sangria', 'Sangria preventiva do turno', 200.00, 'dinheiro', 'hospedagem'),
        ('saida', 'fornecedor', 'Compra emergencial cozinha', 145.00, 'debito', 'restaurante')
    ) as seed(tipo, categoria, descricao, valor, forma_pagamento, centro_custo)
    where not exists (
      select 1 from public.fin_cash_movements existing
      where existing.session_id = v_cash and existing.descricao = seed.descricao
    );
  end if;

  insert into public.fin_receivables (descricao, origem, valor, vencimento, status, recebido_em, forma_pagamento, centro_custo, observacao, created_by)
  select seed.descricao, seed.origem, seed.valor, seed.vencimento, seed.status, seed.recebido_em, seed.forma_pagamento, seed.centro_custo, seed.observacao, v_operator
  from (
    values
      ('Repasse Booking.com - reserva Marina Costa', 'ota_booking', 920.00, current_date + 3, 'pendente', null::timestamptz, null, 'hospedagem', 'Conciliacao manual pendente.'),
      ('Pagamento evento corporativo Serra Azul', 'evento', 2400.00, current_date - 2, 'recebido', now() - interval '1 day', 'transferencia', 'eventos', 'Recebido via transferencia.'),
      ('Repasse Airbnb - reserva antiga', 'ota_airbnb', 760.00, current_date - 4, 'vencido', null::timestamptz, null, 'hospedagem', 'Aguardando contato OTA.')
  ) as seed(descricao, origem, valor, vencimento, status, recebido_em, forma_pagamento, centro_custo, observacao)
  where not exists (select 1 from public.fin_receivables existing where existing.descricao = seed.descricao);

  insert into public.fin_payables (descricao, fornecedor, valor, vencimento, status, pago_em, forma_pagamento, centro_custo, observacao, created_by)
  select seed.descricao, seed.fornecedor, seed.valor, seed.vencimento, seed.status, seed.pago_em, seed.forma_pagamento, seed.centro_custo, seed.observacao, v_operator
  from (
    values
      ('Reposicao de enxoval', 'Têxtil Gramado', 1380.00, current_date + 4, 'pendente', null::timestamptz, null, 'hospedagem', 'Compra programada.'),
      ('Hortifruti da semana', 'Verde Serra Alimentos', 620.00, current_date - 1, 'pago', now() - interval '12 hours', 'pix', 'restaurante', 'Pago no fechamento anterior.'),
      ('Manutencao preventiva SPA', 'Clima Sul Serviços', 890.00, current_date, 'pendente', null::timestamptz, null, 'servicos', 'Vence hoje.')
  ) as seed(descricao, fornecedor, valor, vencimento, status, pago_em, forma_pagamento, centro_custo, observacao)
  where not exists (select 1 from public.fin_payables existing where existing.descricao = seed.descricao);
end $$;
