import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Action =
  | 'summary'
  | 'save_employee'
  | 'save_schedule'
  | 'save_time_record'
  | 'save_occurrence'
  | 'get_weekly_report';

interface EmployeeInput {
  id?: string;
  profileId: string;
  cargo?: string;
  setor?: string;
  turnoPadrao?: string;
  dataAdmissao?: string;
  status?: string;
  fotoUrl?: string;
  observacoes?: string;
}

interface ScheduleInput {
  employeeId: string;
  data: string;
  turno: string;
}

interface TimeRecordInput {
  employeeId: string;
  data: string;
  entrada?: string;
  saidaIntervalo?: string;
  retornoIntervalo?: string;
  saida?: string;
  observacao?: string;
}

interface OccurrenceInput {
  employeeId: string;
  tipo: string;
  descricao?: string;
  data: string;
}

const SHIFT_HOURS: Record<string, number> = { M: 6, T: 14, N: 22 };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getContext(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) throw new Error('Backend sem configuracao do Supabase.');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: requester, error } = await supabase.auth.getUser(token);
  if (error || !requester.user) return { supabase, userId: null, role: 'visitor', permissions: {} as Record<string, boolean> };

  const role = String(requester.user.app_metadata?.role || 'visitor');
  const permissions = (requester.user.app_metadata?.permissions || {}) as Record<string, boolean>;
  return { supabase, userId: requester.user.id, role, permissions };
}

function assertHRAccess(role: string, permissions: Record<string, boolean>) {
  if (['master', 'admin', 'manager'].includes(role)) return;
  if (permissions.hr) return;
  throw Object.assign(new Error('Acesso restrito ao modulo de RH.'), { status: 403 });
}

function calcTimeStatus(entrada: string | null, turno: string | null, horasTrabalhadas: number | null): string {
  if (!entrada) return 'falta';
  if (horasTrabalhadas !== null && horasTrabalhadas > 8) return 'hora_extra';
  if (turno && SHIFT_HOURS[turno] !== undefined) {
    const entradaDate = new Date(entrada);
    const expectedHour = SHIFT_HOURS[turno];
    const entradaHour = entradaDate.getUTCHours() + entradaDate.getTimezoneOffset() / -60;
    const diffMinutes = (entradaDate.getHours() * 60 + entradaDate.getMinutes()) - (expectedHour * 60);
    if (diffMinutes > 15) return 'atrasado';
  }
  return 'no_horario';
}

function calcAlerts(
  employees: { id: string; setor: string | null }[],
  schedules: { employee_id: string; data: string; turno: string }[],
  timeRecords: { employee_id: string; horas_trabalhadas: number | null }[],
  weekStart: Date,
) {
  const alerts: { type: string; message: string; severity: 'warning' | 'error' | 'info' }[] = [];

  // Group schedules by date and shift
  const byDateShift: Record<string, Record<string, string[]>> = {};
  const byDateSetor: Record<string, Record<string, string[]>> = {};

  for (const sched of schedules) {
    if (!byDateShift[sched.data]) byDateShift[sched.data] = {};
    if (!byDateShift[sched.data][sched.turno]) byDateShift[sched.data][sched.turno] = [];
    byDateShift[sched.data][sched.turno].push(sched.employee_id);

    if (sched.turno === 'F') {
      const emp = employees.find(e => e.id === sched.employee_id);
      if (emp?.setor) {
        if (!byDateSetor[sched.data]) byDateSetor[sched.data] = {};
        if (!byDateSetor[sched.data][emp.setor]) byDateSetor[sched.data][emp.setor] = [];
        byDateSetor[sched.data][emp.setor].push(sched.employee_id);
      }
    }
  }

  // Turno sem cobertura: checar se cada setor tem pelo menos 1 em cada turno ativo
  const setores = [...new Set(employees.map(e => e.setor).filter(Boolean))];
  for (let d = 0; d < 7; d++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + d);
    const dayStr = day.toISOString().slice(0, 10);

    for (const setor of setores) {
      const empIds = employees.filter(e => e.setor === setor).map(e => e.id);
      for (const shift of ['M', 'T', 'N']) {
        const scheduled = (byDateShift[dayStr]?.[shift] || []).filter(id => empIds.includes(id));
        if (scheduled.length === 0 && empIds.length > 0) {
          alerts.push({ type: 'no_coverage', message: `${setor}: sem cobertura no turno ${shift} em ${dayStr}.`, severity: 'warning' });
        }
      }
    }

    // Conflito de folga: >50% do mesmo setor de folga no mesmo dia
    for (const setor of setores) {
      const empIds = employees.filter(e => e.setor === setor).map(e => e.id);
      const onLeave = (byDateSetor[dayStr]?.[setor] || []).filter(id => empIds.includes(id));
      if (empIds.length > 0 && onLeave.length > empIds.length / 2) {
        alerts.push({ type: 'leave_conflict', message: `${setor}: mais de 50% de folga em ${dayStr}.`, severity: 'error' });
      }
    }
  }

  // Folga obrigatória: funcionário sem folga na semana
  for (const emp of employees) {
    const empSchedules = schedules.filter(s => s.employee_id === emp.id);
    const hasDayOff = empSchedules.some(s => s.turno === 'F');
    if (empSchedules.length > 0 && !hasDayOff) {
      alerts.push({ type: 'no_dayoff', message: `Funcionario sem folga na semana.`, severity: 'warning' });
    }
  }

  // Hora extra acumulada >6h na semana
  const extraByEmployee: Record<string, number> = {};
  for (const rec of timeRecords) {
    const hours = Number(rec.horas_trabalhadas || 0);
    const extra = Math.max(0, hours - 8);
    if (!extraByEmployee[rec.employee_id]) extraByEmployee[rec.employee_id] = 0;
    extraByEmployee[rec.employee_id] += extra;
  }
  for (const [empId, extra] of Object.entries(extraByEmployee)) {
    if (extra > 6) {
      alerts.push({ type: 'overtime', message: `Funcionario com ${extra.toFixed(1)}h extras acumuladas na semana.`, severity: 'warning' });
      void empId;
    }
  }

  return alerts;
}

async function summary(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const weekStartStr = String(payload.weekStart || new Date().toISOString().slice(0, 10));
  const weekStart = new Date(weekStartStr + 'T00:00:00Z');
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStart = todayStr.slice(0, 7) + '-01';

  const [employeesResult, schedulesResult, timeResult, occurrencesResult, productivityResult] = await Promise.all([
    supabase
      .from('hr_employees')
      .select('id, cargo, setor, turno_padrao, data_admissao, status, foto_url, observacoes, profiles(id, full_name, email, avatar_url: foto_url)')
      .order('created_at'),
    supabase
      .from('hr_schedules')
      .select('id, employee_id, data, turno')
      .gte('data', weekStartStr)
      .lte('data', weekEndStr)
      .order('data'),
    supabase
      .from('hr_time_records')
      .select('id, employee_id, data, entrada, saida_intervalo, retorno_intervalo, saida, horas_trabalhadas, status, observacao')
      .gte('data', weekStartStr)
      .lte('data', weekEndStr)
      .order('data', { ascending: false }),
    supabase
      .from('hr_occurrences')
      .select('id, employee_id, tipo, descricao, data, profiles!registrado_por(full_name)')
      .gte('data', monthStart)
      .order('data', { ascending: false })
      .limit(50),
    supabase
      .from('hr_productivity')
      .select('id, employee_id, data, metrica, valor')
      .gte('data', monthStart)
      .order('data', { ascending: false }),
  ]);

  for (const result of [employeesResult, schedulesResult, timeResult, occurrencesResult, productivityResult]) {
    if (result.error) throw result.error;
  }

  const employees = employeesResult.data || [];
  const schedules = schedulesResult.data || [];
  const timeRecords = timeResult.data || [];

  const alerts = calcAlerts(
    employees.map(e => ({ id: e.id, setor: e.setor })),
    schedules as { employee_id: string; data: string; turno: string }[],
    timeRecords as { employee_id: string; horas_trabalhadas: number | null }[],
    weekStart,
  );

  const onLeave = employees.filter(e => e.status !== 'ativo').length;
  const overtimeAlerts = alerts.filter(a => a.type === 'overtime').length;

  return {
    employees,
    schedules,
    timeRecords,
    occurrences: occurrencesResult.data || [],
    productivity: productivityResult.data || [],
    alerts,
    metrics: {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'ativo').length,
      onLeave,
      overtimeAlerts,
    },
  };
}

async function saveEmployee(supabase: ReturnType<typeof createClient>, input: EmployeeInput) {
  const profileId = String(input.profileId || '').trim();
  if (!profileId) throw new Error('Selecione um perfil para o funcionario.');

  const record = {
    profile_id: profileId,
    cargo: input.cargo?.trim() || null,
    setor: input.setor || null,
    turno_padrao: input.turnoPadrao || null,
    data_admissao: input.dataAdmissao || null,
    status: input.status || 'ativo',
    foto_url: input.fotoUrl?.trim() || null,
    observacoes: input.observacoes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('hr_employees')
      .update(record)
      .eq('id', input.id)
      .select('id')
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('hr_employees')
    .insert(record)
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

async function saveSchedule(supabase: ReturnType<typeof createClient>, userId: string, input: ScheduleInput) {
  const { employeeId, data, turno } = input;
  if (!employeeId) throw new Error('Funcionario nao informado.');
  if (!data) throw new Error('Data nao informada.');
  if (!['M', 'T', 'N', 'F'].includes(turno)) throw new Error('Turno invalido.');

  // Verificar se já tem registro no mesmo dia
  const { data: existing, error: existingError } = await supabase
    .from('hr_schedules')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('data', data)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    const { data: updated, error } = await supabase
      .from('hr_schedules')
      .update({ turno, created_by: userId })
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error) throw error;
    return updated;
  }

  const { data: inserted, error } = await supabase
    .from('hr_schedules')
    .insert({ employee_id: employeeId, data, turno, created_by: userId })
    .select('id')
    .single();
  if (error) throw error;
  return inserted;
}

async function saveTimeRecord(supabase: ReturnType<typeof createClient>, userId: string, input: TimeRecordInput) {
  const { employeeId, data } = input;
  if (!employeeId) throw new Error('Funcionario nao informado.');
  if (!data) throw new Error('Data nao informada.');

  // Buscar escala do dia para calcular status
  const { data: sched } = await supabase
    .from('hr_schedules')
    .select('turno')
    .eq('employee_id', employeeId)
    .eq('data', data)
    .maybeSingle();

  const horasTrabalhadas = input.saida && input.entrada
    ? (() => {
        const ms = new Date(input.saida).getTime() - new Date(input.entrada).getTime()
          - (input.retornoIntervalo && input.saidaIntervalo
            ? new Date(input.retornoIntervalo).getTime() - new Date(input.saidaIntervalo).getTime()
            : 0);
        return ms / 3600000;
      })()
    : null;

  const status = calcTimeStatus(input.entrada || null, sched?.turno || null, horasTrabalhadas);

  const record = {
    employee_id: employeeId,
    data,
    entrada: input.entrada || null,
    saida_intervalo: input.saidaIntervalo || null,
    retorno_intervalo: input.retornoIntervalo || null,
    saida: input.saida || null,
    status,
    observacao: input.observacao?.trim() || null,
    registrado_por: userId,
  };

  const { data: existing } = await supabase
    .from('hr_time_records')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('data', data)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await supabase
      .from('hr_time_records')
      .update(record)
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error) throw error;
    return updated;
  }

  const { data: inserted, error } = await supabase
    .from('hr_time_records')
    .insert(record)
    .select('id')
    .single();
  if (error) throw error;
  return inserted;
}

async function saveOccurrence(supabase: ReturnType<typeof createClient>, userId: string, input: OccurrenceInput) {
  const validTypes = ['atraso', 'falta_injustificada', 'advertencia_verbal', 'advertencia_escrita', 'elogio', 'outro'];
  if (!input.employeeId) throw new Error('Funcionario nao informado.');
  if (!validTypes.includes(input.tipo)) throw new Error('Tipo de ocorrencia invalido.');
  if (!input.data) throw new Error('Data nao informada.');

  const { data, error } = await supabase
    .from('hr_occurrences')
    .insert({
      employee_id: input.employeeId,
      tipo: input.tipo,
      descricao: input.descricao?.trim() || null,
      data: input.data,
      registrado_por: userId,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

async function getWeeklyReport(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const periodStart = String(payload.periodStart || new Date().toISOString().slice(0, 10));
  const periodEnd = String(payload.periodEnd || periodStart);

  const [employeesResult, timeResult, occurrencesResult] = await Promise.all([
    supabase
      .from('hr_employees')
      .select('id, cargo, setor, profiles(full_name)')
      .order('setor'),
    supabase
      .from('hr_time_records')
      .select('employee_id, data, horas_trabalhadas, status')
      .gte('data', periodStart)
      .lte('data', periodEnd),
    supabase
      .from('hr_occurrences')
      .select('employee_id')
      .gte('data', periodStart)
      .lte('data', periodEnd),
  ]);

  if (employeesResult.error) throw employeesResult.error;

  const employees = employeesResult.data || [];
  const timeRecords = timeResult.data || [];
  const occurrences = occurrencesResult.data || [];

  return employees.map(emp => {
    const empRecords = timeRecords.filter(r => r.employee_id === emp.id);
    const totalHoras = empRecords.reduce((sum, r) => sum + Number(r.horas_trabalhadas || 0), 0);
    const extras = empRecords.reduce((sum, r) => sum + Math.max(0, Number(r.horas_trabalhadas || 0) - 8), 0);
    const faltas = empRecords.filter(r => r.status === 'falta').length;
    const ocorrencias = occurrences.filter(o => o.employee_id === emp.id).length;
    const profile = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles;
    return {
      nome: (profile as { full_name?: string } | null)?.full_name || 'Sem nome',
      cargo: emp.cargo || '',
      setor: emp.setor || '',
      total_horas: totalHoras.toFixed(1),
      extras: extras.toFixed(1),
      faltas,
      ocorrencias,
    };
  });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const body = await req.json() as { action?: Action; payload?: Record<string, unknown> };
    const action = body.action;
    const payload = body.payload || {};
    const { supabase, userId, role, permissions } = await getContext(req);
    assertHRAccess(role, permissions);
    if (!userId) return json({ error: 'Sessao invalida.' }, 401);

    if (action === 'summary') return json({ data: await summary(supabase, payload) });
    if (action === 'save_employee') return json({ data: await saveEmployee(supabase, payload as unknown as EmployeeInput) }, 201);
    if (action === 'save_schedule') return json({ data: await saveSchedule(supabase, userId, payload as unknown as ScheduleInput) });
    if (action === 'save_time_record') return json({ data: await saveTimeRecord(supabase, userId, payload as unknown as TimeRecordInput) });
    if (action === 'save_occurrence') return json({ data: await saveOccurrence(supabase, userId, payload as unknown as OccurrenceInput) }, 201);
    if (action === 'get_weekly_report') return json({ data: await getWeeklyReport(supabase, payload) });

    return json({ error: 'Acao invalida.' }, 400);
  } catch (error) {
    const status = typeof (error as { status?: unknown }).status === 'number' ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : 'Erro inesperado no modulo de RH.';
    return json({ error: message }, status);
  }
});
