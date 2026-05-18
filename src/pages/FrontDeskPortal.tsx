import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Check,
  CreditCard,
  DoorOpen,
  KeyRound,
  Loader2,
  Search,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  assignRoom,
  cancelAssignment,
  checkin,
  checkout,
  emitKey,
  fetchFDSummary,
  getGuestHistory,
  getReservations,
  noShow,
  reassignRoom,
  saveGuestProfile,
  saveIncident,
} from '../services/frontdesk';
import type { PaymentMethod } from '../types/financial';
import type { FDGuestHistory, FDIncident, FDRoomAssignment, FDSummary, GuestClass, IncidentStatus, IncidentType, KeyEventType } from '../types/frontdesk';

type Tab = 'dashboard' | 'reservas' | 'hospedes' | 'ocorrencias';
type DrawerMode = 'checkin' | 'checkout' | 'detail' | 'guest' | null;

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const paymentMethods: PaymentMethod[] = ['dinheiro', 'debito', 'credito', 'pix', 'transferencia', 'faturado'];
const statusFilters = ['todas', 'reservado', 'checked_in', 'checked_out', 'no_show', 'cancelado'];
const incidentTypes: IncidentType[] = ['reclamacao', 'solicitacao', 'dano', 'extravio', 'elogio', 'seguranca', 'outro'];

export function FrontDeskPortal({ onBack }: { onBack: () => void }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<FDSummary | null>(null);
  const [reservations, setReservations] = useState<FDRoomAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedAssignment, setSelectedAssignment] = useState<FDRoomAssignment | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [guestHistory, setGuestHistory] = useState<FDGuestHistory | null>(null);
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { start, end, status: 'todas', search: '' };
  });

  const hasAccess = ['attendant', 'frontdesk', 'master', 'admin', 'manager'].includes(auth.role) || Boolean(auth.permissions.bookings) || Boolean(auth.permissions.guests);
  const canManage = ['master', 'admin', 'manager'].includes(auth.role);

  const load = async () => {
    const [nextSummary, nextReservations] = await Promise.all([
      fetchFDSummary(),
      getReservations(filters.start, filters.end, filters.status, filters.search),
    ]);
    setSummary(nextSummary);
    setReservations(nextReservations);
  };

  const run = async (message: string, action: () => Promise<unknown>) => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await action();
      await load();
      setNotice(message);
      setSelectedAssignment(null);
      setDrawerMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel concluir a operacao.');
    } finally {
      setWorking(false);
    }
  };

  useEffect(() => {
    if (!auth.loading && !hasAccess) navigate('/equipe', { replace: true });
  }, [auth.loading, hasAccess, navigate]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    load()
      .catch(err => { if (mounted) setError(err instanceof Error ? err.message : 'Nao foi possivel carregar a recepcao.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [filters.end, filters.search, filters.start, filters.status]);

  const guestCards = useMemo(() => {
    const map = new Map<string, FDRoomAssignment>();
    for (const item of reservations) {
      const key = item.booking?.hospede_email || item.booking?.hospede_nome || item.id;
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values());
  }, [reservations]);

  if (loading) return <div className="min-h-screen bg-[#f7f3ea] flex items-center justify-center text-sm text-black/50"><Loader2 className="mr-2 animate-spin" size={18} />Carregando recepcao...</div>;
  if (!hasAccess) return null;

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#20140d]">
      <header className="border-b border-black/8 bg-[#121a16] px-5 py-5 text-white md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"><ArrowLeft size={18} /></button>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#d7b98d]">Recepcao & front desk</p>
            <h1 className="font-serif text-3xl">Check-in, ocupacao e chaves</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 md:px-10">
        {(error || notice) && (
          <div className={`mb-5 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <span>{error || notice}</span>
            <button onClick={() => { setError(''); setNotice(''); }}><X size={15} /></button>
          </div>
        )}

        <nav className="mb-6 flex flex-wrap gap-2">
          {(['dashboard', 'reservas', 'hospedes', 'ocorrencias'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${activeTab === tab ? 'bg-[#20140d] text-white' : 'border border-black/10 bg-white text-black/55'}`}>
              {label(tab)}
            </button>
          ))}
        </nav>

        {activeTab === 'dashboard' && summary && (
          <DashboardTab
            summary={summary}
            onOpen={(item, mode) => { setSelectedAssignment(item); setDrawerMode(mode); }}
          />
        )}

        {activeTab === 'reservas' && summary && (
          <ReservationsTab
            summary={summary}
            reservations={reservations}
            filters={filters}
            setFilters={setFilters}
            canManage={canManage}
            working={working}
            run={run}
            onOpen={(item, mode) => { setSelectedAssignment(item); setDrawerMode(mode); }}
          />
        )}

        {activeTab === 'hospedes' && (
          <GuestsTab
            assignments={guestCards}
            canManage={canManage}
            run={run}
            onHistory={async assignment => {
              setSelectedAssignment(assignment);
              setDrawerMode('guest');
              setGuestHistory(await getGuestHistory(undefined, assignment.booking?.hospede_email));
            }}
          />
        )}

        {activeTab === 'ocorrencias' && summary && (
          <IncidentsTab assignments={reservations} incidents={summary.incidents_abertos} run={run} />
        )}

        {selectedAssignment && drawerMode && (
          <AssignmentDrawer
            mode={drawerMode}
            assignment={selectedAssignment}
            guestHistory={guestHistory}
            canManage={canManage}
            working={working}
            onClose={() => { setSelectedAssignment(null); setDrawerMode(null); setGuestHistory(null); }}
            run={run}
          />
        )}
      </section>
    </main>
  );
}

function DashboardTab({ summary, onOpen }: { summary: FDSummary; onOpen: (item: FDRoomAssignment, mode: DrawerMode) => void }) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={DoorOpen} label="Taxa ocupacao" value={`${summary.metricas.taxa_ocupacao}%`} />
        <Metric icon={CalendarDays} label="Check-ins hoje" value={String(summary.metricas.checkins_pendentes_hoje)} />
        <Metric icon={CreditCard} label="Check-outs hoje" value={String(summary.metricas.checkouts_pendentes_hoje)} />
        <Metric icon={BedDouble} label="Quartos livres" value={String(summary.metricas.disponiveis)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Check-ins de hoje">
          <List assignments={summary.checkins_hoje} empty="Nenhum check-in pendente hoje." actionLabel="Fazer check-in" onAction={item => onOpen(item, 'checkin')} />
        </Panel>
        <Panel title="Check-outs de hoje">
          <List assignments={summary.checkouts_hoje} empty="Nenhum check-out pendente hoje." actionLabel="Fazer check-out" onAction={item => onOpen(item, 'checkout')} />
        </Panel>
      </div>

      <Panel title="Ocupacao atual">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summary.ocupacao_atual.map(item => (
            <button key={item.id} onClick={() => onOpen(item, 'detail')} className="rounded-lg border border-black/8 bg-[#faf7f0] p-4 text-left transition hover:border-[#c3a37a]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-2xl">Quarto {item.quarto_numero}</h3>
                  <p className="text-sm text-black/45">{item.booking?.hospede_nome}</p>
                </div>
                <Badge tone={lastKey(item)?.tipo === 'devolvida' ? 'green' : 'blue'}>{lastKey(item)?.tipo || 'sem chave'}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Mini label="Saida" value={formatDate(item.checkout_previsto)} />
                <Mini label="Saldo" value={BRL.format(item.folio?.saldo_devedor || 0)} danger={Number(item.folio?.saldo_devedor || 0) > 0} />
              </div>
            </button>
          ))}
          {!summary.ocupacao_atual.length && <Empty text="Nenhuma ocupacao ativa." />}
        </div>
      </Panel>
    </section>
  );
}

function ReservationsTab({ summary, reservations, filters, setFilters, canManage, working, run, onOpen }: {
  summary: FDSummary;
  reservations: FDRoomAssignment[];
  filters: { start: string; end: string; status: string; search: string };
  setFilters: (filters: { start: string; end: string; status: string; search: string }) => void;
  canManage: boolean;
  working: boolean;
  run: (message: string, action: () => Promise<unknown>) => Promise<void>;
  onOpen: (item: FDRoomAssignment, mode: DrawerMode) => void;
}) {
  const [assigning, setAssigning] = useState<FDRoomAssignment | null>(null);
  const [newRoom, setNewRoom] = useState('');
  const [reason, setReason] = useState('');
  const [keyType, setKeyType] = useState<KeyEventType>('emitida');
  const [keyId, setKeyId] = useState('');

  return (
    <section className="space-y-5">
      <Panel title="Filtros">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_2fr]">
          <Input type="date" value={filters.start} onChange={e => setFilters({ ...filters, start: e.target.value })} />
          <Input type="date" value={filters.end} onChange={e => setFilters({ ...filters, end: e.target.value })} />
          <Select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} options={statusFilters} />
          <div className="relative">
            <Search className="absolute left-3 top-3 text-black/35" size={15} />
            <Input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Nome ou email" className="pl-9" />
          </div>
        </div>
      </Panel>

      <div className="space-y-3">
        {reservations.map(item => (
          <article key={item.id} className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif text-2xl">{item.booking?.hospede_nome || 'Hospede'}</h3>
                  <Badge tone={statusTone(item.status)}>{label(item.status)}</Badge>
                </div>
                <p className="mt-1 text-sm text-black/45">{item.booking?.hospede_email} · Quarto {item.quarto_numero} · {formatDate(item.checkin_previsto)} ate {formatDate(item.checkout_previsto)}</p>
                <p className="mt-2 text-sm text-black/55">{item.adultos} adulto(s) · {item.criancas} crianca(s) · Saldo {BRL.format(item.folio?.saldo_devedor || 0)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.status === 'reservado' && <button onClick={() => onOpen(item, 'checkin')} className="btn-primary">Check-in</button>}
                {item.status === 'reservado' && <button onClick={() => run('No-show registrado.', () => noShow(item.id, 'No-show operacional'))} className="btn-light">No-show</button>}
                {item.status === 'checked_in' && <button onClick={() => onOpen(item, 'checkout')} className="btn-primary">Check-out</button>}
                {item.status === 'checked_in' && <button onClick={() => { setAssigning(item); setNewRoom(''); setReason(''); }} className="btn-light">Trocar quarto</button>}
                {item.status === 'checked_in' && <button onClick={() => { setAssigning(item); setKeyType('reemitida'); }} className="btn-light">Emitir chave</button>}
                {canManage && item.status === 'reservado' && <button onClick={() => run('Reserva cancelada.', () => cancelAssignment(item.id, 'Cancelamento operacional'))} className="btn-danger">Cancelar</button>}
                <button onClick={() => onOpen(item, 'detail')} className="btn-light">Detalhes</button>
              </div>
            </div>
          </article>
        ))}
        {!reservations.length && <Empty text="Nenhuma reserva encontrada." />}
      </div>

      {assigning && (
        <Panel title={keyType === 'reemitida' ? 'Emitir chave' : 'Trocar quarto'}>
          {keyType === 'reemitida' ? (
            <div className="grid gap-3 md:grid-cols-4">
              <Select value={keyType} onChange={e => setKeyType(e.target.value as KeyEventType)} options={['emitida', 'reemitida', 'bloqueada', 'devolvida']} />
              <Input value={keyId} onChange={e => setKeyId(e.target.value)} placeholder="Identificador" />
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Motivo" />
              <button disabled={working} onClick={() => run('Chave registrada.', () => emitKey(assigning.id, keyType, keyId, reason))} className="btn-primary">Salvar chave</button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <Select value={newRoom} onChange={e => setNewRoom(e.target.value)} options={['', ...summary.quartos_disponiveis.map(room => room.id)]} labels={Object.fromEntries(summary.quartos_disponiveis.map(room => [room.id, `${room.numero} · ${room.tipo} · andar ${room.andar}`]))} />
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Motivo" />
              <button disabled={working} onClick={() => run('Quarto trocado.', () => reassignRoom(assigning.id, newRoom, reason))} className="btn-primary">Confirmar</button>
            </div>
          )}
        </Panel>
      )}
    </section>
  );
}

function GuestsTab({ assignments, canManage, run, onHistory }: {
  assignments: FDRoomAssignment[];
  canManage: boolean;
  run: (message: string, action: () => Promise<unknown>) => Promise<void>;
  onHistory: (assignment: FDRoomAssignment) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ nome: string; email: string; telefone: string; cpf: string; classificacao: GuestClass }>({ nome: '', email: '', telefone: '', cpf: '', classificacao: 'regular' });
  return (
    <section className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Novo perfil</button>
      </div>
      {showForm && (
        <Panel title="Novo perfil de hospede">
          <div className="grid gap-3 md:grid-cols-5">
            {Object.entries(form).map(([key, value]) => key === 'classificacao'
              ? <Select key={key} value={value} onChange={e => setForm({ ...form, [key]: e.target.value as GuestClass })} options={['regular', 'vip', 'problema', 'bloqueado']} />
              : <Input key={key} value={value} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={label(key)} />)}
            <button onClick={() => run('Perfil salvo.', () => saveGuestProfile(form))} className="btn-primary">Salvar</button>
          </div>
        </Panel>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assignments.map(item => (
          <button key={item.id} onClick={() => onHistory(item)} className="rounded-lg border border-black/8 bg-white p-5 text-left shadow-sm transition hover:border-[#c3a37a]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efe4d4] font-serif text-lg">{initials(item.booking?.hospede_nome || 'H')}</span>
              <div>
                <h3 className="font-serif text-2xl">{item.booking?.hospede_nome}</h3>
                <p className="text-sm text-black/45">{item.booking?.hospede_email}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-black/55">Ultima reserva: quarto {item.quarto_numero} · {formatDate(item.checkin_previsto)}</p>
            {canManage && <Badge tone="neutral">Historico</Badge>}
          </button>
        ))}
      </div>
    </section>
  );
}

function IncidentsTab({ assignments, incidents, run }: { assignments: FDRoomAssignment[]; incidents: FDIncident[]; run: (message: string, action: () => Promise<unknown>) => Promise<void> }) {
  const [filter, setFilter] = useState<'aberto' | 'em_tratamento' | 'resolvido' | 'todas'>('aberto');
  const [form, setForm] = useState({ assignment_id: '', tipo: 'solicitacao' as IncidentType, descricao: '', status: 'aberto' as IncidentStatus, resolucao: '' });
  const filtered = incidents.filter(item => filter === 'todas' || item.status === filter);
  return (
    <section className="space-y-5">
      <Panel title="Registrar ocorrencia">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
          <Select value={form.assignment_id} onChange={e => setForm({ ...form, assignment_id: e.target.value })} options={['', ...assignments.map(item => item.id)]} labels={Object.fromEntries(assignments.map(item => [item.id, `${item.booking?.hospede_nome} · ${item.quarto_numero}`]))} />
          <Select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as IncidentType })} options={incidentTypes} />
          <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descricao" />
          <button onClick={() => run('Ocorrencia registrada.', () => saveIncident(form))} className="btn-primary">Salvar</button>
        </div>
      </Panel>
      <Chips values={['aberto', 'em_tratamento', 'resolvido', 'todas']} value={filter} onChange={value => setFilter(value as typeof filter)} />
      <div className="space-y-3">
        {filtered.map(item => (
          <article key={item.id} className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge tone={item.status === 'resolvido' ? 'green' : item.status === 'em_tratamento' ? 'yellow' : 'red'}>{label(item.status)}</Badge>
                <h3 className="mt-3 font-serif text-2xl">{label(item.tipo)}</h3>
                <p className="mt-1 text-sm text-black/55">{item.descricao}</p>
                {item.resolucao && <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">{item.resolucao}</p>}
              </div>
              {item.status !== 'resolvido' && <button onClick={() => run('Ocorrencia resolvida.', () => saveIncident({ id: item.id, tipo: item.tipo, descricao: item.descricao, status: 'resolvido', resolucao: 'Resolvido pela recepcao.' }))} className="btn-light">Resolver</button>}
            </div>
          </article>
        ))}
        {!filtered.length && <Empty text="Nenhuma ocorrencia neste filtro." />}
      </div>
    </section>
  );
}

function AssignmentDrawer({ mode, assignment, guestHistory, canManage, working, onClose, run }: {
  mode: DrawerMode;
  assignment: FDRoomAssignment;
  guestHistory: FDGuestHistory | null;
  canManage: boolean;
  working: boolean;
  onClose: () => void;
  run: (message: string, action: () => Promise<unknown>) => Promise<void>;
}) {
  const [keyId, setKeyId] = useState('');
  const [preferences, setPreferences] = useState({ andar: '', cama: '', alergias: '', observacoes: '' });
  const [saldoOk, setSaldoOk] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const saldo = Number(assignment.folio?.saldo_devedor || 0);
  const nights = daysBetween(assignment.checkin_previsto, assignment.checkout_previsto);

  return (
    <div className="fixed inset-0 z-[700] bg-black/35 backdrop-blur-sm">
      <aside className="ml-auto h-full w-full max-w-2xl overflow-y-auto bg-[#f7f3ea] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d7a4f]">{mode === 'checkin' ? 'Check-in' : mode === 'checkout' ? 'Check-out' : mode === 'guest' ? 'Historico' : 'Estadia'}</p>
            <h2 className="font-serif text-3xl">{assignment.booking?.hospede_nome}</h2>
            <p className="text-sm text-black/45">Quarto {assignment.quarto_numero} · {formatDate(assignment.checkin_previsto)} ate {formatDate(assignment.checkout_previsto)}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-black/10 p-2"><X size={18} /></button>
        </div>

        {mode === 'checkin' && (
          <div className="mt-5 space-y-5">
            <Panel title="Dados confirmados">
              <div className="grid gap-3 md:grid-cols-2">
                <Mini label="Email" value={assignment.booking?.hospede_email || '-'} />
                <Mini label="Telefone" value={assignment.booking?.telefone || '-'} />
                <Mini label="Hospedes" value={`${assignment.adultos} adulto(s), ${assignment.criancas} crianca(s)`} />
                <Mini label="Diarias" value={`${nights} x ${BRL.format((assignment.booking?.valor_diaria || 0) / 100)}`} />
              </div>
            </Panel>
            <Panel title="Preferencias">
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(preferences).map(([key, value]) => <Input key={key} value={value} onChange={e => setPreferences({ ...preferences, [key]: e.target.value })} placeholder={label(key)} />)}
              </div>
            </Panel>
            <Panel title="Chave">
              <Input value={keyId} onChange={e => setKeyId(e.target.value)} placeholder="Cartao, codigo ou chave fisica" />
            </Panel>
            <button disabled={working} onClick={() => run('Check-in realizado.', () => checkin(assignment.id, keyId, preferences))} className="w-full rounded-lg bg-green-700 px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50">
              <Check className="mr-2 inline" size={16} /> Confirmar check-in
            </button>
          </div>
        )}

        {mode === 'checkout' && (
          <div className="mt-5 space-y-5">
            <Panel title="Resumo do folio">
              <div className="grid gap-3 md:grid-cols-3">
                <Mini label="Total" value={BRL.format(assignment.folio?.total_geral || 0)} />
                <Mini label="Pago" value={BRL.format(assignment.folio?.total_pago || 0)} />
                <Mini label="Saldo" value={BRL.format(saldo)} danger={saldo > 0} />
              </div>
              {saldo > 0 ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  Saldo em aberto de {BRL.format(saldo)}.
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">Conta quitada.</div>
              )}
            </Panel>
            {saldo > 0 && <Select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} options={paymentMethods} />}
            {saldo > 0 && <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={saldoOk} onChange={e => setSaldoOk(e.target.checked)} /> Confirmo ciência do saldo</label>}
            <button disabled={working || (saldo > 0 && !saldoOk)} onClick={() => run('Check-out realizado.', () => checkout(assignment.id, saldoOk, saldo > 0 ? method : undefined))} className="w-full rounded-lg bg-[#20140d] px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50">Confirmar check-out</button>
          </div>
        )}

        {mode === 'detail' && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Mini label="Status" value={label(assignment.status)} />
            <Mini label="Chave" value={lastKey(assignment)?.tipo || 'Sem registro'} />
            <Mini label="Quarto" value={`${assignment.room?.tipo || '-'} · andar ${assignment.room?.andar || '-'}`} />
            <Mini label="Saldo folio" value={BRL.format(saldo)} danger={saldo > 0} />
          </div>
        )}

        {mode === 'guest' && guestHistory && (
          <div className="mt-5 space-y-5">
            <Panel title="Perfil">
              <div className="grid gap-3 md:grid-cols-2">
                <Mini label="Classificacao" value={label(guestHistory.perfil.classificacao)} />
                <Mini label="Estadias" value={String(guestHistory.perfil.total_estadias)} />
                <Mini label="Total gasto" value={BRL.format(guestHistory.perfil.total_gasto)} />
                <Mini label="Ultima estadia" value={guestHistory.perfil.ultima_estadia ? formatDate(guestHistory.perfil.ultima_estadia) : '-'} />
              </div>
              {canManage && <button onClick={() => run('Hospede marcado como VIP.', () => saveGuestProfile({ ...guestHistory.perfil, classificacao: 'vip', nome: guestHistory.perfil.nome }))} className="btn-light mt-4">Marcar VIP</button>}
            </Panel>
            <Panel title="Estadias">
              {guestHistory.estadias.map(item => <p key={item.id} className="border-b border-black/8 py-2 text-sm">Quarto {item.quarto_numero} · {formatDate(item.checkin_previsto)} ate {formatDate(item.checkout_previsto)} · {label(item.status)}</p>)}
            </Panel>
          </div>
        )}
      </aside>
    </div>
  );
}

function List({ assignments, empty, actionLabel, onAction }: { assignments: FDRoomAssignment[]; empty: string; actionLabel: string; onAction: (item: FDRoomAssignment) => void }) {
  if (!assignments.length) return <Empty text={empty} />;
  return (
    <div className="space-y-3">
      {assignments.map(item => (
        <article key={item.id} className="rounded-lg border border-black/8 bg-[#faf7f0] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">{item.booking?.hospede_nome}</p>
              <p className="mt-1 text-sm text-black/45">Quarto {item.quarto_numero || 'sem quarto'} · {item.adultos} adulto(s), {item.criancas} crianca(s)</p>
            </div>
            <button onClick={() => onAction(item)} className="btn-primary">{actionLabel}</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-black/8 bg-white p-5 shadow-sm"><h2 className="mb-4 font-serif text-2xl">{title}</h2>{children}</section>;
}

function Metric({ icon: Icon, label: text, value }: { icon: typeof DoorOpen; label: string; value: string }) {
  return <div className="rounded-lg border border-black/8 bg-white p-5 shadow-sm"><Icon size={18} className="mb-4 text-[#9d7a4f]" /><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">{text}</p><p className="mt-2 font-serif text-3xl">{value}</p></div>;
}

function Mini({ label: text, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <div className="rounded-lg bg-[#faf7f0] p-3"><p className="text-xs text-black/40">{text}</p><p className={`mt-1 font-semibold ${danger ? 'text-red-700' : 'text-black/80'}`}>{value}</p></div>;
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'green' | 'red' | 'blue' | 'yellow' | 'neutral' }) {
  const tones = {
    green: 'border-green-200 bg-green-50 text-green-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    neutral: 'border-black/10 bg-[#faf7f0] text-black/60',
  };
  return <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${tones[tone]}`}>{children}</span>;
}

function Chips({ values, value, onChange }: { values: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="flex flex-wrap gap-2">{values.map(item => <button key={item} onClick={() => onChange(item)} className={`rounded-full px-3 py-2 text-xs font-semibold ${value === item ? 'bg-[#20140d] text-white' : 'border border-black/10 bg-white text-black/55'}`}>{label(item)}</button>)}</div>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`min-h-11 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#c3a37a] ${props.className || ''}`} />;
}

function Select({ options, labels = {}, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; labels?: Record<string, string> }) {
  return <select {...props} className="min-h-11 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#c3a37a]">{options.map(option => <option key={option} value={option}>{labels[option] || label(option || 'Selecione')}</option>)}</select>;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg bg-[#faf7f0] p-4 text-sm text-black/45">{text}</p>;
}

function statusTone(status: string): 'green' | 'red' | 'blue' | 'yellow' | 'neutral' {
  if (status === 'checked_in') return 'green';
  if (status === 'checked_out') return 'neutral';
  if (status === 'reservado') return 'blue';
  if (status === 'no_show' || status === 'cancelado') return 'red';
  return 'yellow';
}

function lastKey(assignment: FDRoomAssignment) {
  return [...(assignment.key_events || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

function label(value: string) {
  return value.replace(/_/g, ' ').replace('checked in', 'check-in').replace('checked out', 'check-out').replace(/\b\w/g, char => char.toUpperCase());
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.round((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`));
}
