import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle, ArrowLeft, Bath, BedDouble, Check, CheckCircle2, ChevronDown,
  ChevronUp, Clock, Coffee, CreditCard, Flame, GlassWater, KeyRound, Leaf,
  ListOrdered, Loader2, LogOut, Package, QrCode, Refrigerator, Sparkles,
  ThumbsUp, UtensilsCrossed, Wine, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { GuestOrder, HKRequest } from '../types/portal';

type IconComponent = LucideIcon;

interface AttendantPortalProps {
  onBack: () => void;
  orders: GuestOrder[];
  onUpdateOrderStatus: (id: string, status: GuestOrder['status']) => void;
  onUpdatePaymentStatus: (id: string, paymentStatus: GuestOrder['paymentStatus']) => void;
  hkRequests: HKRequest[];
  onUpdateHKStatus: (id: string, status: HKRequest['status']) => void;
  frigobarConsumed: Record<string, number>;
}

type ATab = 'orders' | 'frigobar' | 'housekeeping' | 'account';

const ATTENDANT = { user: 'Atendente', password: 'eden2026' };
const ROOM = 'Chalé Pinheiros';
const GUEST = 'Jairo Alves';

const FRIGOBAR_ITEMS = [
  { name: 'Agua Mineral 500ml', standardQty: 2, price: 0, icon: GlassWater },
  { name: 'Refrigerante Lata', standardQty: 2, price: 8, icon: GlassWater },
  { name: 'Cerveja Artesanal', standardQty: 2, price: 18, icon: Wine },
  { name: 'Suco Natural 300ml', standardQty: 1, price: 12, icon: GlassWater },
  { name: 'Vinho Tinto Mini', standardQty: 1, price: 35, icon: Wine },
  { name: 'Mix de Castanhas', standardQty: 1, price: 22, icon: Leaf },
  { name: 'Chocolate Amargo', standardQty: 2, price: 15, icon: Sparkles },
];

const STATUS_ORDER: Record<GuestOrder['status'], { label: string; color: string; bg: string }> = {
  pending: { label: 'Aguardando', color: '#b45309', bg: '#fef3c7' },
  preparing: { label: 'Preparando', color: '#1d4ed8', bg: '#dbeafe' },
  delivered: { label: 'Entregue', color: '#15803d', bg: '#dcfce7' },
};

const STATUS_HK: Record<HKRequest['status'], { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: '#b45309', bg: '#fef3c7' },
  in_progress: { label: 'Em andamento', color: '#1d4ed8', bg: '#dbeafe' },
  done: { label: 'Concluído', color: '#15803d', bg: '#dcfce7' },
};

const PAYMENT_STATUS: Record<GuestOrder['paymentStatus'], { label: string; icon: IconComponent; color: string }> = {
  pending: { label: 'PIX pendente', icon: QrCode, color: '#b45309' },
  paid: { label: 'PIX pago', icon: CheckCircle2, color: '#15803d' },
  charged: { label: 'Na conta', icon: CreditCard, color: '#1d4ed8' },
};

const ATABS: { id: ATab; label: string; Icon: IconComponent }[] = [
  { id: 'orders', label: 'Pedidos', Icon: ListOrdered },
  { id: 'frigobar', label: 'Frigobar', Icon: Refrigerator },
  { id: 'housekeeping', label: 'Arrumação', Icon: BedDouble },
  { id: 'account', label: 'Conta', Icon: CreditCard },
];

export const AttendantPortal: React.FC<AttendantPortalProps> = ({
  onBack, orders, onUpdateOrderStatus, onUpdatePaymentStatus,
  hkRequests, onUpdateHKStatus, frigobarConsumed,
}) => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ATab>('orders');

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.trim() === ATTENDANT.user && password === ATTENDANT.password) {
      setLogged(true); setError('');
    } else {
      setError('Credenciais incorretas. Use Atendente / eden2026');
    }
  };

  const pendingOrders = orders.filter(o => o.status !== 'delivered').length;
  const pendingHK = hkRequests.filter(r => r.status !== 'done').length;
  const frigoTotal = FRIGOBAR_ITEMS.reduce((sum, item) => sum + (frigobarConsumed[item.name] || 0) * item.price, 0);
  const roomServiceTotal = orders.filter(o => o.paymentStatus === 'charged').reduce((s, o) => s + o.total, 0);

  if (!logged) {
    return <AttendantLogin onBack={onBack} login={login} user={user} setUser={setUser} password={password} setPassword={setPassword} error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#3a6b4a]">Painel da Equipe</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Vale do Eden · Turno ativo</p>
          </div>
          <button onClick={() => setLogged(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition">
            <LogOut size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Quick stats */}
        <div className="max-w-3xl mx-auto px-4 pb-3 grid grid-cols-4 gap-2">
          <QuickStat label="Pedidos" value={String(pendingOrders)} accent={pendingOrders > 0 ? '#b45309' : '#15803d'} />
          <QuickStat label="Arrumação" value={String(pendingHK)} accent={pendingHK > 0 ? '#b45309' : '#15803d'} />
          <QuickStat label="Frigobar" value={`R$${frigoTotal}`} accent="#1d4ed8" />
          <QuickStat label="Conta" value={`R$${roomServiceTotal + frigoTotal}`} accent="#1a0f0a" />
        </div>
      </header>

      {/* Tab nav */}
      <div className="sticky top-[105px] z-30 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 flex gap-1">
          {ATABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold transition border-b-2 ${activeTab === id ? 'border-[#1a0f0a] text-[#1a0f0a]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              <Icon size={14} />{label}
              {id === 'orders' && pendingOrders > 0 && <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">{pendingOrders}</span>}
              {id === 'housekeeping' && pendingHK > 0 && <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">{pendingHK}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 pt-5">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {activeTab === 'orders' && (
              <OrdersTab orders={orders} onUpdateStatus={onUpdateOrderStatus} onUpdatePayment={onUpdatePaymentStatus} />
            )}
            {activeTab === 'frigobar' && <FrigobarTab consumed={frigobarConsumed} />}
            {activeTab === 'housekeeping' && <HousekeepingTab requests={hkRequests} onUpdateStatus={onUpdateHKStatus} />}
            {activeTab === 'account' && <AccountTab orders={orders} frigobarConsumed={frigobarConsumed} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

// ─── Login ────────────────────────────────────────────────────────────────────

function AttendantLogin({ onBack, login, user, setUser, password, setPassword, error }: {
  onBack: () => void; login: (e: React.FormEvent) => void;
  user: string; setUser: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  error: string;
}) {
  return (
    <section className="min-h-screen bg-gray-900 flex items-center justify-center px-5">
      <button onClick={onBack} className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 transition">
        <ArrowLeft size={18} />
      </button>
      <motion.form onSubmit={login} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-800 p-7 shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3a6b4a] mx-auto mb-6">
          <KeyRound size={24} className="text-white" />
        </div>
        <h1 className="text-center text-xl font-bold text-white mb-1">Área da Equipe</h1>
        <p className="text-center text-sm text-gray-400 mb-7">Vale do Eden · Painel de atendimento</p>

        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">Usuário</label>
        <input value={user} onChange={e => setUser(e.target.value)} className="mb-4 h-11 w-full rounded-xl border border-white/10 bg-white/8 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#3a6b4a]" placeholder="Atendente" />

        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">Senha</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="mb-4 h-11 w-full rounded-xl border border-white/10 bg-white/8 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#3a6b4a]" placeholder="eden2026" />

        {error && <p className="mb-4 rounded-xl bg-red-900/30 border border-red-800/30 p-3 text-sm text-red-300">{error}</p>}

        <button type="submit" className="w-full rounded-xl bg-[#3a6b4a] py-3 text-sm font-bold text-white hover:bg-[#2e573b] transition">
          Entrar no painel
        </button>
      </motion.form>
    </section>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ orders, onUpdateStatus, onUpdatePayment }: {
  orders: GuestOrder[];
  onUpdateStatus: (id: string, status: GuestOrder['status']) => void;
  onUpdatePayment: (id: string, status: GuestOrder['paymentStatus']) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <EmptyState icon={Package} title="Nenhum pedido ainda" desc="Os pedidos do hóspede aparecerão aqui em tempo real." />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-4">{orders.length} pedido{orders.length > 1 ? 's' : ''} · {ROOM}</p>
      {orders.map(order => {
        const os = STATUS_ORDER[order.status];
        const ps = PAYMENT_STATUS[order.paymentStatus];
        const PayIcon = ps.icon;
        const isOpen = expanded === order.id;

        return (
          <div key={order.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <button className="w-full px-4 py-4 flex items-center gap-3 text-left" onClick={() => setExpanded(isOpen ? null : order.id)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: os.bg, color: os.color }}>{os.label}</span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: ps.color }}>
                    <PayIcon size={11} />{ps.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{new Date(order.placedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</p>
              </div>
              <span className="text-base font-bold text-gray-800 shrink-0">R$ {order.total}</span>
              {isOpen ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                    {/* Items */}
                    <div className="space-y-1.5">
                      {order.items.map(item => (
                        <div key={item.name} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.qty}× {item.name}</span>
                          <span className="font-semibold text-gray-800">R$ {item.qty * item.price}</span>
                        </div>
                      ))}
                    </div>

                    {/* Order status controls */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Status do pedido</p>
                      <div className="flex gap-2 flex-wrap">
                        {(['pending', 'preparing', 'delivered'] as GuestOrder['status'][]).map(s => (
                          <button key={s} onClick={() => onUpdateStatus(order.id, s)}
                            className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${order.status === s ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
                            style={{ background: STATUS_ORDER[s].bg, color: STATUS_ORDER[s].color }}
                          >{STATUS_ORDER[s].label}</button>
                        ))}
                      </div>
                    </div>

                    {/* Payment controls (only for PIX) */}
                    {order.payment === 'pix' && order.paymentStatus !== 'paid' && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Pagamento PIX</p>
                        <button onClick={() => onUpdatePayment(order.id, 'paid')}
                          className="flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition">
                          <CheckCircle2 size={13} /> Confirmar recebimento
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Frigobar Tab ─────────────────────────────────────────────────────────────

function FrigobarTab({ consumed }: { consumed: Record<string, number> }) {
  const total = FRIGOBAR_ITEMS.reduce((sum, item) => sum + (consumed[item.name] || 0) * item.price, 0);
  const hasConsumption = Object.values(consumed).some(v => v > 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#1a0f0a] p-4 text-white flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-widest">Consumação · {ROOM}</p>
          <p className="font-semibold text-sm mt-0.5">{GUEST}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#c3a37a]">R$ {total}</p>
          <p className="text-[10px] text-white/40">a cobrar</p>
        </div>
      </div>

      {!hasConsumption ? (
        <EmptyState icon={Refrigerator} title="Frigobar intacto" desc="O hóspede ainda não registrou nenhuma consumação." />
      ) : (
        <div className="space-y-2">
          {FRIGOBAR_ITEMS.filter(item => (consumed[item.name] || 0) > 0).map(item => {
            const Icon = item.icon;
            const qty = consumed[item.name] || 0;
            return (
              <div key={item.name} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50">
                  <Icon size={16} className="text-gray-400" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700">{item.name}</span>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700">{qty}× consumido{qty > 1 ? 's' : ''}</span>
                <span className="text-sm font-bold text-gray-800 w-14 text-right">R$ {qty * item.price}</span>
              </div>
            );
          })}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">Total frigobar</span>
            <span className="text-base font-bold text-gray-800">R$ {total}</span>
          </div>
        </div>
      )}

      {/* Full inventory */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Estoque padrão do chalé</p>
        <div className="space-y-2">
          {FRIGOBAR_ITEMS.map(item => {
            const Icon = item.icon;
            const qty = consumed[item.name] || 0;
            const remaining = item.standardQty - qty;
            return (
              <div key={item.name} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3">
                <Icon size={14} className="text-gray-300 shrink-0" />
                <span className="flex-1 text-xs text-gray-500">{item.name}</span>
                <span className="text-[10px] text-gray-400">{item.standardQty} un.</span>
                <span className={`text-xs font-bold ${remaining < item.standardQty ? 'text-amber-600' : 'text-green-600'}`}>
                  {remaining} restante{remaining !== 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Housekeeping Tab ─────────────────────────────────────────────────────────

function HousekeepingTab({ requests, onUpdateStatus }: {
  requests: HKRequest[];
  onUpdateStatus: (id: string, status: HKRequest['status']) => void;
}) {
  if (requests.length === 0) {
    return <EmptyState icon={BedDouble} title="Nenhuma solicitação" desc="As solicitações de arrumação do hóspede aparecerão aqui." />;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-4">{requests.length} solicitação{requests.length > 1 ? 'ões' : ''}</p>
      {requests.map(req => {
        const hs = STATUS_HK[req.status];
        return (
          <div key={req.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-gray-400" />
                  <span className="text-base font-bold text-gray-800">{req.time}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: hs.bg, color: hs.color }}>{hs.label}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Solicitado às {new Date(req.requestedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {req.services.map(s => (
                <span key={s} className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold text-gray-600">{s}</span>
              ))}
            </div>

            <div className="flex gap-2">
              {req.status === 'pending' && (
                <button onClick={() => onUpdateStatus(req.id, 'in_progress')}
                  className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition">
                  <Loader2 size={12} /> Iniciar
                </button>
              )}
              {req.status === 'in_progress' && (
                <button onClick={() => onUpdateStatus(req.id, 'done')}
                  className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition">
                  <Check size={12} /> Concluir
                </button>
              )}
              {req.status === 'done' && (
                <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                  <CheckCircle2 size={12} /> Concluído
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Account Tab ──────────────────────────────────────────────────────────────

function AccountTab({ orders, frigobarConsumed }: { orders: GuestOrder[]; frigobarConsumed: Record<string, number> }) {
  const pixPending = orders.filter(o => o.payment === 'pix' && o.paymentStatus === 'pending');
  const pixPaid = orders.filter(o => o.payment === 'pix' && o.paymentStatus === 'paid');
  const roomCharged = orders.filter(o => o.paymentStatus === 'charged');
  const frigoTotal = FRIGOBAR_ITEMS.reduce((sum, item) => sum + (frigobarConsumed[item.name] || 0) * item.price, 0);
  const roomServiceTotal = roomCharged.reduce((s, o) => s + o.total, 0);
  const grandTotal = roomServiceTotal + frigoTotal;
  const pixTotal = pixPaid.reduce((s, o) => s + o.total, 0) + pixPending.reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-4">
      {/* Grand total */}
      <div className="rounded-2xl bg-[#1a0f0a] p-5 text-white">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-1">{ROOM} · {GUEST}</p>
        <p className="font-serif text-4xl font-bold text-[#c3a37a]">R$ {grandTotal}</p>
        <p className="text-xs text-white/40 mt-1">total na conta do quarto</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/8 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/40">Room service</p>
            <p className="text-lg font-bold mt-0.5">R$ {roomServiceTotal}</p>
          </div>
          <div className="rounded-xl bg-white/8 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/40">Frigobar</p>
            <p className="text-lg font-bold mt-0.5">R$ {frigoTotal}</p>
          </div>
        </div>
      </div>

      {/* PIX status */}
      {pixPending.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-700">{pixPending.length} PIX aguardando confirmação</p>
          </div>
          {pixPending.map(o => (
            <div key={o.id} className="flex items-center justify-between text-sm mt-1">
              <span className="text-amber-600">{new Date(o.placedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="font-bold text-amber-700">R$ {o.total}</span>
            </div>
          ))}
        </div>
      )}

      {/* Room service detail */}
      {roomCharged.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Room service · conta do quarto</p>
          <div className="space-y-2">
            {roomCharged.map(o => (
              <div key={o.id} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-700">{o.items.map(i => i.name).join(', ')}</p>
                  <p className="text-[10px] text-gray-400">{new Date(o.placedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className="text-sm font-bold text-gray-800">R$ {o.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frigobar detail */}
      {frigoTotal > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Frigobar · consumação</p>
          <div className="space-y-2">
            {FRIGOBAR_ITEMS.filter(item => (frigobarConsumed[item.name] || 0) > 0).map(item => {
              const qty = frigobarConsumed[item.name] || 0;
              return (
                <div key={item.name} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                  <span className="text-xs font-semibold text-gray-700">{qty}× {item.name}</span>
                  <span className="text-sm font-bold text-gray-800">R$ {qty * item.price}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {grandTotal === 0 && (
        <EmptyState icon={CreditCard} title="Conta zerada" desc="Nenhum consumo registrado ainda nesta estadia." />
      )}
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function QuickStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-2 text-center">
      <p className="text-base font-bold" style={{ color: accent }}>{value}</p>
      <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: IconComponent; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 mb-4">
        <Icon size={24} className="text-gray-300" />
      </div>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      <p className="text-xs text-gray-400 mt-1 max-w-xs">{desc}</p>
    </div>
  );
}
