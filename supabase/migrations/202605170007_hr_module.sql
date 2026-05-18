-- Dados complementares de RH por perfil de funcionário
create table if not exists public.hr_employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade unique,
  cargo text,
  setor text check (setor in ('Recepção','Governança','Cozinha','Manutenção','Outros')),
  turno_padrao text check (turno_padrao in ('M','T','N')),
  data_admissao date,
  status text not null default 'ativo' check (status in ('ativo','afastado','ferias')),
  foto_url text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Escala semanal
create table if not exists public.hr_schedules (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  data date not null,
  turno text check (turno in ('M','T','N','F')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(employee_id, data)
);

-- Ponto eletrônico
create table if not exists public.hr_time_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  data date not null,
  entrada timestamptz,
  saida_intervalo timestamptz,
  retorno_intervalo timestamptz,
  saida timestamptz,
  horas_trabalhadas numeric generated always as (
    case when saida is not null and entrada is not null
      then round(
        extract(epoch from (
          saida - entrada -
          coalesce(retorno_intervalo - saida_intervalo, interval '0 seconds')
        )) / 3600.0,
        2
      )
      else null
    end
  ) stored,
  status text default 'no_horario' check (status in ('no_horario','atrasado','hora_extra','falta')),
  observacao text,
  registrado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(employee_id, data)
);

-- Ocorrências (atrasos, advertências, elogios)
create table if not exists public.hr_occurrences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  tipo text not null check (tipo in (
    'atraso','falta_injustificada','advertencia_verbal',
    'advertencia_escrita','elogio','outro'
  )),
  descricao text,
  data date not null,
  registrado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Métricas de produtividade (alimentadas por outros módulos)
create table if not exists public.hr_productivity (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  data date,
  metrica text,
  valor numeric,
  created_at timestamptz not null default now()
);

create index if not exists hr_employees_profile_idx on public.hr_employees(profile_id);
create index if not exists hr_employees_setor_idx on public.hr_employees(setor);
create index if not exists hr_schedules_data_idx on public.hr_schedules(data);
create index if not exists hr_schedules_employee_idx on public.hr_schedules(employee_id, data);
create index if not exists hr_time_records_data_idx on public.hr_time_records(data);
create index if not exists hr_time_records_employee_idx on public.hr_time_records(employee_id, data);
create index if not exists hr_occurrences_employee_idx on public.hr_occurrences(employee_id);
create index if not exists hr_occurrences_data_idx on public.hr_occurrences(data desc);

-- RLS
alter table public.hr_employees enable row level security;
alter table public.hr_schedules enable row level security;
alter table public.hr_time_records enable row level security;
alter table public.hr_occurrences enable row level security;
alter table public.hr_productivity enable row level security;

create or replace function public.can_manage_hr()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'visitor') in ('master', 'admin', 'manager')
    or coalesce((auth.jwt() -> 'app_metadata' -> 'permissions' ->> 'hr')::boolean, false)
$$;

-- Políticas para hr_employees
drop policy if exists "HR managers can read employees" on public.hr_employees;
create policy "HR managers can read employees"
  on public.hr_employees for select
  using (public.can_manage_hr() or profile_id = auth.uid());

drop policy if exists "HR managers can insert employees" on public.hr_employees;
create policy "HR managers can insert employees"
  on public.hr_employees for insert
  with check (public.can_manage_hr());

drop policy if exists "HR managers can update employees" on public.hr_employees;
create policy "HR managers can update employees"
  on public.hr_employees for update
  using (public.can_manage_hr());

drop policy if exists "HR managers can delete employees" on public.hr_employees;
create policy "HR managers can delete employees"
  on public.hr_employees for delete
  using (public.can_manage_hr());

-- Políticas para hr_schedules
drop policy if exists "HR managers can read schedules" on public.hr_schedules;
create policy "HR managers can read schedules"
  on public.hr_schedules for select
  using (
    public.can_manage_hr()
    or employee_id in (select id from public.hr_employees where profile_id = auth.uid())
  );

drop policy if exists "HR managers can insert schedules" on public.hr_schedules;
create policy "HR managers can insert schedules"
  on public.hr_schedules for insert
  with check (public.can_manage_hr());

drop policy if exists "HR managers can update schedules" on public.hr_schedules;
create policy "HR managers can update schedules"
  on public.hr_schedules for update
  using (public.can_manage_hr());

drop policy if exists "HR managers can delete schedules" on public.hr_schedules;
create policy "HR managers can delete schedules"
  on public.hr_schedules for delete
  using (public.can_manage_hr());

-- Políticas para hr_time_records
drop policy if exists "HR managers can read time records" on public.hr_time_records;
create policy "HR managers can read time records"
  on public.hr_time_records for select
  using (
    public.can_manage_hr()
    or employee_id in (select id from public.hr_employees where profile_id = auth.uid())
  );

drop policy if exists "HR managers can insert time records" on public.hr_time_records;
create policy "HR managers can insert time records"
  on public.hr_time_records for insert
  with check (public.can_manage_hr());

drop policy if exists "HR managers can update time records" on public.hr_time_records;
create policy "HR managers can update time records"
  on public.hr_time_records for update
  using (public.can_manage_hr());

-- Políticas para hr_occurrences
drop policy if exists "HR managers can read occurrences" on public.hr_occurrences;
create policy "HR managers can read occurrences"
  on public.hr_occurrences for select
  using (
    public.can_manage_hr()
    or employee_id in (select id from public.hr_employees where profile_id = auth.uid())
  );

drop policy if exists "HR managers can insert occurrences" on public.hr_occurrences;
create policy "HR managers can insert occurrences"
  on public.hr_occurrences for insert
  with check (public.can_manage_hr());

-- Políticas para hr_productivity
drop policy if exists "HR managers can read productivity" on public.hr_productivity;
create policy "HR managers can read productivity"
  on public.hr_productivity for select
  using (
    public.can_manage_hr()
    or employee_id in (select id from public.hr_employees where profile_id = auth.uid())
  );

drop policy if exists "HR managers can insert productivity" on public.hr_productivity;
create policy "HR managers can insert productivity"
  on public.hr_productivity for insert
  with check (public.can_manage_hr());

-- Seed: funcionários fictícios vinculados aos perfis existentes (se houver)
do $$
declare
  v_profiles uuid[];
  v_pid uuid;
  v_eid uuid;
  v_week1_start date := date_trunc('week', current_date)::date;
  v_week2_start date := (date_trunc('week', current_date) + interval '7 days')::date;
  v_setores text[]  := array['Recepção','Cozinha','Governança','Cozinha','Recepção','Manutenção'];
  v_cargos  text[]  := array['Recepcionista','Cozinheiro','Governanta','Auxiliar de Cozinha','Concierge','Técnico de Manutenção'];
  v_turnos  text[]  := array['M','T','M','N','T','M'];
  i integer;
begin
  select array_agg(id order by created_at)
    into v_profiles
    from public.profiles
   where role in ('attendant','kitchen','housekeeping','manager','admin','master')
   limit 6;

  if v_profiles is null or array_length(v_profiles, 1) = 0 then
    return;
  end if;

  for i in 1..array_length(v_profiles, 1) loop
    v_pid := v_profiles[i];

    insert into public.hr_employees
      (profile_id, cargo, setor, turno_padrao, data_admissao, status)
    values
      (v_pid, v_cargos[i], v_setores[i], v_turnos[i], current_date - interval '180 days' * i, 'ativo')
    on conflict (profile_id) do nothing
    returning id into v_eid;

    if v_eid is null then
      select id into v_eid from public.hr_employees where profile_id = v_pid;
    end if;

    if v_eid is null then continue; end if;

    -- Escala semana 1 (seg a sáb, folga domingo)
    insert into public.hr_schedules (employee_id, data, turno)
    values
      (v_eid, v_week1_start,     case when i % 2 = 0 then 'M' else v_turnos[i] end),
      (v_eid, v_week1_start + 1, case when i % 2 = 0 then 'T' else v_turnos[i] end),
      (v_eid, v_week1_start + 2, case when i % 3 = 0 then 'F' else v_turnos[i] end),
      (v_eid, v_week1_start + 3, v_turnos[i]),
      (v_eid, v_week1_start + 4, v_turnos[i]),
      (v_eid, v_week1_start + 5, case when i % 2 = 1 then 'F' else v_turnos[i] end),
      (v_eid, v_week1_start + 6, 'F')
    on conflict (employee_id, data) do nothing;

    -- Escala semana 2
    insert into public.hr_schedules (employee_id, data, turno)
    values
      (v_eid, v_week2_start,     v_turnos[i]),
      (v_eid, v_week2_start + 1, v_turnos[i]),
      (v_eid, v_week2_start + 2, 'F'),
      (v_eid, v_week2_start + 3, v_turnos[i]),
      (v_eid, v_week2_start + 4, v_turnos[i]),
      (v_eid, v_week2_start + 5, v_turnos[i]),
      (v_eid, v_week2_start + 6, 'F')
    on conflict (employee_id, data) do nothing;

    -- Ocorrências de exemplo
    if i = 1 then
      insert into public.hr_occurrences (employee_id, tipo, descricao, data)
      values (v_eid, 'elogio', 'Excelente atendimento ao hospede durante alta temporada.', current_date - 5)
      on conflict do nothing;
    end if;

    if i = 2 then
      insert into public.hr_occurrences (employee_id, tipo, descricao, data)
      values (v_eid, 'atraso', 'Chegou 25 minutos atrasado no turno da manha.', current_date - 3)
      on conflict do nothing;
    end if;

    if i = 3 then
      insert into public.hr_occurrences (employee_id, tipo, descricao, data)
      values (v_eid, 'advertencia_verbal', 'Uso de celular durante o servico.', current_date - 10)
      on conflict do nothing;
    end if;
  end loop;
end $$;
