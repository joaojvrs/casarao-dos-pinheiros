import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  ChefHat,
  ClipboardList,
  ConciergeBell,
  CreditCard,
  Gauge,
  LineChart,
  Shield,
  Sparkles,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOperationsSummary } from '../services/operations';
import type { PermissionSet } from '../types/auth';
import type { AppPage } from '../types/navigation';
import type { OperationsSummary } from '../types/operations';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface ModuleItem {
  title: string;
  description: string;
  page: AppPage;
  permission?: keyof PermissionSet;
  icon: LucideIcon;
}

const MODULES: ModuleItem[] = [
  { title: 'Hospedagens', description: 'Criar reservas, validar disponibilidade e acompanhar check-ins.', page: 'booking', permission: 'bookings', icon: BedDouble },
  { title: 'Recepcao', description: 'Check-in/out digital, ocupacao em tempo real, quartos e chaves.', page: 'frontdesk', permission: 'bookings', icon: ConciergeBell },
  { title: 'Atendimento', description: 'Pedidos do hospede, frigobar, pagamentos e solicitacoes.', page: 'attendant', permission: 'roomService', icon: ConciergeBell },
  { title: 'Cozinha', description: 'Restaurante, PDV, comandas, estoque, caixa e relatorios.', page: 'kitchen', permission: 'kitchen', icon: ChefHat },
  { title: 'Governanca', description: 'Mapa de UHs, limpeza, manutencao e achados perdidos.', page: 'housekeeping', permission: 'housekeeping', icon: ClipboardList },
  { title: 'Financeiro', description: 'Caixa, folios, contas, repasses de OTA e DRE gerencial.', page: 'financial', permission: 'payments', icon: CreditCard },
  { title: 'Portal do Hospede', description: 'Visao da experiencia do hospede e solicitacoes.', page: 'guest', icon: Sparkles },
  { title: 'Acessos', description: 'Convidar equipe, perfis e permissoes por area.', page: 'access', permission: 'users', icon: Users },
  { title: 'RH & Escalas', description: 'Escalas semanais, ponto eletronico, equipe e ocorrencias.', page: 'hr', permission: 'hr', icon: CalendarDays },
  { title: 'Garcom', description: 'Lance pedidos no restaurante, gerencie comandas pelo celular.', page: 'garcom', permission: 'kitchen', icon: UtensilsCrossed },
];

export function OperationsPortal({ onBack, onNavigate }: { onBack: () => void; onNavigate: (page: AppPage) => void }) {
  const { role, permissions } = useAuth();
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState('');

  const allowed = role !== 'guest' && role !== 'visitor';

  useEffect(() => {
    if (!allowed) return;
    let mounted = true;
    setSummaryLoading(true);
    getOperationsSummary()
      .then(data => { if (mounted) setSummary(data); })
      .catch(err => { if (mounted) setError(err instanceof Error ? err.message : 'Nao foi possivel carregar o CRM.'); })
      .finally(() => { if (mounted) setSummaryLoading(false); });
    return () => { mounted = false; };
  }, [allowed]);

  const modules = useMemo(() => {
    const isMaster = role === 'master';
    const isAdmin = role === 'admin';
    return MODULES.filter(item => {
      if (!item.permission) return true;
      if (isMaster || isAdmin) return true;
      return Boolean(permissions[item.permission]);
    });
  }, [permissions, role]);

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-5 py-6">
        <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 hover:bg-black/5"><ArrowLeft size={18} /></button>
        <section className="mx-auto mt-20 max-w-md rounded-lg border border-black/8 bg-white p-7 text-center shadow-sm">
          <Shield className="mx-auto mb-4 text-[#9d7a4f]" size={34} />
          <h1 className="font-serif text-3xl">Acesso restrito.</h1>
          <p className="mt-3 text-sm leading-6 text-black/55">Entre com uma conta da equipe para acessar os modulos operacionais.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#20140d]">
      <header className="border-b border-black/8 bg-[#121a16] px-5 py-5 text-white md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"><ArrowLeft size={18} /></button>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#d7b98d]">Acesso da equipe</p>
            <h1 className="font-serif text-3xl">Operacao e CRM</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 md:px-10">
        {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">{error}</p>}

        <div className="grid gap-4 md:grid-cols-4">
          <Metric icon={Users} label="Hospedes ativos" value={summaryLoading ? '...' : String(summary?.activeGuests || 0)} />
          <Metric icon={BedDouble} label="Hospedagens ativas" value={summaryLoading ? '...' : String(summary?.activeBookings || 0)} />
          <Metric icon={Gauge} label="Reservas no mes" value={summaryLoading ? '...' : String(summary?.monthBookings || 0)} />
          <Metric icon={CreditCard} label="Ticket medio" value={summaryLoading ? '...' : (summary?.canViewFinancial ? BRL.format((summary.averageTicket || 0) / 100) : 'Restrito')} />
        </div>

        {summary?.canViewFinancial && (
          <section className="mt-6 rounded-lg border border-black/8 bg-[#151d18] p-5 text-white shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d7b98d]/15 text-[#d7b98d]"><LineChart size={18} /></span>
              <div>
                <h2 className="font-serif text-2xl">Gestao financeira</h2>
                <p className="text-sm text-white/45">Receitas de hospedagem, adicionais e experiencias no mes.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Finance label="Receita total" value={summary.monthRevenue} />
              <Finance label="Hospedagens" value={summary.lodgingRevenue} />
              <Finance label="Consumos e adicionais" value={summary.consumptionRevenue} />
            </div>
          </section>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map(({ title, description, page, icon: Icon }) => (
            <button key={title} onClick={() => onNavigate(page)} className="rounded-lg border border-black/8 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#c3a37a]/60 hover:shadow-lg">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#efe4d4] text-[#735333]"><Icon size={19} /></span>
              <h3 className="font-serif text-2xl">{title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-black/52">{description}</p>
            </button>
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-black/8 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-2xl">Hospedagens recentes</h2>
          <div className="mt-4 space-y-3">
            {summaryLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 rounded-lg border border-black/8 p-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-black/8" />
                    <div className="h-3 w-2/3 rounded bg-black/8" />
                  </div>
                  <div className="h-4 w-20 rounded bg-black/8" />
                </div>
              ))
            ) : (
              <>
                {(summary?.recentBookings || []).map(booking => (
                  <article key={booking.id} className="flex flex-col gap-3 rounded-lg border border-black/8 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{booking.confirmationCode} · {booking.guest || 'Hospede'}</p>
                      <p className="mt-1 text-sm text-black/45">{booking.accommodation || 'Acomodacao'} · {booking.checkIn} ate {booking.checkOut} · {booking.guestsCount} hospede{booking.guestsCount === 1 ? '' : 's'}</p>
                    </div>
                    <span className="text-sm font-semibold text-black/70">{summary?.canViewFinancial ? BRL.format(booking.total / 100) : booking.status}</span>
                  </article>
                ))}
                {!summary?.recentBookings?.length && <p className="rounded-lg bg-[#faf7f0] p-4 text-sm text-black/45">Nenhuma hospedagem recente encontrada.</p>}
              </>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
      <Icon size={18} className="mb-4 text-[#9d7a4f]" />
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </div>
  );
}

function Finance({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-2 font-serif text-3xl">{BRL.format(value / 100)}</p>
    </div>
  );
}
