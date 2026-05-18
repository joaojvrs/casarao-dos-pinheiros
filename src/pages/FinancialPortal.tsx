import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Banknote, Check, CreditCard, FileText, LineChart, Plus, ReceiptText, Wallet, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  addCashMovement,
  addFolioItem,
  addFolioPayment,
  closeCashSession,
  closeFolio,
  exportDREAsCSV,
  fetchFinSummary,
  getDRE,
  openCashSession,
  openFolio,
  payPayable,
  receiveReceivable,
  removeFolioItem,
  savePayable,
  saveReceivable,
} from '../services/financial';
import type { CostCenter, DRE, FinFolio, FinSummary, PaymentMethod } from '../types/financial';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const paymentMethods: PaymentMethod[] = ['dinheiro', 'debito', 'credito', 'pix', 'transferencia', 'faturado'];
const costCenters: CostCenter[] = ['hospedagem', 'restaurante', 'eventos', 'servicos'];

type Tab = 'caixa' | 'folios' | 'dre' | 'contas';

export function FinancialPortal({ onBack }: { onBack: () => void }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<FinSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('caixa');
  const [selectedFolio, setSelectedFolio] = useState<FinFolio | null>(null);
  const [folioFilter, setFolioFilter] = useState<'abertos' | 'fechados' | 'todos'>('abertos');
  const [receivableFilter, setReceivableFilter] = useState('pendente');
  const [payableFilter, setPayableFilter] = useState('pendente');
  const [showCashForm, setShowCashForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showFolioForm, setShowFolioForm] = useState(false);
  const [showReceivableForm, setShowReceivableForm] = useState(false);
  const [showPayableForm, setShowPayableForm] = useState(false);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { inicio, fim };
  });

  const hasAccess = ['master', 'admin', 'manager', 'financial'].includes(auth.role) || Boolean(auth.permissions.payments);

  const reload = async () => {
    setError('');
    const data = await fetchFinSummary(period.inicio, period.fim);
    setSummary(data);
    if (selectedFolio) {
      const refreshed = data.folios_abertos.find(folio => folio.id === selectedFolio.id);
      setSelectedFolio(refreshed || null);
    }
  };

  useEffect(() => {
    if (!auth.loading && !hasAccess) navigate('/equipe', { replace: true });
  }, [auth.loading, hasAccess, navigate]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchFinSummary(period.inicio, period.fim);
        if (mounted) setSummary(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Nao foi possivel carregar o financeiro.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (hasAccess) load();
    return () => { mounted = false; };
  }, [hasAccess, period.fim, period.inicio]);

  const mutate = async (action: () => Promise<unknown>) => {
    try {
      setError('');
      await action();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel concluir a operacao.');
    }
  };

  const allFolios = useMemo(() => summary?.folios_abertos || [], [summary]);

  if (loading) return <div className="min-h-screen bg-[#f7f3ea] flex items-center justify-center text-sm text-black/50">Carregando financeiro...</div>;
  if (!hasAccess) return null;

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#20140d]">
      <header className="border-b border-black/8 bg-[#121a16] px-5 py-5 text-white md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"><ArrowLeft size={18} /></button>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#d7b98d]">Financeiro</p>
            <h1 className="font-serif text-3xl">Caixa, folios e DRE</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 md:px-10">
        {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">{error}</p>}

        <div className="mb-6 flex flex-wrap gap-2">
          {(['caixa', 'folios', 'dre', 'contas'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${activeTab === tab ? 'bg-[#20140d] text-white' : 'border border-black/10 bg-white text-black/55 hover:text-black'}`}>
              {tab === 'dre' ? 'DRE' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'caixa' && summary && (
          <CashTab
            summary={summary}
            showCashForm={showCashForm}
            setShowCashForm={setShowCashForm}
            showMovementForm={showMovementForm}
            setShowMovementForm={setShowMovementForm}
            mutate={mutate}
          />
        )}

        {activeTab === 'folios' && (
          <FoliosTab
            folios={allFolios}
            filter={folioFilter}
            setFilter={setFolioFilter}
            selectedFolio={selectedFolio}
            setSelectedFolio={setSelectedFolio}
            showFolioForm={showFolioForm}
            setShowFolioForm={setShowFolioForm}
            mutate={mutate}
          />
        )}

        {activeTab === 'dre' && summary && (
          <DreTab dre={summary.dre} period={period} setPeriod={setPeriod} mutate={mutate} />
        )}

        {activeTab === 'contas' && summary && (
          <AccountsTab
            summary={summary}
            receivableFilter={receivableFilter}
            setReceivableFilter={setReceivableFilter}
            payableFilter={payableFilter}
            setPayableFilter={setPayableFilter}
            showReceivableForm={showReceivableForm}
            setShowReceivableForm={setShowReceivableForm}
            showPayableForm={showPayableForm}
            setShowPayableForm={setShowPayableForm}
            mutate={mutate}
          />
        )}
      </section>
    </main>
  );
}

function CashTab({ summary, showCashForm, setShowCashForm, showMovementForm, setShowMovementForm, mutate }: {
  summary: FinSummary;
  showCashForm: boolean;
  setShowCashForm: (value: boolean) => void;
  showMovementForm: boolean;
  setShowMovementForm: (value: boolean) => void;
  mutate: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const cash = summary.caixa_atual;
  const entradas = cash?.movements.filter(item => item.tipo === 'entrada').reduce((sum, item) => sum + Number(item.valor), 0) || 0;
  const saidas = cash?.movements.filter(item => item.tipo === 'saida').reduce((sum, item) => sum + Number(item.valor), 0) || 0;

  if (!cash) {
    return (
      <section className="rounded-lg border border-black/8 bg-white p-8 text-center shadow-sm">
        <Wallet className="mx-auto text-[#9d7a4f]" size={38} />
        <h2 className="mt-4 font-serif text-3xl">Nenhum caixa aberto.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">Abra um caixa para registrar pagamentos, repasses de OTA e movimentacoes do turno.</p>
        <button onClick={() => setShowCashForm(!showCashForm)} className="mt-5 rounded-full bg-[#20140d] px-5 py-3 text-sm font-semibold text-white">Abrir caixa</button>
        {showCashForm && <OpenCashForm mutate={mutate} />}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d7a4f]">Caixa aberto</p>
            <h2 className="font-serif text-3xl">Turno {label(cash.turno)} · {cash.operador?.nome || 'Operador'}</h2>
            <p className="mt-1 text-sm text-black/45">Desde {formatDateTime(cash.aberto_em)}</p>
          </div>
          <CloseCashForm sessionId={cash.id} mutate={mutate} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Wallet} label="Saldo inicial" value={BRL.format(Number(cash.saldo_abertura))} />
        <Metric icon={Plus} label="Entradas" value={BRL.format(entradas)} />
        <Metric icon={X} label="Saidas" value={BRL.format(saidas)} />
        <Metric icon={Banknote} label="Saldo estimado" value={BRL.format(Number(cash.saldo_abertura) + entradas - saidas)} />
      </div>

      <Panel title="Movimentacoes do turno" action={<button onClick={() => setShowMovementForm(!showMovementForm)} className="rounded-full border border-black/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">Lançar</button>}>
        {showMovementForm && <CashMovementForm sessionId={cash.id} mutate={mutate} />}
        <div className="mt-4 divide-y divide-black/8">
          {cash.movements.map(item => (
            <div key={item.id} className="grid gap-2 py-3 text-sm md:grid-cols-[90px_1fr_120px_120px_120px] md:items-center">
              <Badge tone={item.tipo === 'entrada' ? 'green' : 'red'}>{item.tipo}</Badge>
              <div>
                <p className="font-semibold">{item.descricao}</p>
                <p className="text-xs text-black/40">{item.categoria} · {formatDateTime(item.created_at)}</p>
              </div>
              <Badge tone="neutral">{item.forma_pagamento || 'sem forma'}</Badge>
              <span className="text-black/55">{item.centro_custo || '-'}</span>
              <strong className={item.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'}>{BRL.format(Number(item.valor))}</strong>
            </div>
          ))}
          {!cash.movements.length && <Empty text="Nenhuma movimentacao neste caixa." />}
        </div>
        <div className="mt-4 rounded-lg bg-[#151d18] p-4 text-sm font-semibold text-white">
          Entradas {BRL.format(entradas)} · Saidas {BRL.format(saidas)} · Saldo {BRL.format(Number(cash.saldo_abertura) + entradas - saidas)}
        </div>
      </Panel>
    </section>
  );
}

function FoliosTab({ folios, filter, setFilter, selectedFolio, setSelectedFolio, showFolioForm, setShowFolioForm, mutate }: {
  folios: FinFolio[];
  filter: string;
  setFilter: (value: 'abertos' | 'fechados' | 'todos') => void;
  selectedFolio: FinFolio | null;
  setSelectedFolio: (folio: FinFolio | null) => void;
  showFolioForm: boolean;
  setShowFolioForm: (value: boolean) => void;
  mutate: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const filtered = folios.filter(folio => filter === 'todos' || (filter === 'abertos' ? folio.status === 'aberto' : folio.status === 'fechado'));
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Chips values={['abertos', 'fechados', 'todos']} value={filter} onChange={value => setFilter(value as 'abertos' | 'fechados' | 'todos')} />
        <button onClick={() => setShowFolioForm(!showFolioForm)} className="rounded-full bg-[#20140d] px-5 py-3 text-sm font-semibold text-white">Novo folio</button>
      </div>
      {showFolioForm && <NewFolioForm mutate={mutate} />}
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map(folio => (
          <button key={folio.id} onClick={() => setSelectedFolio(folio)} className="rounded-lg border border-black/8 bg-white p-5 text-left shadow-sm transition hover:border-[#c3a37a]/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl">{folio.hospede_nome}</h3>
                <p className="text-sm text-black/45">Quarto {folio.quarto || '-'} · {folio.checkin || '-'} → {folio.checkout || '-'}</p>
              </div>
              <Badge tone={folio.status === 'aberto' ? 'blue' : 'green'}>{folio.status}</Badge>
            </div>
            <p className="mt-4 text-sm text-black/55">{centerLine(folio)}</p>
            <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
              <Total label="Total" value={folio.total_geral} />
              <Total label="Pago" value={folio.total_pago} />
              <Total label="Saldo" value={folio.saldo_devedor} danger={Number(folio.saldo_devedor) > 0} />
            </div>
          </button>
        ))}
        {!filtered.length && <Empty text="Nenhum folio encontrado neste filtro." />}
      </div>
      {selectedFolio && <FolioDrawer folio={selectedFolio} onClose={() => setSelectedFolio(null)} mutate={mutate} />}
    </section>
  );
}

function DreTab({ dre, period, setPeriod, mutate }: {
  dre: DRE;
  period: { inicio: string; fim: string };
  setPeriod: (period: { inicio: string; fim: string }) => void;
  mutate: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const [localDre, setLocalDre] = useState(dre);
  useEffect(() => setLocalDre(dre), [dre]);
  const margin = localDre.receitas.total > 0 ? (localDre.resultado_bruto / localDre.receitas.total) * 100 : 0;
  return (
    <section className="space-y-5">
      <Panel title="Periodo">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <Input type="date" value={period.inicio} onChange={event => setPeriod({ ...period, inicio: event.target.value })} />
          <Input type="date" value={period.fim} onChange={event => setPeriod({ ...period, fim: event.target.value })} />
          <button onClick={() => mutate(async () => setLocalDre(await getDRE(period.inicio, period.fim)))} className="rounded-lg bg-[#20140d] px-4 py-3 text-sm font-semibold text-white">Aplicar</button>
          <button onClick={() => exportDREAsCSV(localDre)} className="rounded-lg border border-black/10 px-4 py-3 text-sm font-semibold">Exportar CSV</button>
        </div>
      </Panel>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Receitas">
          <DreRows data={localDre.receitas} total={localDre.receitas.total} />
        </Panel>
        <Panel title="Despesas">
          <DreExpenseRows data={localDre.despesas} />
        </Panel>
        <div className={`rounded-lg border p-5 shadow-sm ${localDre.resultado_bruto >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">Resultado bruto</p>
          <p className="mt-4 font-serif text-4xl">{BRL.format(localDre.resultado_bruto)}</p>
          <p className="mt-2 text-sm text-black/50">Margem operacional {margin.toFixed(1)}%</p>
        </div>
      </div>
      <Panel title="Resultado por centro de custo">
        <div className="grid gap-3 md:grid-cols-2">
          {costCenters.map(center => (
            <div key={center} className="rounded-lg border border-black/8 bg-[#faf7f0] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/35">{label(center)}</p>
              <p className="mt-2 font-serif text-2xl">{BRL.format(localDre.resultado_por_centro[center])}</p>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function AccountsTab({ summary, receivableFilter, setReceivableFilter, payableFilter, setPayableFilter, showReceivableForm, setShowReceivableForm, showPayableForm, setShowPayableForm, mutate }: {
  summary: FinSummary;
  receivableFilter: string;
  setReceivableFilter: (value: string) => void;
  payableFilter: string;
  setPayableFilter: (value: string) => void;
  showReceivableForm: boolean;
  setShowReceivableForm: (value: boolean) => void;
  showPayableForm: boolean;
  setShowPayableForm: (value: boolean) => void;
  mutate: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const receivables = summary.receivables_pendentes.filter(item => receivableFilter === 'todas' || item.status === receivableFilter);
  const payables = summary.payables_pendentes.filter(item => payableFilter === 'todas' || item.status === payableFilter);
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <Panel title="Receber" action={<button onClick={() => setShowReceivableForm(!showReceivableForm)} className="rounded-full border border-black/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">Nova</button>}>
        <AlertLine red={summary.metricas.receivables_vencidos} label="contas vencidas" />
        <Chips values={['pendente', 'recebido', 'vencido', 'todas']} value={receivableFilter} onChange={setReceivableFilter} />
        {showReceivableForm && <ReceivableForm mutate={mutate} />}
        <div className="mt-4 space-y-3">
          {receivables.map(item => (
            <AccountRow key={item.id} title={item.descricao} subtitle={`${item.origem} · vence ${item.vencimento}`} value={item.valor} status={item.status}>
              {item.status === 'pendente' && <PaymentButton label="Receber" onPay={method => mutate(() => receiveReceivable(item.id, method))} />}
            </AccountRow>
          ))}
          {!receivables.length && <Empty text="Nenhuma conta a receber neste filtro." />}
        </div>
      </Panel>
      <Panel title="Pagar" action={<button onClick={() => setShowPayableForm(!showPayableForm)} className="rounded-full border border-black/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">Nova</button>}>
        <AlertLine red={summary.metricas.payables_vencidos} label="contas vencidas" />
        <Chips values={['pendente', 'pago', 'vencido', 'todas']} value={payableFilter} onChange={setPayableFilter} />
        {showPayableForm && <PayableForm mutate={mutate} />}
        <div className="mt-4 space-y-3">
          {payables.map(item => (
            <AccountRow key={item.id} title={item.descricao} subtitle={`${item.fornecedor || 'Sem fornecedor'} · vence ${item.vencimento}`} value={item.valor} status={item.status}>
              {item.status === 'pendente' && <PaymentButton label="Pagar" onPay={method => mutate(() => payPayable(item.id, method))} />}
            </AccountRow>
          ))}
          {!payables.length && <Empty text="Nenhuma conta a pagar neste filtro." />}
        </div>
      </Panel>
    </section>
  );
}

function FolioDrawer({ folio, onClose, mutate }: { folio: FinFolio; onClose: () => void; mutate: (action: () => Promise<unknown>) => Promise<void> }) {
  const [showItem, setShowItem] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const open = folio.status === 'aberto';
  return (
    <div className="fixed inset-0 z-[700] bg-black/35 backdrop-blur-sm">
      <aside className="ml-auto h-full w-full max-w-2xl overflow-y-auto bg-[#f7f3ea] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d7a4f]">Folio</p>
            <h2 className="font-serif text-3xl">{folio.hospede_nome}</h2>
            <p className="text-sm text-black/45">Quarto {folio.quarto || '-'} · {folio.checkin || '-'} → {folio.checkout || '-'}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-black/10 p-2"><X size={18} /></button>
        </div>

        <Panel title="Itens lançados" action={open && <button onClick={() => setShowItem(!showItem)} className="text-sm font-semibold text-[#735333]">+ Lançar item</button>}>
          {showItem && <FolioItemForm folioId={folio.id} mutate={mutate} />}
          <div className="mt-4 space-y-2">
            {folio.items.map(item => (
              <div key={item.id} className="grid gap-2 rounded-lg border border-black/8 bg-white p-3 text-sm md:grid-cols-[110px_1fr_80px_90px_80px] md:items-center">
                <Badge tone="neutral">{item.centro_custo}</Badge>
                <span>{item.descricao}</span>
                <span>{Number(item.quantidade)}</span>
                <strong>{BRL.format(Number(item.valor_total))}</strong>
                {open && <button onClick={() => mutate(() => removeFolioItem(item.id))} className="text-xs font-semibold text-red-700">Remover</button>}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Pagamentos" action={open && <button onClick={() => setShowPayment(!showPayment)} className="text-sm font-semibold text-[#735333]">+ Registrar pagamento</button>}>
          {showPayment && <FolioPaymentForm folio={folio} mutate={mutate} />}
          <div className="mt-4 space-y-2">
            {folio.payments.map(payment => (
              <div key={payment.id} className="flex items-center justify-between rounded-lg border border-black/8 bg-white p-3 text-sm">
                <span>{payment.forma_pagamento} · {formatDateTime(payment.created_at)}</span>
                <strong>{BRL.format(Number(payment.valor))}</strong>
              </div>
            ))}
            {!folio.payments.length && <Empty text="Nenhum pagamento registrado." />}
          </div>
        </Panel>

        <div className="sticky bottom-0 mt-5 rounded-lg border border-black/8 bg-[#151d18] p-5 text-white shadow-lg">
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <Total label="Total" value={folio.total_geral} dark />
            <Total label="Pago" value={folio.total_pago} dark />
            <Total label="Saldo" value={folio.saldo_devedor} danger={Number(folio.saldo_devedor) > 0} dark />
            <button disabled={!open || Number(folio.saldo_devedor) > 0} title={Number(folio.saldo_devedor) > 0 ? 'Quite o saldo antes de fechar.' : ''} onClick={() => mutate(() => closeFolio(folio.id))} className="rounded-lg bg-[#d7b98d] px-4 py-3 font-semibold text-[#20140d] disabled:cursor-not-allowed disabled:opacity-45">Fechar folio</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function OpenCashForm({ mutate }: { mutate: (action: () => Promise<unknown>) => Promise<void> }) {
  const [amount, setAmount] = useState('0');
  const [turno, setTurno] = useState<'manha' | 'tarde' | 'noite'>('manha');
  return (
    <div className="mx-auto mt-5 grid max-w-md gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 text-left">
      <Input type="number" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Saldo de abertura" />
      <Select value={turno} onChange={event => setTurno(event.target.value as 'manha' | 'tarde' | 'noite')} options={['manha', 'tarde', 'noite']} />
      <button onClick={() => mutate(() => openCashSession(Number(amount), turno))} className="rounded-lg bg-[#20140d] px-4 py-3 text-sm font-semibold text-white">Confirmar abertura</button>
    </div>
  );
}

function CloseCashForm({ sessionId, mutate }: { sessionId: string; mutate: (action: () => Promise<unknown>) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('0');
  const [obs, setObs] = useState('');
  return (
    <div className="w-full max-w-sm">
      <button onClick={() => setOpen(!open)} className="w-full rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black md:w-auto">Fechar caixa</button>
      {open && (
        <div className="mt-3 grid gap-2 rounded-lg border border-black/8 bg-[#faf7f0] p-3">
          <Input type="number" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Saldo contado" />
          <Input value={obs} onChange={event => setObs(event.target.value)} placeholder="Observacao" />
          <button onClick={() => mutate(() => closeCashSession(sessionId, Number(amount), obs))} className="rounded-lg bg-[#20140d] px-4 py-3 text-sm font-semibold text-white">Confirmar fechamento</button>
        </div>
      )}
    </div>
  );
}

function CashMovementForm({ sessionId, mutate }: { sessionId: string; mutate: (action: () => Promise<unknown>) => Promise<void> }) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [data, setData] = useState({ categoria: 'folio', descricao: '', valor: '', forma_pagamento: 'dinheiro' as PaymentMethod, centro_custo: 'hospedagem' as CostCenter });
  const categories = tipo === 'entrada' ? ['folio', 'servico_avulso', 'ota_repasse', 'outros'] : ['sangria', 'despesa_operacional', 'fornecedor', 'outros'];
  return (
    <FormGrid>
      <Select value={tipo} onChange={event => { setTipo(event.target.value as 'entrada' | 'saida'); setData({ ...data, categoria: event.target.value === 'entrada' ? 'folio' : 'sangria' }); }} options={['entrada', 'saida']} />
      <Select value={data.categoria} onChange={event => setData({ ...data, categoria: event.target.value })} options={categories} />
      <Input value={data.descricao} onChange={event => setData({ ...data, descricao: event.target.value })} placeholder="Descricao" />
      <Input type="number" value={data.valor} onChange={event => setData({ ...data, valor: event.target.value })} placeholder="Valor" />
      <Select value={data.forma_pagamento} onChange={event => setData({ ...data, forma_pagamento: event.target.value as PaymentMethod })} options={paymentMethods} />
      <Select value={data.centro_custo} onChange={event => setData({ ...data, centro_custo: event.target.value as CostCenter })} options={costCenters} />
      <button onClick={() => mutate(() => addCashMovement({ session_id: sessionId, tipo, ...data, valor: Number(data.valor) }))} className="rounded-lg bg-[#20140d] px-4 py-3 text-sm font-semibold text-white">Lançar</button>
    </FormGrid>
  );
}

function NewFolioForm({ mutate }: { mutate: (action: () => Promise<unknown>) => Promise<void> }) {
  const [data, setData] = useState({ hospede_nome: '', hospede_email: '', quarto: '', checkin: '', checkout: '', reserva_id: '' });
  return (
    <Panel title="Novo folio">
      <FormGrid>
        {Object.entries(data).map(([key, value]) => (
          <Input key={key} type={key === 'checkin' || key === 'checkout' ? 'date' : 'text'} value={value} onChange={event => setData({ ...data, [key]: event.target.value })} placeholder={label(key)} />
        ))}
        <button onClick={() => mutate(() => openFolio(data))} className="rounded-lg bg-[#20140d] px-4 py-3 text-sm font-semibold text-white">Criar folio</button>
      </FormGrid>
    </Panel>
  );
}

function FolioItemForm({ folioId, mutate }: { folioId: string; mutate: (action: () => Promise<unknown>) => Promise<void> }) {
  const [data, setData] = useState({ centro_custo: 'restaurante' as CostCenter, descricao: '', quantidade: '1', valor_unitario: '' });
  return (
    <FormGrid>
      <Select value={data.centro_custo} onChange={event => setData({ ...data, centro_custo: event.target.value as CostCenter })} options={costCenters} />
      <Input value={data.descricao} onChange={event => setData({ ...data, descricao: event.target.value })} placeholder="Descricao" />
      <Input type="number" value={data.quantidade} onChange={event => setData({ ...data, quantidade: event.target.value })} placeholder="Quantidade" />
      <Input type="number" value={data.valor_unitario} onChange={event => setData({ ...data, valor_unitario: event.target.value })} placeholder="Valor unitario" />
      <button onClick={() => mutate(() => addFolioItem({ folio_id: folioId, centro_custo: data.centro_custo, descricao: data.descricao, quantidade: Number(data.quantidade), valor_unitario: Number(data.valor_unitario) }))} className="rounded-lg bg-[#20140d] px-4 py-3 text-sm font-semibold text-white">Salvar item</button>
    </FormGrid>
  );
}

function FolioPaymentForm({ folio, mutate }: { folio: FinFolio; mutate: (action: () => Promise<unknown>) => Promise<void> }) {
  const [data, setData] = useState({ forma_pagamento: 'pix' as PaymentMethod, valor: String(folio.saldo_devedor), parcelas: '1', observacao: '' });
  return (
    <FormGrid>
      <Select value={data.forma_pagamento} onChange={event => setData({ ...data, forma_pagamento: event.target.value as PaymentMethod })} options={paymentMethods} />
      <Input type="number" value={data.valor} onChange={event => setData({ ...data, valor: event.target.value })} placeholder="Valor" />
      {data.forma_pagamento === 'credito' && <Input type="number" value={data.parcelas} onChange={event => setData({ ...data, parcelas: event.target.value })} placeholder="Parcelas" />}
      <Input value={data.observacao} onChange={event => setData({ ...data, observacao: event.target.value })} placeholder="Observacao" />
      <button onClick={() => mutate(() => addFolioPayment({ folio_id: folio.id, forma_pagamento: data.forma_pagamento, valor: Number(data.valor), parcelas: Number(data.parcelas), observacao: data.observacao }))} className="rounded-lg bg-[#20140d] px-4 py-3 text-sm font-semibold text-white">Registrar</button>
    </FormGrid>
  );
}

function ReceivableForm({ mutate }: { mutate: (action: () => Promise<unknown>) => Promise<void> }) {
  const [data, setData] = useState({ descricao: '', origem: 'ota_booking', valor: '', vencimento: '', centro_custo: 'hospedagem' as CostCenter, observacao: '' });
  return (
    <FormGrid>
      <Input value={data.descricao} onChange={event => setData({ ...data, descricao: event.target.value })} placeholder="Descricao" />
      <Select value={data.origem} onChange={event => setData({ ...data, origem: event.target.value })} options={['folio', 'ota_booking', 'ota_airbnb', 'ota_expedia', 'evento', 'outro']} />
      <Input type="number" value={data.valor} onChange={event => setData({ ...data, valor: event.target.value })} placeholder="Valor" />
      <Input type="date" value={data.vencimento} onChange={event => setData({ ...data, vencimento: event.target.value })} />
      <Select value={data.centro_custo} onChange={event => setData({ ...data, centro_custo: event.target.value as CostCenter })} options={costCenters} />
      <button onClick={() => mutate(() => saveReceivable({ ...data, valor: Number(data.valor) }))} className="rounded-lg bg-[#20140d] px-4 py-3 text-sm font-semibold text-white">Salvar</button>
    </FormGrid>
  );
}

function PayableForm({ mutate }: { mutate: (action: () => Promise<unknown>) => Promise<void> }) {
  const [data, setData] = useState({ descricao: '', fornecedor: '', valor: '', vencimento: '', centro_custo: 'restaurante' as CostCenter, observacao: '' });
  return (
    <FormGrid>
      <Input value={data.descricao} onChange={event => setData({ ...data, descricao: event.target.value })} placeholder="Descricao" />
      <Input value={data.fornecedor} onChange={event => setData({ ...data, fornecedor: event.target.value })} placeholder="Fornecedor" />
      <Input type="number" value={data.valor} onChange={event => setData({ ...data, valor: event.target.value })} placeholder="Valor" />
      <Input type="date" value={data.vencimento} onChange={event => setData({ ...data, vencimento: event.target.value })} />
      <Select value={data.centro_custo} onChange={event => setData({ ...data, centro_custo: event.target.value as CostCenter })} options={costCenters} />
      <button onClick={() => mutate(() => savePayable({ ...data, valor: Number(data.valor) }))} className="rounded-lg bg-[#20140d] px-4 py-3 text-sm font-semibold text-white">Salvar</button>
    </FormGrid>
  );
}

function PaymentButton({ label: text, onPay }: { label: string; onPay: (method: PaymentMethod) => void }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('pix');
  return (
    <div className="flex items-center gap-2">
      {open && <Select value={method} onChange={event => setMethod(event.target.value as PaymentMethod)} options={paymentMethods} />}
      <button onClick={() => open ? onPay(method) : setOpen(true)} className="rounded-full bg-[#20140d] px-4 py-2 text-xs font-semibold text-white">{text}</button>
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({ icon: Icon, label: text, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
      <Icon size={18} className="mb-4 text-[#9d7a4f]" />
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">{text}</p>
      <p className="mt-2 font-serif text-2xl">{value}</p>
    </div>
  );
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
  return (
    <div className="flex flex-wrap gap-2">
      {values.map(item => (
        <button key={item} onClick={() => onChange(item)} className={`rounded-full px-3 py-2 text-xs font-semibold ${value === item ? 'bg-[#20140d] text-white' : 'border border-black/10 bg-white text-black/55'}`}>{label(item)}</button>
      ))}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`min-h-11 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#c3a37a] ${props.className || ''}`} />;
}

function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
  return (
    <select {...props} className="min-h-11 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#c3a37a]">
      {options.map(option => <option key={option} value={option}>{label(option)}</option>)}
    </select>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 grid gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 md:grid-cols-2">{children}</div>;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg bg-[#faf7f0] p-4 text-sm text-black/45">{text}</p>;
}

function Total({ label: text, value, danger, dark }: { label: string; value: number; danger?: boolean; dark?: boolean }) {
  return (
    <div className={dark ? '' : 'rounded-lg bg-[#faf7f0] p-3'}>
      <p className={`text-xs ${dark ? 'text-white/45' : 'text-black/40'}`}>{text}</p>
      <p className={`mt-1 font-serif text-xl ${danger ? 'text-red-600' : dark ? 'text-white' : 'text-black'}`}>{BRL.format(Number(value || 0))}</p>
    </div>
  );
}

function AlertLine({ red, label: text }: { red: number; label: string }) {
  return red > 0 ? <p className="mb-3 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">{red} {text}</p> : null;
}

function AccountRow({ title, subtitle, value, status, children }: { title: string; subtitle: string; value: number; status: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/8 bg-[#faf7f0] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-xs text-black/45">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={status.includes('venc') ? 'red' : status.includes('pago') || status.includes('recebido') ? 'green' : 'yellow'}>{status}</Badge>
          <strong>{BRL.format(Number(value))}</strong>
          {children}
        </div>
      </div>
    </div>
  );
}

function DreRows({ data, total }: { data: Record<CostCenter | 'total', number>; total: number }) {
  return (
    <div className="space-y-3">
      {costCenters.map(center => {
        const value = Number(data[center] || 0);
        return (
          <div key={center}>
            <div className="flex justify-between text-sm"><span>{label(center)}</span><strong>{BRL.format(value)}</strong></div>
            <div className="mt-1 h-2 rounded-full bg-black/5"><div className="h-2 rounded-full bg-[#9d7a4f]" style={{ width: `${total > 0 ? Math.min(100, (value / total) * 100) : 0}%` }} /></div>
          </div>
        );
      })}
      <div className="border-t border-black/8 pt-3 font-semibold">Total {BRL.format(total)}</div>
    </div>
  );
}

function DreExpenseRows({ data }: { data: { operacional: number; fornecedores: number; outros: number; total: number } }) {
  return (
    <div className="space-y-3 text-sm">
      {(['operacional', 'fornecedores', 'outros'] as const).map(key => <p key={key} className="flex justify-between"><span>{label(key)}</span><strong>{BRL.format(data[key])}</strong></p>)}
      <div className="border-t border-black/8 pt-3 font-semibold">Total {BRL.format(data.total)}</div>
    </div>
  );
}

function label(value: string) {
  return value.replace(/_/g, ' ').replace('debito', 'débito').replace('credito', 'crédito').replace('servicos', 'serviços').replace('manha', 'manhã').replace(/\b\w/g, char => char.toUpperCase());
}

function centerLine(folio: FinFolio) {
  return [
    folio.total_hospedagem > 0 ? `Hospedagem ${BRL.format(folio.total_hospedagem)}` : '',
    folio.total_restaurante > 0 ? `Restaurante ${BRL.format(folio.total_restaurante)}` : '',
    folio.total_servicos > 0 ? `Serviços ${BRL.format(folio.total_servicos)}` : '',
    folio.total_eventos > 0 ? `Eventos ${BRL.format(folio.total_eventos)}` : '',
  ].filter(Boolean).join(' · ') || 'Sem lancamentos.';
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
