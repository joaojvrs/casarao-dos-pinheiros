import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Info,
  Loader2,
  Plus,
  Search,
  Shield,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  downloadWeeklyReportCSV,
  getHRSummary,
  getHRWeeklyReport,
  saveHREmployee,
  saveHROccurrence,
  saveHRSchedule,
  saveHRTimeRecord,
} from '../services/hr';
import type {
  HRAlert,
  HREmployee,
  HROccurrence,
  HRSummary,
  HRTimeRecord,
  OccurrenceType,
  SaveEmployeeInput,
  ShiftType,
} from '../types/hr';

type HRTab = 'schedules' | 'timeclock' | 'team' | 'occurrences';

const EMPTY_SUMMARY: HRSummary = {
  employees: [],
  schedules: [],
  timeRecords: [],
  occurrences: [],
  productivity: [],
  alerts: [],
  metrics: { totalEmployees: 0, activeEmployees: 0, onLeave: 0, overtimeAlerts: 0 },
};

const HR_TABS: { id: HRTab; label: string; icon: LucideIcon }[] = [
  { id: 'schedules', label: 'Escalas', icon: Calendar },
  { id: 'timeclock', label: 'Ponto', icon: Clock },
  { id: 'team', label: 'Equipe', icon: Users },
  { id: 'occurrences', label: 'Ocorrencias', icon: AlertCircle },
];

const SHIFT_LABELS: Record<string, string> = { M: 'Manha', T: 'Tarde', N: 'Noite', F: 'Folga' };
const SHIFT_COLORS: Record<string, string> = {
  M: 'bg-blue-100 text-blue-800',
  T: 'bg-amber-100 text-amber-800',
  N: 'bg-indigo-100 text-indigo-800',
  F: 'bg-gray-100 text-gray-600',
};
const TIME_STATUS_COLORS: Record<string, string> = {
  no_horario: 'bg-emerald-100 text-emerald-800',
  atrasado: 'bg-yellow-100 text-yellow-800',
  hora_extra: 'bg-orange-100 text-orange-800',
  falta: 'bg-red-100 text-red-800',
};
const TIME_STATUS_LABELS: Record<string, string> = {
  no_horario: 'No horario',
  atrasado: 'Atrasado',
  hora_extra: 'Hora extra',
  falta: 'Falta',
};
const OCCURRENCE_COLORS: Record<OccurrenceType, string> = {
  elogio: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  atraso: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  falta_injustificada: 'text-red-700 bg-red-50 border-red-200',
  advertencia_verbal: 'text-yellow-800 bg-yellow-50 border-yellow-200',
  advertencia_escrita: 'text-red-800 bg-red-50 border-red-200',
  outro: 'text-gray-700 bg-gray-50 border-gray-200',
};
const OCCURRENCE_LABELS: Record<OccurrenceType, string> = {
  elogio: 'Elogio',
  atraso: 'Atraso',
  falta_injustificada: 'Falta injustificada',
  advertencia_verbal: 'Advertencia verbal',
  advertencia_escrita: 'Advertencia escrita',
  outro: 'Outro',
};

function getWeekStart(offset = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offset * 7);
  return d;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatTime(ts: string | null): string {
  if (!ts) return '--:--';
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function profileOf(emp: HREmployee) {
  const p = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles;
  return p || { id: emp.profile_id, full_name: 'Sem nome', email: '', avatar_url: null };
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function HRPortal({ onBack }: { onBack: () => void }) {
  const { role, permissions } = useAuth();
  const [activeTab, setActiveTab] = useState<HRTab>('schedules');
  const [summary, setSummary] = useState<HRSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);

  const canAccess = useMemo(
    () => ['master', 'admin', 'manager'].includes(role) || Boolean(permissions.hr),
    [role, permissions],
  );

  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart],
  );

  const run = async (message: string, operation: () => Promise<unknown>) => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await operation();
      await loadSummary(weekStart);
      setNotice(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel concluir a operacao.');
    } finally {
      setWorking(false);
    }
  };

  const loadSummary = async (ws: Date) => {
    const data = await getHRSummary(dateStr(ws));
    setSummary(data);
  };

  useEffect(() => {
    if (!canAccess) { setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    getHRSummary(dateStr(weekStart))
      .then(data => { if (mounted) setSummary(data); })
      .catch(err => { if (mounted) setError(err instanceof Error ? err.message : 'Nao foi possivel carregar o modulo de RH.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [canAccess, weekOffset]);

  if (!canAccess) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-5 py-6">
        <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 hover:bg-black/5">
          <ArrowLeft size={18} />
        </button>
        <section className="mx-auto mt-20 max-w-md rounded-lg border border-black/8 bg-white p-7 text-center shadow-sm">
          <Shield className="mx-auto mb-4 text-[#9d7a4f]" size={34} />
          <h1 className="font-serif text-3xl">Acesso restrito.</h1>
          <p className="mt-3 text-sm leading-6 text-black/55">Este modulo esta disponivel apenas para gestores ou usuarios com permissao de RH.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#20140d]">
      <header className="border-b border-black/8 bg-[#121a16] px-5 py-5 text-white md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition hover:bg-white/10">
            <ArrowLeft size={18} />
          </button>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#d7b98d]">Recursos humanos</p>
            <h1 className="font-serif text-3xl">RH & Escalas</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6 md:px-10">
        {(error || notice) && (
          <div className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <span>{error || notice}</span>
            <button onClick={() => { setError(''); setNotice(''); }}><X size={15} /></button>
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Metric icon={Users} label="Total funcionarios" value={loading ? '...' : String(summary.metrics.totalEmployees)} />
          <Metric icon={CheckCircle} label="Ativos" value={loading ? '...' : String(summary.metrics.activeEmployees)} tone="ok" />
          <Metric icon={AlertCircle} label="Afastados/Ferias" value={loading ? '...' : String(summary.metrics.onLeave)} tone={summary.metrics.onLeave > 0 ? 'warn' : undefined} />
          <Metric icon={AlertTriangle} label="Alertas extras" value={loading ? '...' : String(summary.metrics.overtimeAlerts)} tone={summary.metrics.overtimeAlerts > 0 ? 'warn' : undefined} />
        </div>

        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-lg border border-black/8 bg-white p-2 shadow-sm">
          {HR_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-bold uppercase tracking-[0.16em] transition ${activeTab === id ? 'bg-[#20140d] text-white' : 'text-black/48 hover:bg-black/5 hover:text-black/75'}`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-black/8 bg-white">
            <Loader2 className="animate-spin text-[#9d7a4f]" size={30} />
          </div>
        ) : (
          <>
            {activeTab === 'schedules' && (
              <SchedulesTab
                summary={summary}
                weekDays={weekDays}
                weekOffset={weekOffset}
                working={working}
                onWeekChange={setWeekOffset}
                onSaveSchedule={(employeeId, data, turno) =>
                  run('Escala salva.', () => saveHRSchedule({ employeeId, data, turno }))
                }
              />
            )}
            {activeTab === 'timeclock' && (
              <TimeclockTab
                summary={summary}
                weekDays={weekDays}
                working={working}
                onSaveTimeRecord={(input) =>
                  run('Ponto registrado.', () => saveHRTimeRecord(input))
                }
              />
            )}
            {activeTab === 'team' && (
              <TeamTab
                summary={summary}
                working={working}
                onSaveEmployee={(input) =>
                  run('Funcionario salvo.', () => saveHREmployee(input))
                }
              />
            )}
            {activeTab === 'occurrences' && (
              <OccurrencesTab
                summary={summary}
                working={working}
                onSaveOccurrence={(input) =>
                  run('Ocorrencia registrada.', () => saveHROccurrence(input))
                }
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

// ─── Aba Escalas ──────────────────────────────────────────────────────────────

function SchedulesTab({ summary, weekDays, weekOffset, working, onWeekChange, onSaveSchedule }: {
  summary: HRSummary;
  weekDays: Date[];
  weekOffset: number;
  working: boolean;
  onWeekChange: (offset: number) => void;
  onSaveSchedule: (employeeId: string, data: string, turno: ShiftType) => void;
}) {
  const [sectorFilter, setSectorFilter] = useState('');
  const [editCell, setEditCell] = useState<string | null>(null);

  const sectors = useMemo(
    () => [...new Set(summary.employees.map(e => e.setor).filter(Boolean) as string[])].sort(),
    [summary.employees],
  );

  const filtered = useMemo(
    () => sectorFilter ? summary.employees.filter(e => e.setor === sectorFilter) : summary.employees,
    [summary.employees, sectorFilter],
  );

  const scheduleMap = useMemo(() => {
    const map: Record<string, ShiftType> = {};
    for (const s of summary.schedules) {
      map[`${s.employee_id}:${s.data}`] = s.turno as ShiftType;
    }
    return map;
  }, [summary.schedules]);

  const coverage = useMemo(() => {
    const cov: Record<string, Record<ShiftType, number>> = {};
    for (const day of weekDays) {
      const ds = dateStr(day);
      cov[ds] = { M: 0, T: 0, N: 0, F: 0 };
      for (const emp of summary.employees) {
        const t = scheduleMap[`${emp.id}:${ds}`];
        if (t) cov[ds][t]++;
      }
    }
    return cov;
  }, [weekDays, summary.employees, scheduleMap]);

  const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

  return (
    <div className="space-y-5">
      {summary.alerts.length > 0 && (
        <div className="space-y-2">
          {summary.alerts.slice(0, 5).map((alert, i) => <AlertBanner key={i} alert={alert} />)}
        </div>
      )}

      <Panel title="Escala semanal" icon={Calendar}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => onWeekChange(weekOffset - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 hover:bg-black/5"><ArrowLeft size={15} /></button>
            <span className="text-sm font-medium">
              {formatDate(weekDays[0])} – {formatDate(weekDays[6])}
            </span>
            <button onClick={() => onWeekChange(weekOffset + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 hover:bg-black/5"><ArrowRight size={15} /></button>
            {weekOffset !== 0 && (
              <button onClick={() => onWeekChange(0)} className="rounded-lg border border-black/10 px-3 py-1.5 text-xs hover:bg-black/5">Semana atual</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">Setor</label>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
              className="h-9 rounded-lg border border-black/10 bg-white px-2 text-sm outline-none focus:border-[#9d7a4f]">
              <option value="">Todos</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8">
                <th className="w-44 py-2 pr-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">Funcionario</th>
                {weekDays.map((day, i) => (
                  <th key={i} className="min-w-[80px] px-1 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">
                    <span className="block">{DAY_NAMES[i]}</span>
                    <span className="block font-normal text-black/30">{formatDate(day)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => {
                const profile = profileOf(emp);
                return (
                  <tr key={emp.id} className="border-b border-black/5 last:border-b-0 hover:bg-black/2">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={profile.full_name} size="sm" />
                        <div>
                          <p className="font-medium leading-tight">{profile.full_name}</p>
                          <p className="text-[10px] text-black/40">{emp.setor || 'Sem setor'}</p>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((day) => {
                      const ds = dateStr(day);
                      const key = `${emp.id}:${ds}`;
                      const turno = scheduleMap[key];
                      const isEditing = editCell === key;
                      return (
                        <td key={ds} className="px-1 py-1 text-center">
                          {isEditing ? (
                            <div className="relative">
                              <select
                                autoFocus
                                defaultValue={turno || ''}
                                onChange={e => {
                                  const v = e.target.value as ShiftType;
                                  if (v) onSaveSchedule(emp.id, ds, v);
                                  setEditCell(null);
                                }}
                                onBlur={() => setEditCell(null)}
                                className="h-8 w-full rounded border border-[#9d7a4f] bg-white px-1 text-xs outline-none"
                                disabled={working}
                              >
                                <option value="">—</option>
                                {(['M', 'T', 'N', 'F'] as ShiftType[]).map(s => (
                                  <option key={s} value={s}>{s} – {SHIFT_LABELS[s]}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditCell(key)}
                              className={`inline-flex h-8 min-w-[52px] items-center justify-center rounded px-2 text-xs font-bold transition hover:opacity-80 ${turno ? SHIFT_COLORS[turno] : 'border border-dashed border-black/15 text-black/25 hover:border-black/30'}`}
                            >
                              {turno || '+'}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-sm text-black/40">Nenhum funcionario encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Cobertura por turno" icon={Users}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8">
                <th className="py-2 pr-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">Turno</th>
                {weekDays.map((day, i) => (
                  <th key={i} className="min-w-[72px] px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">{DAY_NAMES[i]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['M', 'T', 'N'] as ShiftType[]).map(shift => (
                <tr key={shift} className="border-b border-black/5 last:border-b-0">
                  <td className="py-2 pr-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${SHIFT_COLORS[shift]}`}>{shift} – {SHIFT_LABELS[shift]}</span>
                  </td>
                  {weekDays.map((day) => {
                    const ds = dateStr(day);
                    const count = coverage[ds]?.[shift] || 0;
                    return (
                      <td key={ds} className={`px-2 py-2 text-center font-semibold ${count === 0 ? 'text-red-600' : count < 2 ? 'text-yellow-700' : 'text-emerald-700'}`}>
                        {count}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ─── Aba Ponto ────────────────────────────────────────────────────────────────

function TimeclockTab({ summary, weekDays, working, onSaveTimeRecord }: {
  summary: HRSummary;
  weekDays: Date[];
  working: boolean;
  onSaveTimeRecord: (input: {
    employeeId: string; data: string;
    entrada?: string; saidaIntervalo?: string;
    retornoIntervalo?: string; saida?: string;
  }) => void;
}) {
  const [sectorFilter, setSectorFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(dateStr(new Date()));
  const [exporting, setExporting] = useState(false);
  const [editEmp, setEditEmp] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ entrada: '', saidaIntervalo: '', retornoIntervalo: '', saida: '' });

  const sectors = useMemo(
    () => [...new Set(summary.employees.map(e => e.setor).filter(Boolean) as string[])].sort(),
    [summary.employees],
  );

  const filtered = useMemo(() => {
    return summary.employees.filter(emp => {
      const profile = profileOf(emp);
      if (sectorFilter && emp.setor !== sectorFilter) return false;
      if (search && !profile.full_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [summary.employees, sectorFilter, search]);

  const recordMap = useMemo(() => {
    const map: Record<string, HRTimeRecord> = {};
    for (const r of summary.timeRecords) {
      map[`${r.employee_id}:${r.data}`] = r;
    }
    return map;
  }, [summary.timeRecords]);

  const weeklyStats = useMemo(() => {
    const totalHours = summary.timeRecords.reduce((s, r) => s + Number(r.horas_trabalhadas || 0), 0);
    const extras = summary.timeRecords.reduce((s, r) => s + Math.max(0, Number(r.horas_trabalhadas || 0) - 8), 0);
    const faltas = summary.timeRecords.filter(r => r.status === 'falta').length;
    return { totalHours, extras, faltas };
  }, [summary.timeRecords]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const start = dateStr(weekDays[0]);
      const end = dateStr(weekDays[6]);
      const rows = await getHRWeeklyReport(start, end);
      downloadWeeklyReportCSV(rows, `ponto-${start}-${end}.csv`);
    } finally {
      setExporting(false);
    }
  };

  const startEdit = (empId: string) => {
    const rec = recordMap[`${empId}:${selectedDate}`];
    setEditForm({
      entrada: rec?.entrada ? new Date(rec.entrada).toISOString().slice(11, 16) : '',
      saidaIntervalo: rec?.saida_intervalo ? new Date(rec.saida_intervalo).toISOString().slice(11, 16) : '',
      retornoIntervalo: rec?.retorno_intervalo ? new Date(rec.retorno_intervalo).toISOString().slice(11, 16) : '',
      saida: rec?.saida ? new Date(rec.saida).toISOString().slice(11, 16) : '',
    });
    setEditEmp(empId);
  };

  const buildTimestamp = (date: string, time: string) => time ? `${date}T${time}:00` : undefined;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-black/8 bg-[#151d18] p-4 text-white">
          <p className="text-xs text-white/45">Horas totais na semana</p>
          <p className="mt-2 font-serif text-3xl">{weeklyStats.totalHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-lg border border-black/8 bg-[#151d18] p-4 text-white">
          <p className="text-xs text-white/45">Horas extras</p>
          <p className={`mt-2 font-serif text-3xl ${weeklyStats.extras > 0 ? 'text-orange-300' : ''}`}>{weeklyStats.extras.toFixed(1)}h</p>
        </div>
        <div className="rounded-lg border border-black/8 bg-[#151d18] p-4 text-white">
          <p className="text-xs text-white/45">Faltas registradas</p>
          <p className={`mt-2 font-serif text-3xl ${weeklyStats.faltas > 0 ? 'text-red-300' : ''}`}>{weeklyStats.faltas}</p>
        </div>
      </div>

      <Panel title="Registros de ponto" icon={Clock}>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3.5 text-black/35" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar funcionario..."
              className="h-11 w-full rounded-lg border border-black/10 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#9d7a4f]" />
          </div>
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
            className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#9d7a4f]">
            <option value="">Todos os setores</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#9d7a4f]" />
          <button onClick={handleExport} disabled={exporting}
            className="flex h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm font-medium transition hover:bg-black/5 disabled:opacity-50">
            <Download size={14} />{exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>

        <div className="space-y-2">
          {filtered.map(emp => {
            const profile = profileOf(emp);
            const rec = recordMap[`${emp.id}:${selectedDate}`];
            const isEditing = editEmp === emp.id;

            return (
              <div key={emp.id} className="rounded-lg border border-black/8 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={profile.full_name} />
                    <div>
                      <p className="font-semibold">{profile.full_name}</p>
                      <p className="text-xs text-black/45">{emp.cargo || 'Sem cargo'} · {emp.setor || 'Sem setor'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {rec && (
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${TIME_STATUS_COLORS[rec.status]}`}>
                        {TIME_STATUS_LABELS[rec.status]}
                      </span>
                    )}
                    <button onClick={() => isEditing ? setEditEmp(null) : startEdit(emp.id)}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5">
                      {isEditing ? 'Cancelar' : rec ? 'Editar' : 'Registrar'}
                    </button>
                  </div>
                </div>

                {!isEditing && rec && (
                  <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                    <TimeCell label="Entrada" value={formatTime(rec.entrada)} />
                    <TimeCell label="Intervalo" value={formatTime(rec.saida_intervalo)} />
                    <TimeCell label="Retorno" value={formatTime(rec.retorno_intervalo)} />
                    <TimeCell label="Saida" value={formatTime(rec.saida)} />
                  </div>
                )}

                {isEditing && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(['entrada', 'saidaIntervalo', 'retornoIntervalo', 'saida'] as const).map((field, i) => (
                      <label key={field} className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">
                          {['Entrada', 'Saida intervalo', 'Retorno intervalo', 'Saida'][i]}
                        </span>
                        <input type="time" value={editForm[field]}
                          onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                          className="h-10 w-full rounded-lg border border-black/10 px-2 text-sm outline-none focus:border-[#9d7a4f]" />
                      </label>
                    ))}
                    <button
                      disabled={working}
                      onClick={() => {
                        onSaveTimeRecord({
                          employeeId: emp.id,
                          data: selectedDate,
                          entrada: buildTimestamp(selectedDate, editForm.entrada),
                          saidaIntervalo: buildTimestamp(selectedDate, editForm.saidaIntervalo),
                          retornoIntervalo: buildTimestamp(selectedDate, editForm.retornoIntervalo),
                          saida: buildTimestamp(selectedDate, editForm.saida),
                        });
                        setEditEmp(null);
                      }}
                      className="col-span-2 mt-auto h-10 rounded-lg bg-[#20140d] text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50 sm:col-span-4"
                    >
                      Salvar ponto
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <Empty text="Nenhum funcionario encontrado." />}
        </div>
      </Panel>
    </div>
  );
}

// ─── Aba Equipe ───────────────────────────────────────────────────────────────

function TeamTab({ summary, working, onSaveEmployee }: {
  summary: HRSummary;
  working: boolean;
  onSaveEmployee: (input: SaveEmployeeInput) => void;
}) {
  const [drawerEmp, setDrawerEmp] = useState<HREmployee | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<SaveEmployeeInput>({
    profileId: '', cargo: '', setor: '', turnoPadrao: undefined, dataAdmissao: '', observacoes: '',
  });
  const [profileSearch, setProfileSearch] = useState('');

  const productivityMap = useMemo(() => {
    const byEmpSetor: Record<string, Record<string, number>> = {};
    for (const p of summary.productivity) {
      if (!byEmpSetor[p.employee_id]) byEmpSetor[p.employee_id] = {};
      byEmpSetor[p.employee_id][p.metrica || ''] = (byEmpSetor[p.employee_id][p.metrica || ''] || 0) + Number(p.valor || 0);
    }
    return byEmpSetor;
  }, [summary.productivity]);

  const sectorMaxProd = useMemo(() => {
    const maxBySector: Record<string, number> = {};
    for (const emp of summary.employees) {
      if (!emp.setor) continue;
      const total = Object.values(productivityMap[emp.id] || {}).reduce((s, v) => s + v, 0);
      if (!maxBySector[emp.setor] || total > maxBySector[emp.setor]) maxBySector[emp.setor] = total;
    }
    return maxBySector;
  }, [summary.employees, productivityMap]);

  const occurrencesByEmp = useMemo(() => {
    const map: Record<string, HROccurrence[]> = {};
    for (const o of summary.occurrences) {
      if (!map[o.employee_id]) map[o.employee_id] = [];
      map[o.employee_id].push(o);
    }
    return map;
  }, [summary.occurrences]);

  const scheduleByEmp = useMemo(() => {
    const map: Record<string, { data: string; turno: string }[]> = {};
    for (const s of summary.schedules) {
      if (!map[s.employee_id]) map[s.employee_id] = [];
      map[s.employee_id].push({ data: s.data, turno: s.turno });
    }
    return map;
  }, [summary.schedules]);

  const drawerProfile = drawerEmp ? profileOf(drawerEmp) : null;

  const profileOptions = summary.employees.length
    ? []
    : [];

  void profileOptions;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl">Equipe ({summary.employees.length})</h2>
        <button onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-lg bg-[#20140d] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#3a2a1f]">
          <Plus size={14} />Novo funcionario
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summary.employees.map(emp => {
          const profile = profileOf(emp);
          const total = Object.values(productivityMap[emp.id] || {}).reduce((s, v) => s + v, 0);
          const max = sectorMaxProd[emp.setor || ''] || 1;
          const pct = Math.round((total / max) * 100);
          return (
            <button key={emp.id} onClick={() => setDrawerEmp(emp)}
              className="rounded-lg border border-black/8 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#c3a37a]/60 hover:shadow-md">
              <div className="flex items-start gap-3">
                <Avatar name={profile.full_name} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight">{profile.full_name}</p>
                  <p className="text-xs text-black/45 mt-0.5">{emp.cargo || 'Sem cargo'}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9d7a4f]">{emp.setor || 'Sem setor'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${emp.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {emp.status}
                    </span>
                  </div>
                </div>
              </div>
              {total > 0 && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[10px] text-black/40">
                    <span>Produtividade</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/8">
                    <div className="h-full rounded-full bg-[#9d7a4f] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </button>
          );
        })}
        {summary.employees.length === 0 && (
          <div className="col-span-3"><Empty text="Nenhum funcionario cadastrado ainda." /></div>
        )}
      </div>

      {/* Drawer lateral */}
      {drawerEmp && drawerProfile && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerEmp(null)} />
          <aside className="w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-black/8 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <Avatar name={drawerProfile.full_name} size="lg" />
                <div>
                  <p className="font-semibold">{drawerProfile.full_name}</p>
                  <p className="text-xs text-black/45">{drawerEmp.cargo} · {drawerEmp.setor}</p>
                </div>
              </div>
              <button onClick={() => setDrawerEmp(null)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-6">
              <section>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/35 mb-3">Escala — 7 dias</p>
                <div className="grid grid-cols-7 gap-1">
                  {(scheduleByEmp[drawerEmp.id] || []).slice(0, 7).map(s => (
                    <div key={s.data} className="text-center">
                      <div className={`rounded py-1 text-xs font-bold ${SHIFT_COLORS[s.turno] || 'bg-gray-100 text-gray-600'}`}>{s.turno}</div>
                      <div className="mt-1 text-[9px] text-black/35">{s.data.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/35 mb-3">Ocorrencias recentes</p>
                {(occurrencesByEmp[drawerEmp.id] || []).slice(0, 5).map(o => (
                  <div key={o.id} className={`mb-2 rounded-lg border p-3 text-sm ${OCCURRENCE_COLORS[o.tipo as OccurrenceType]}`}>
                    <p className="font-semibold">{OCCURRENCE_LABELS[o.tipo as OccurrenceType]} · {o.data}</p>
                    {o.descricao && <p className="mt-1 text-xs opacity-75">{o.descricao}</p>}
                  </div>
                ))}
                {!occurrencesByEmp[drawerEmp.id]?.length && <p className="text-sm text-black/40">Sem ocorrencias recentes.</p>}
              </section>

              <section>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/35 mb-2">Admissao</p>
                <p className="text-sm">{drawerEmp.data_admissao || 'Nao informada'}</p>
              </section>

              {drawerEmp.observacoes && (
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/35 mb-2">Observacoes</p>
                  <p className="text-sm leading-6 text-black/70">{drawerEmp.observacoes}</p>
                </section>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Modal novo funcionário */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewModal(false)} />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl">Novo funcionario</h2>
              <button onClick={() => setShowNewModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <Field label="Busca por perfil (e-mail ou nome)">
                <input value={profileSearch} onChange={e => setProfileSearch(e.target.value)} placeholder="email@exemplo.com" />
              </Field>
              <Field label="Profile ID">
                <input value={newForm.profileId} onChange={e => setNewForm(f => ({ ...f, profileId: e.target.value }))} placeholder="UUID do perfil" />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Cargo">
                  <input value={newForm.cargo || ''} onChange={e => setNewForm(f => ({ ...f, cargo: e.target.value }))} />
                </Field>
                <Field label="Setor">
                  <select value={newForm.setor || ''} onChange={e => setNewForm(f => ({ ...f, setor: e.target.value }))}>
                    <option value="">Selecione</option>
                    {['Recepção','Governança','Cozinha','Manutenção','Outros'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Turno padrao">
                  <select value={newForm.turnoPadrao || ''} onChange={e => setNewForm(f => ({ ...f, turnoPadrao: e.target.value as ShiftType || undefined }))}>
                    <option value="">Selecione</option>
                    <option value="M">M – Manha</option>
                    <option value="T">T – Tarde</option>
                    <option value="N">N – Noite</option>
                  </select>
                </Field>
                <Field label="Data admissao">
                  <input type="date" value={newForm.dataAdmissao || ''} onChange={e => setNewForm(f => ({ ...f, dataAdmissao: e.target.value }))} />
                </Field>
              </div>
              <Field label="Observacoes">
                <textarea value={newForm.observacoes || ''} onChange={e => setNewForm(f => ({ ...f, observacoes: e.target.value }))}
                  className="!h-20 resize-none" />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowNewModal(false)} className="rounded-lg border border-black/10 px-4 py-2.5 text-sm hover:bg-black/5">Cancelar</button>
              <button disabled={working || !newForm.profileId.trim()}
                onClick={() => { onSaveEmployee(newForm); setShowNewModal(false); }}
                className="rounded-lg bg-[#20140d] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Aba Ocorrências ──────────────────────────────────────────────────────────

function OccurrencesTab({ summary, working, onSaveOccurrence }: {
  summary: HRSummary;
  working: boolean;
  onSaveOccurrence: (input: { employeeId: string; tipo: OccurrenceType; descricao?: string; data: string }) => void;
}) {
  const [empFilter, setEmpFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    tipo: 'atraso' as OccurrenceType,
    descricao: '',
    data: dateStr(new Date()),
  });

  const filtered = useMemo(() => {
    return summary.occurrences.filter(o => {
      if (empFilter && o.employee_id !== empFilter) return false;
      if (typeFilter && o.tipo !== typeFilter) return false;
      return true;
    });
  }, [summary.occurrences, empFilter, typeFilter]);

  const empOf = (empId: string) => {
    const emp = summary.employees.find(e => e.id === empId);
    return emp ? profileOf(emp).full_name : 'Desconhecido';
  };

  const OCCURRENCE_TYPES = Object.keys(OCCURRENCE_LABELS) as OccurrenceType[];

  return (
    <div className="space-y-5">
      <Panel title="Ocorrencias" icon={AlertCircle}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
              className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#9d7a4f]">
              <option value="">Todos funcionarios</option>
              {summary.employees.map(emp => {
                const p = profileOf(emp);
                return <option key={emp.id} value={emp.id}>{p.full_name}</option>;
              })}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#9d7a4f]">
              <option value="">Todos os tipos</option>
              {OCCURRENCE_TYPES.map(t => <option key={t} value={t}>{OCCURRENCE_LABELS[t]}</option>)}
            </select>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#20140d] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-[#3a2a1f]">
            <Plus size={13} />Registrar
          </button>
        </div>

        <div className="space-y-2">
          {filtered.map(o => (
            <div key={o.id} className={`flex items-start gap-3 rounded-lg border p-4 ${OCCURRENCE_COLORS[o.tipo as OccurrenceType]}`}>
              <OccurrenceIcon type={o.tipo as OccurrenceType} />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{empOf(o.employee_id)}</p>
                  <span className="text-xs opacity-60">{o.data}</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide mt-0.5">{OCCURRENCE_LABELS[o.tipo as OccurrenceType]}</p>
                {o.descricao && <p className="mt-1 text-sm opacity-75">{o.descricao}</p>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <Empty text="Nenhuma ocorrencia encontrada." />}
        </div>
      </Panel>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl">Registrar ocorrencia</h2>
              <button onClick={() => setShowModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <Field label="Funcionario">
                <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">Selecione</option>
                  {summary.employees.map(emp => {
                    const p = profileOf(emp);
                    return <option key={emp.id} value={emp.id}>{p.full_name}</option>;
                  })}
                </select>
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Tipo">
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as OccurrenceType }))}>
                    {OCCURRENCE_TYPES.map(t => <option key={t} value={t}>{OCCURRENCE_LABELS[t]}</option>)}
                  </select>
                </Field>
                <Field label="Data">
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
                </Field>
              </div>
              <Field label="Descricao">
                <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  className="!h-24 resize-none" />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-black/10 px-4 py-2.5 text-sm hover:bg-black/5">Cancelar</button>
              <button disabled={working || !form.employeeId}
                onClick={() => { onSaveOccurrence(form); setShowModal(false); }}
                className="rounded-lg bg-[#20140d] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componentes reutilizáveis ────────────────────────────────────────────────

function AlertBanner({ alert }: { alert: HRAlert }) {
  const colors = {
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  };
  const icons = { error: AlertCircle, warning: AlertTriangle, info: Info };
  const Icon = icons[alert.severity];
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${colors[alert.severity]}`}>
      <Icon size={15} className="shrink-0" />
      <span>{alert.message}</span>
    </div>
  );
}

function OccurrenceIcon({ type }: { type: OccurrenceType }) {
  if (type === 'elogio') return <CheckCircle size={18} className="mt-0.5 shrink-0" />;
  if (type === 'advertencia_escrita' || type === 'falta_injustificada') return <AlertCircle size={18} className="mt-0.5 shrink-0" />;
  return <AlertTriangle size={18} className="mt-0.5 shrink-0" />;
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-xs', lg: 'h-12 w-12 text-sm' };
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-[#efe4d4] font-bold text-[#735333] ${sizes[size]}`}>
      {initials(name)}
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-black/8 bg-white/80 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efe4d4] text-[#735333]"><Icon size={18} /></span>
        <h2 className="font-serif text-2xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement<{ className?: string }> }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">{label}</span>
      {React.cloneElement(children, {
        className: `h-12 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#9d7a4f] ${children.props.className || ''}`,
      })}
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-black/12 bg-[#faf7f0] p-5 text-sm text-black/45">{text}</div>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone?: 'warn' | 'ok' }) {
  return (
    <div className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
      <Icon size={18} className={`mb-4 ${tone === 'warn' ? 'text-red-700' : tone === 'ok' ? 'text-emerald-600' : 'text-[#9d7a4f]'}`} />
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </div>
  );
}

function TimeCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#faf7f0] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

