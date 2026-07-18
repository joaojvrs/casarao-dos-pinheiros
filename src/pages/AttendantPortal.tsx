import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle, ArrowLeft, Bath, BedDouble, Check, CheckCircle2, ChevronDown,
  ChevronUp, Clock, Coffee, CreditCard, Flame, GlassWater, Leaf,
  ListOrdered, Loader2, Package, QrCode, Refrigerator, RefreshCw, Sparkles,
  ThumbsUp, UtensilsCrossed, Wine, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { GuestOrder, HKRequest } from '../types/portal';
import {
  fetchAttendantBoard, updateGuestOrderStatus, updateServiceRequestStatus,
  type AttendantBoard, type AttendantOrderStatus,
} from '../services/attendant';

function mapOrderStatus(status: AttendantOrderStatus): GuestOrder['status'] {
  if (status === 'delivered') return 'delivered';
  if (status === 'preparing' || status === 'ready') return 'preparing';
  return 'pending';
}

function toDbOrderStatus(status: GuestOrder['status']): AttendantOrderStatus {
  if (status === 'delivered') return 'delivered';
  if (status === 'preparing') return 'preparing';
  return 'new';
}

function boardToOrders(board: AttendantBoard | null): GuestOrder[] {
  if (!board) return [];
  return board.orders.map(order => ({
    id: order.id,
    room: order.room,
    guestName: order.guestName,
    // Backend stores money in cents; this portal's money() helper (and the frigobar
    // figures) work in reais, so convert here to keep everything consistent.
    items: order.items.map(item => ({ name: item.name, qty: item.quantity, price: item.unitPrice / 100 })),
    total: order.total / 100,
    // Guest Portal orders are always charged to the room tab.
    payment: 'room' as const,
    paymentStatus: 'charged' as const,
    status: mapOrderStatus(order.status),
    placedAt: order.createdAt,
  }));
}

function boardToHKRequests(board: AttendantBoard | null): HKRequest[] {
  if (!board) return [];
  return board.requests.map(req => ({
    id: req.id,
    room: req.room,
    guestName: req.guestName,
    time: req.scheduledTime,
    services: req.services,
    status: req.status === 'cancelled' ? 'done' : req.status,
    requestedAt: req.createdAt,
  }));
}

type IconComponent = LucideIcon;

interface AttendantPortalProps {
  onBack: () => void;
  // Room-service orders and housekeeping requests are now fetched live from the
  // backend inside this component; the frigobar tally is still passed in for now.
  frigobarConsumed: Record<string, number>;
}

type ATab = 'orders' | 'frigobar' | 'housekeeping' | 'account';

const ROOM = 'Chalé Pinheiros';

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

interface FrigobarLine {
  name: string;
  qty: number;
  total: number;
  price: number;
  icon: IconComponent;
  standardQty: number;
}

interface RoomSummary {
  room: string;
  guestName: string;
  orders: GuestOrder[];
  hkRequests: HKRequest[];
  frigobar: FrigobarLine[];
  roomServiceTotal: number;
  frigobarTotal: number;
  pendingOrders: number;
  pendingHK: number;
  pixPending: number;
}

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildRoomSummaries(orders: GuestOrder[], hkRequests: HKRequest[], frigobarConsumed: Record<string, number>) {
  const primaryRoom = orders[0]?.room || hkRequests[0]?.room || ROOM;
  const primaryGuest = orders[0]?.guestName || hkRequests[0]?.guestName || 'Hóspede';
  const map = new Map<string, RoomSummary>();

  const ensureRoom = (room = primaryRoom, guestName = primaryGuest) => {
    if (!map.has(room)) {
      map.set(room, {
        room,
        guestName,
        orders: [],
        hkRequests: [],
        frigobar: [],
        roomServiceTotal: 0,
        frigobarTotal: 0,
        pendingOrders: 0,
        pendingHK: 0,
        pixPending: 0,
      });
    }
    const summary = map.get(room)!;
    if (guestName && summary.guestName === 'Hóspede') summary.guestName = guestName;
    return summary;
  };

  orders.forEach(order => {
    const room = ensureRoom(order.room, order.guestName);
    room.orders.push(order);
    if (order.paymentStatus === 'charged') room.roomServiceTotal += order.total;
    if (order.status !== 'delivered') room.pendingOrders += 1;
    if (order.payment === 'pix' && order.paymentStatus === 'pending') room.pixPending += 1;
  });

  hkRequests.forEach(req => {
    const room = ensureRoom(req.room || primaryRoom, req.guestName || primaryGuest);
    room.hkRequests.push(req);
    if (req.status !== 'done') room.pendingHK += 1;
  });

  const frigobar = FRIGOBAR_ITEMS
    .map(item => {
      const qty = frigobarConsumed[item.name] || 0;
      return { name: item.name, qty, total: qty * item.price, price: item.price, icon: item.icon, standardQty: item.standardQty };
    })
    .filter(item => item.qty > 0);
  if (frigobar.length) {
    const room = ensureRoom(primaryRoom, primaryGuest);
    room.frigobar = frigobar;
    room.frigobarTotal = frigobar.reduce((sum, item) => sum + item.total, 0);
  }

  if (!map.size) ensureRoom(primaryRoom, primaryGuest);
  return Array.from(map.values()).sort((a, b) => (b.pendingOrders + b.pendingHK) - (a.pendingOrders + a.pendingHK) || a.room.localeCompare(b.room));
}

export const AttendantPortal: React.FC<AttendantPortalProps> = ({
  onBack, frigobarConsumed,
}) => {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<ATab>('orders');
  const [board, setBoard] = useState<AttendantBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const loadBoard = useCallback(async () => {
    try {
      const data = await fetchAttendantBoard();
      setBoard(data);
      setError('');
      setRefreshedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o painel.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Live-ish board: fetch on mount and poll every 15s so the team sees new
  // guest orders and housekeeping requests without refreshing the page.
  useEffect(() => {
    let mounted = true;
    const tick = () => { if (mounted) loadBoard(); };
    tick();
    const id = window.setInterval(tick, 15000);
    return () => { mounted = false; window.clearInterval(id); };
  }, [loadBoard]);

  const onUpdateOrderStatus = useCallback(async (id: string, status: GuestOrder['status']) => {
    setBoard(prev => prev ? { ...prev, orders: prev.orders.map(o => o.id === id ? { ...o, status: toDbOrderStatus(status) } : o) } : prev);
    try {
      await updateGuestOrderStatus(id, toDbOrderStatus(status));
    } finally {
      loadBoard();
    }
  }, [loadBoard]);

  const onUpdateHKStatus = useCallback(async (id: string, status: HKRequest['status']) => {
    const dbStatus = status === 'done' ? 'done' : status === 'in_progress' ? 'in_progress' : 'pending';
    setBoard(prev => prev ? { ...prev, requests: prev.requests.map(r => r.id === id ? { ...r, status: dbStatus } : r) } : prev);
    try {
      await updateServiceRequestStatus(id, dbStatus);
    } finally {
      loadBoard();
    }
  }, [loadBoard]);

  const onUpdatePaymentStatus = useCallback(() => { /* guest orders are room-charged; no manual PIX action here */ }, []);

  const orders = boardToOrders(board);
  const hkRequests = boardToHKRequests(board);
  const roomSummaries = buildRoomSummaries(orders, hkRequests, frigobarConsumed);
  const pendingOrders = orders.filter(o => o.status !== 'delivered').length;
  const pendingHK = hkRequests.filter(r => r.status !== 'done').length;
  const frigoTotal = roomSummaries.reduce((sum, room) => sum + room.frigobarTotal, 0);
  const roomServiceTotal = roomSummaries.reduce((sum, room) => sum + room.roomServiceTotal, 0);
  const operatorName = String(auth.user?.user_metadata?.full_name || auth.user?.email || 'Equipe');

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
            <p className="text-[10px] text-gray-400 mt-0.5">
              Vale do Eden · {operatorName}
              {refreshedAt && <span className="ml-1">· {refreshedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
            </p>
          </div>
          <button onClick={() => loadBoard()} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition" title="Atualizar">
            <RefreshCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {error && (
          <div className="max-w-3xl mx-auto px-4 pb-2">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600">{error}</p>
          </div>
        )}

        {/* Quick stats */}
        <div className="max-w-3xl mx-auto px-4 pb-3 grid grid-cols-4 gap-2">
          <QuickStat label="Pedidos" value={String(pendingOrders)} accent={pendingOrders > 0 ? '#b45309' : '#15803d'} />
          <QuickStat label="Arrumação" value={String(pendingHK)} accent={pendingHK > 0 ? '#b45309' : '#15803d'} />
          <QuickStat label="Frigobar" value={money(frigoTotal)} accent="#1d4ed8" />
          <QuickStat label="Conta" value={money(roomServiceTotal + frigoTotal)} accent="#1a0f0a" />
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
        <RoomOverview rooms={roomSummaries} />
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {activeTab === 'orders' && (
              <OrdersTab rooms={roomSummaries} onUpdateStatus={onUpdateOrderStatus} onUpdatePayment={onUpdatePaymentStatus} />
            )}
            {activeTab === 'frigobar' && <FrigobarTab rooms={roomSummaries} />}
            {activeTab === 'housekeeping' && <HousekeepingTab rooms={roomSummaries} onUpdateStatus={onUpdateHKStatus} />}
            {activeTab === 'account' && <AccountTab rooms={roomSummaries} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ rooms, onUpdateStatus, onUpdatePayment }: {
  rooms: RoomSummary[];
  onUpdateStatus: (id: string, status: GuestOrder['status']) => void;
  onUpdatePayment: (id: string, status: GuestOrder['paymentStatus']) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const totalOrders = rooms.reduce((sum, room) => sum + room.orders.length, 0);

  if (totalOrders === 0) {
    return (
      <EmptyState icon={Package} title="Nenhum pedido ainda" desc="Quando um quarto fizer pedido, ele aparecerá agrupado pela UH com itens, pagamento e andamento." />
    );
  }

  return (
    <div className="space-y-4">
      {rooms.filter(room => room.orders.length > 0).map(room => (
        <RoomSection key={room.room} room={room} subtitle={`${room.orders.length} pedido${room.orders.length > 1 ? 's' : ''} · ${money(room.roomServiceTotal)} na conta`}>
          {room.orders.map(order => {
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
              <span className="text-base font-bold text-gray-800 shrink-0">{money(order.total)}</span>
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
                          <span className="font-semibold text-gray-800">{money(item.qty * item.price)}</span>
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
        </RoomSection>
      ))}
    </div>
  );
}

// ─── Frigobar Tab ─────────────────────────────────────────────────────────────

function FrigobarTab({ rooms }: { rooms: RoomSummary[] }) {
  const roomsWithConsumption = rooms.filter(room => room.frigobar.length > 0);

  return (
    <div className="space-y-4">
      {!roomsWithConsumption.length ? (
        <EmptyState icon={Refrigerator} title="Nenhuma consumação de frigobar" desc="A consumação aparecerá agrupada pelo quarto assim que o hóspede registrar algum item." />
      ) : (
        roomsWithConsumption.map(room => (
          <RoomSection key={room.room} room={room} subtitle={`Consumação registrada · ${money(room.frigobarTotal)}`}>
            <div className="space-y-2">
              {room.frigobar.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50">
                      <Icon size={16} className="text-gray-400" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700">{item.qty}× consumido{item.qty > 1 ? 's' : ''}</span>
                    <span className="text-sm font-bold text-gray-800 w-20 text-right">{money(item.total)}</span>
                  </div>
                );
              })}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">Total frigobar do quarto</span>
                <span className="text-base font-bold text-gray-800">{money(room.frigobarTotal)}</span>
              </div>
            </div>
          </RoomSection>
        ))
      )}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Estoque padrão por quarto</p>
        <div className="space-y-2">
          {FRIGOBAR_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3">
                <Icon size={14} className="text-gray-300 shrink-0" />
                <span className="flex-1 text-xs text-gray-500">{item.name}</span>
                <span className="text-[10px] text-gray-400">{item.standardQty} un.</span>
                <span className="text-xs font-bold text-gray-700">{money(item.price)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Housekeeping Tab ─────────────────────────────────────────────────────────

function HousekeepingTab({ rooms, onUpdateStatus }: {
  rooms: RoomSummary[];
  onUpdateStatus: (id: string, status: HKRequest['status']) => void;
}) {
  const totalRequests = rooms.reduce((sum, room) => sum + room.hkRequests.length, 0);

  if (totalRequests === 0) {
    return <EmptyState icon={BedDouble} title="Nenhuma solicitação" desc="As solicitações de arrumação aparecerão agrupadas por quarto, com horário e serviços solicitados." />;
  }

  return (
    <div className="space-y-4">
      {rooms.filter(room => room.hkRequests.length > 0).map(room => (
        <RoomSection key={room.room} room={room} subtitle={`${room.hkRequests.length} solicitação${room.hkRequests.length > 1 ? 'ões' : ''} · ${room.pendingHK} pendente${room.pendingHK !== 1 ? 's' : ''}`}>
          {room.hkRequests.map(req => {
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
        </RoomSection>
      ))}
    </div>
  );
}

// ─── Account Tab ──────────────────────────────────────────────────────────────

function AccountTab({ rooms }: { rooms: RoomSummary[] }) {
  const grandTotal = rooms.reduce((sum, room) => sum + room.roomServiceTotal + room.frigobarTotal, 0);
  const pixPendingTotal = rooms.reduce((sum, room) => sum + room.orders.filter(o => o.payment === 'pix' && o.paymentStatus === 'pending').reduce((total, order) => total + order.total, 0), 0);
  const pixPaidTotal = rooms.reduce((sum, room) => sum + room.orders.filter(o => o.payment === 'pix' && o.paymentStatus === 'paid').reduce((total, order) => total + order.total, 0), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#1a0f0a] p-5 text-white">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Contas por quarto</p>
        <p className="font-serif text-4xl font-bold text-[#c3a37a]">{money(grandTotal)}</p>
        <p className="text-xs text-white/40 mt-1">total em aberto na conta dos quartos</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/8 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/40">Room service</p>
            <p className="text-lg font-bold mt-0.5">{money(rooms.reduce((sum, room) => sum + room.roomServiceTotal, 0))}</p>
          </div>
          <div className="rounded-xl bg-white/8 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/40">Frigobar</p>
            <p className="text-lg font-bold mt-0.5">{money(rooms.reduce((sum, room) => sum + room.frigobarTotal, 0))}</p>
          </div>
          <div className="rounded-xl bg-white/8 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/40">PIX</p>
            <p className="text-lg font-bold mt-0.5">{money(pixPendingTotal + pixPaidTotal)}</p>
          </div>
        </div>
      </div>

      {pixPendingTotal > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-700">{money(pixPendingTotal)} em PIX aguardando confirmação</p>
          </div>
        </div>
      )}

      {rooms.map(room => {
        const roomCharged = room.orders.filter(o => o.paymentStatus === 'charged');
        const pixOrders = room.orders.filter(o => o.payment === 'pix');
        const roomTotal = room.roomServiceTotal + room.frigobarTotal;
        if (!roomTotal && pixOrders.length === 0) return null;

        return (
          <RoomSection key={room.room} room={room} subtitle={`Conta do quarto · ${money(roomTotal)}`}>
            <div className="space-y-2">
              {roomCharged.map(o => (
                <div key={o.id} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{o.items.map(i => i.name).join(', ')}</p>
                    <p className="text-[10px] text-gray-400">Room service · {new Date(o.placedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{money(o.total)}</span>
                </div>
              ))}
              {room.frigobar.map(item => (
                <div key={item.name} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                  <span className="text-xs font-semibold text-gray-700">{item.qty}× {item.name}</span>
                  <span className="text-sm font-bold text-gray-800">{money(item.total)}</span>
                </div>
              ))}
              {pixOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <div>
                    <p className="text-xs font-semibold text-amber-800">PIX · {PAYMENT_STATUS[o.paymentStatus].label}</p>
                    <p className="text-[10px] text-amber-600">{new Date(o.placedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-800">{money(o.total)}</span>
                </div>
              ))}
            </div>
          </RoomSection>
        );
      })}

      {grandTotal === 0 && (
        <EmptyState icon={CreditCard} title="Contas zeradas" desc="Nenhum quarto tem consumo lançado em conta no momento." />
      )}
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function RoomOverview({ rooms }: { rooms: RoomSummary[] }) {
  return (
    <div className="mb-5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Visão por quarto</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {rooms.map(room => {
          const total = room.roomServiceTotal + room.frigobarTotal;
          const pending = room.pendingOrders + room.pendingHK;
          return (
            <div key={room.room} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#3a6b4a]">{room.room}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-gray-700">{room.guestName}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${pending ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                  {pending ? `${pending} pendente${pending > 1 ? 's' : ''}` : 'Em dia'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Pedidos" value={String(room.orders.length)} />
                <MiniStat label="Arrum." value={String(room.hkRequests.length)} />
                <MiniStat label="Conta" value={money(total)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoomSection({ room, subtitle, children }: { room: RoomSummary; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white/70 p-3 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#3a6b4a]">{room.room}</p>
          <p className="mt-0.5 text-xs text-gray-400">{room.guestName} · {subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-800">{money(room.roomServiceTotal + room.frigobarTotal)}</p>
          <p className="text-[9px] uppercase tracking-wide text-gray-400">em conta</p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-2 py-2">
      <p className="truncate text-xs font-bold text-gray-800">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  );
}

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
