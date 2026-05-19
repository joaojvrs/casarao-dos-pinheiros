import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';
import {
  ArrowLeft, Bath, BedDouble, CalendarDays, Check, ChevronRight, Clock,
  CloudSun, Coffee, ConciergeBell, Copy, CreditCard, Download, Flame, GlassWater,
  Heart, Home, Lamp, Leaf, MapPin, MessageCircle, Minus, Mountain,
  Music2, Package, Plus, QrCode, Refrigerator, Send, ShowerHead,
  Sparkles, ThermometerSun, UtensilsCrossed, Waves, Wifi, Wine, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGuestMenu, getGuestOrders, getGuestStay, placeGuestOrder } from '../services/restaurant';
import type { GuestStay } from '../types/booking';
import type { GuestOrderRecord, MenuProduct } from '../types/restaurant';
import type { GuestOrder, HKRequest, PaymentMethod } from '../types/portal';

interface GuestPortalProps {
  onBack: () => void;
  onPlaceOrder: (order: GuestOrder) => void;
  onHKRequest: (req: HKRequest) => void;
  frigobarConsumed: Record<string, number>;
  onFrigobarChange: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

type Tab = 'home' | 'roomservice' | 'frigobar' | 'experiences' | 'chalet' | 'concierge';
type Cart = Record<string, number>;
type ChatMsg = { from: 'guest' | 'eden'; text: string };

const GOLD = '#c3a37a';
const BG = '#f3eee5';
const DARK = '#1a0f0a';
const GREEN = '#3a6b4a';

const PIX_KEY = 'casarao@valeeden.com.br';
const PIX_MERCHANT = 'CASARAO VALE DO EDEN';

const IMG = {
  hero: 'https://images.unsplash.com/photo-1758250899745-c2bbd225a110?auto=format&fit=crop&w=2200&q=82',
  deck: 'https://images.unsplash.com/photo-1754342167460-54ada734ae86?auto=format&fit=crop&w=1600&q=82',
  room: 'https://images.unsplash.com/photo-1757524574439-d533a294f083?auto=format&fit=crop&w=1600&q=82',
  breakfast: 'https://images.unsplash.com/photo-1718470750760-88225d5cd2cd?auto=format&fit=crop&w=1600&q=82',
  pool: 'https://images.unsplash.com/photo-1760681555570-96b2f4f4a56c?auto=format&fit=crop&w=1600&q=82',
  leisure: 'https://images.unsplash.com/photo-1709418354404-897ca3dde02f?auto=format&fit=crop&w=1600&q=82',
  water: 'https://images.unsplash.com/photo-1690911388927-35c6577e469a?auto=format&fit=crop&w=1600&q=82',
  chapel: 'https://images.unsplash.com/photo-1758776426509-ce8772f42bbe?auto=format&fit=crop&w=1600&q=82',
  spa: 'https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=1600&q=82',
  bath: 'https://images.unsplash.com/photo-1753605788101-04d1e653e74a?auto=format&fit=crop&w=1600&q=82',
  wineFire: 'https://images.unsplash.com/photo-1612156604756-5ac001fc74d7?auto=format&fit=crop&w=1600&q=82',
};

const BRL_CENTS = (v: number) => `R$ ${(v / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const FRIGOBAR_ITEMS = [
  { name: 'Agua Mineral 500ml', standardQty: 2, price: 0, icon: GlassWater, note: 'Incluso' },
  { name: 'Refrigerante Lata', standardQty: 2, price: 8, icon: GlassWater, note: 'R$ 8 un.' },
  { name: 'Cerveja Artesanal', standardQty: 2, price: 18, icon: Wine, note: 'R$ 18 un.' },
  { name: 'Suco Natural 300ml', standardQty: 1, price: 12, icon: GlassWater, note: 'R$ 12 un.' },
  { name: 'Vinho Tinto Mini', standardQty: 1, price: 35, icon: Wine, note: 'R$ 35 un.' },
  { name: 'Mix de Castanhas', standardQty: 1, price: 22, icon: Leaf, note: 'R$ 22 un.' },
  { name: 'Chocolate Amargo', standardQty: 2, price: 15, icon: Sparkles, note: 'R$ 15 un.' },
];

const EXPERIENCES = [
  { title: 'Trilhas de quadriciclo', copy: 'Mirantes, terra vermelha e a sensacao de atravessar a reserva.', duration: '1h20', seats: '3 vagas', best: '10:30', image: IMG.leisure, icon: Mountain },
  { title: 'Lagos e cachoeiras', copy: 'Agua cristalina, sombra de mata e pausa fresca no ponto mais silencioso.', duration: '1h', seats: 'Privativo', best: '13:00', image: IMG.water, icon: Waves },
  { title: 'Massagem no entardecer', copy: 'Ritual de desaceleracao com aromas naturais e luz baixa.', duration: '50 min', seats: '2 horarios', best: '17:00', image: IMG.spa, icon: Sparkles },
  { title: 'Capela em silencio', copy: 'Pedra, natureza e uma caminhada para respirar fundo sem pressa.', duration: '35 min', seats: 'Livre', best: '09:00', image: IMG.chapel, icon: Heart },
];

const DAY_PROGRAM = [
  { time: '07:30', title: 'Cafe no deck', place: 'Deck do Chale', icon: Coffee },
  { time: '10:30', title: 'Quadriciclo', place: 'Trilhas da reserva', icon: Mountain },
  { time: '13:00', title: 'Lagos e cachoeiras', place: 'Trilha das aguas', icon: Waves },
  { time: '17:00', title: 'Massagem', place: 'Spa privativo', icon: Sparkles },
  { time: '20:00', title: 'Jantar especial', place: 'Chale ou deck', icon: UtensilsCrossed },
];

const CHALET_STATUS = [
  { label: 'Temperatura', value: '22 C', icon: ThermometerSun },
  { label: 'Lareira', value: 'Pronta', icon: Flame },
  { label: 'Jacuzzi', value: 'Aquecendo', icon: Bath },
  { label: 'Luz', value: 'Cena noite', icon: Lamp },
  { label: 'Wi-Fi', value: 'Excelente', icon: Wifi },
  { label: 'Musica', value: 'Jazz baixo', icon: Music2 },
];

const HK_OPTIONS = ['Limpeza rapida', 'Troca de toalhas', 'Toalhas aquecidas', 'Reposicao de amenities', 'Preparar jacuzzi'];

const CHAT_RESPONSES: Record<string, string> = {
  'Quero algo romantico': 'Perfeito. Sugiro a Tabua Vale do Eden no deck as 18:10 com Pinot da serra e luz baixa.',
  'O que fazer hoje?': 'Hoje o clima favorece cachoeira as 13:00 e massagem as 17:00. Depois, vinho no deck antes do jantar.',
  'Melhor experiencia para o por do sol': 'O deck do Chale Pinheiros e o melhor ponto hoje. O por do sol comeca em 42 minutos.',
  'Quero relaxar': 'Massagem as 17:00, banho botanico no chale e jantar leve sao a melhor combinacao para hoje.',
  'Sugestao de vinho': 'Para a noite fria, Pinot da serra. Acompanha a tabua da casa e conversa bem com lareira.',
};

function useCountdown(targetDate?: string) {
  const target = useMemo(() => new Date(`${targetDate || new Date().toISOString().slice(0, 10)}T12:00:00`), [targetDate]);
  const [remaining, setRemaining] = useState(() => Math.max(0, target.getTime() - Date.now()));
  useEffect(() => {
    setRemaining(Math.max(0, target.getTime() - Date.now()));
    const id = window.setInterval(() => setRemaining(Math.max(0, target.getTime() - Date.now())), 30000);
    return () => window.clearInterval(id);
  }, [target]);
  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining % 86400000) / 3600000),
    minutes: Math.floor((remaining % 3600000) / 60000),
  };
}

function formatDate(date: string) {
  if (!date) return '--';
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function statusLabel(status: GuestStay['status']) {
  const labels: Record<GuestStay['status'], string> = {
    pending: 'Pendente',
    confirmed: 'Confirmada',
    checked_in: 'Hospedagem ativa',
    checked_out: 'Checkout realizado',
    no_show: 'No-show',
    cancelled: 'Cancelada',
    completed: 'Concluida',
  };
  return labels[status] || status;
}

async function generateStayShareImage(stay: GuestStay, countdown: { days: number; hours: number; minutes: number }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#16251d');
  gradient.addColorStop(0.52, '#2f4e38');
  gradient.addColorStop(1, '#f3eee5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = stay.accommodation.image;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.drawImage(image, 0, 0, canvas.width, 760);
    ctx.restore();
  } catch {
    ctx.fillStyle = '#203327';
    ctx.fillRect(0, 0, canvas.width, 760);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fillRect(0, 0, canvas.width, 760);
  ctx.fillStyle = '#f8f3ea';
  ctx.textAlign = 'center';
  ctx.font = '700 34px Arial';
  ctx.fillText('CASARAO VALE DO EDEN', 540, 110);
  ctx.font = 'italic 86px Georgia';
  ctx.fillText(stay.accommodation.name, 540, 500);
  ctx.font = '400 32px Arial';
  ctx.fillText(`${formatDate(stay.checkIn)} ate ${formatDate(stay.checkOut)}`, 540, 560);

  ctx.fillStyle = '#f8f3ea';
  ctx.beginPath();
  ctx.roundRect(110, 840, 860, 330, 28);
  ctx.fill();
  ctx.fillStyle = '#1a0f0a';
  ctx.font = '700 30px Arial';
  ctx.fillText('Faltam para o check-in', 540, 930);
  ctx.font = 'italic 112px Georgia';
  ctx.fillText(`${countdown.days} dias`, 540, 1045);
  ctx.font = '400 30px Arial';
  ctx.fillText(`${countdown.hours} horas e ${countdown.minutes} minutos`, 540, 1100);
  ctx.font = '700 28px Arial';
  ctx.fillText(`#${stay.confirmationCode}`, 540, 1250);

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `hospedagem-${stay.confirmationCode}.png`;
  link.click();
}

function uid() { return Math.random().toString(36).slice(2, 10); }

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: 'Início', Icon: Home },
  { id: 'roomservice', label: 'Pedidos', Icon: UtensilsCrossed },
  { id: 'frigobar', label: 'Frigobar', Icon: Refrigerator },
  { id: 'experiences', label: 'Experiências', Icon: Mountain },
  { id: 'chalet', label: 'Chalé', Icon: BedDouble },
  { id: 'concierge', label: 'Concierge', Icon: MessageCircle },
];

export const GuestPortal: React.FC<GuestPortalProps> = ({
  onBack, onPlaceOrder, onHKRequest, frigobarConsumed, onFrigobarChange,
}) => {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [cart, setCart] = useState<Cart>({});
  const [paymentModal, setPaymentModal] = useState<'select' | 'pix' | 'room' | null>(null);
  const [lastOrderResult, setLastOrderResult] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [hkTime, setHkTime] = useState('15:30');
  const [hkServices, setHkServices] = useState<string[]>(['Toalhas aquecidas']);
  const [hkConfirmed, setHkConfirmed] = useState('');
  const [menuItems, setMenuItems] = useState<MenuProduct[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [stay, setStay] = useState<GuestStay | null>(null);
  const [stayLoading, setStayLoading] = useState(true);
  const [stayError, setStayError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [guestOrders, setGuestOrders] = useState<GuestOrderRecord[]>([]);
  const [roomServiceSubTab, setRoomServiceSubTab] = useState<'order' | 'myorders'>('order');
  const countdown = useCountdown(stay?.phase === 'active' ? stay.checkOut : stay?.checkIn);

  const mood = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return { period: 'manha', weather: '18°C · ceu limpo', note: 'A luz esta suave. O deck esta pronto para um cafe sem pressa.' };
    if (h < 18) return { period: 'tarde', weather: '23°C · sol entre nuvens', note: 'A reserva esta luminosa. Agua, trilha e pausa combinam com agora.' };
    return { period: 'noite', weather: '15°C · noite fria', note: 'A noite pede vinho, lareira e um ritmo mais intimo no chale.' };
  }, []);

  useEffect(() => {
    getGuestStay()
      .then(data => setStay(data))
      .catch(error => setStayError(error instanceof Error ? error.message : 'Nao foi possivel carregar sua hospedagem.'))
      .finally(() => setStayLoading(false));
  }, []);

  useEffect(() => {
    if (!stay?.canOrder) {
      setMenuItems([]);
      setMenuLoading(false);
      return;
    }
    setMenuLoading(true);
    getGuestMenu()
      .then(items => setMenuItems(items))
      .catch(() => setMenuItems([]))
      .finally(() => setMenuLoading(false));
  }, [stay?.canOrder]);

  useEffect(() => {
    if (stay && !deliveryLocation) {
      setDeliveryLocation(stay.accommodation.name);
    }
  }, [stay]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!stay?.canOrder || activeTab !== 'roomservice') return;
    let mounted = true;
    const fetch = () => {
      getGuestOrders()
        .then(orders => { if (mounted) setGuestOrders(orders); })
        .catch(() => {});
    };
    fetch();
    const id = window.setInterval(fetch, 30000);
    return () => { mounted = false; window.clearInterval(id); };
  }, [stay?.canOrder, activeTab]);

  const cartTotal = useMemo(
    () => menuItems.reduce((sum, item) => sum + (cart[item.id] || 0) * item.sale_price, 0),
    [menuItems, cart],
  );
  const cartCount = useMemo(() => Object.values(cart).reduce((s, v) => s + v, 0), [cart]);
  const guestName = String(auth.user?.user_metadata?.full_name || auth.user?.email || 'Hóspede');
  const firstName = guestName.split(' ')[0] || 'Hóspede';

  const changeCart = useCallback((id: string, delta: number) =>
    setCart(c => ({ ...c, [id]: Math.max(0, (c[id] || 0) + delta) })), []);

  const confirmPayment = async (method: PaymentMethod) => {
    const cartedItems = menuItems.filter(m => (cart[m.id] || 0) > 0);
    if (!stay?.canOrder) {
      setOrderError('Pedidos ficam disponiveis apenas durante a hospedagem ativa.');
      setPaymentModal(null);
      return;
    }
    setOrderPlacing(true);
    setOrderError('');
    const effectiveLocation = deliveryLocation || stay.accommodation.name;
    let orderResult: { orderId: string; orderNumber: string };
    try {
      orderResult = await placeGuestOrder({
        items: cartedItems.map(m => ({ productId: m.id, quantity: cart[m.id] })),
        roomName: effectiveLocation,
        bookingId: stay.bookingId,
        deliveryLocation: effectiveLocation,
        notes: orderNotes.trim() || undefined,
      });
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Nao foi possivel registrar o pedido.');
      setOrderPlacing(false);
      setPaymentModal(null);
      return;
    }
    const order: GuestOrder = {
      id: uid(), room: effectiveLocation, guestName,
      items: cartedItems.map(m => ({ name: m.name, qty: cart[m.id], price: m.sale_price })),
      total: cartTotal, payment: method,
      paymentStatus: method === 'pix' ? 'pending' : 'charged',
      status: 'pending', placedAt: new Date().toISOString(),
    };
    onPlaceOrder(order);
    setCart({});
    setOrderNotes('');
    setLastOrderResult(orderResult);
    setRoomServiceSubTab('myorders');
    setPaymentModal(null);
    setOrderPlacing(false);
    getGuestOrders().then(orders => setGuestOrders(orders)).catch(() => {});
  };

  const confirmHK = () => {
    if (!stay?.canOrder) {
      setHkConfirmed('Solicitacoes ficam disponiveis apenas durante a hospedagem ativa.');
      return;
    }
    const req: HKRequest = {
      id: uid(), time: hkTime, services: hkServices,
      status: 'pending', requestedAt: new Date().toISOString(),
    };
    onHKRequest(req);
    setHkConfirmed(`Seu chalé será arrumado às ${hkTime}.`);
  };

  const changeFrigobar = (name: string, delta: number) => {
    const item = FRIGOBAR_ITEMS.find(f => f.name === name)!;
    onFrigobarChange(prev => ({
      ...prev,
      [name]: Math.min(item.standardQty, Math.max(0, (prev[name] || 0) + delta)),
    }));
  };

  if (stayLoading || !stay) {
    return (
      <div className="min-h-screen bg-[#f3eee5] px-4 py-5 text-[#1a0f0a]">
        <button onClick={onBack} className="mb-8 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white">
          <ArrowLeft size={16} />
        </button>
        <GuestStateCard
          title={stayLoading ? 'Carregando sua hospedagem' : 'Nenhuma hospedagem encontrada'}
          text={stayLoading ? 'Estamos buscando os dados vinculados a sua conta.' : stayError || 'Quando uma reserva paga estiver vinculada ao seu e-mail, ela aparecera aqui.'}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3eee5] text-[#1a0f0a] pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#1a0f0a] shadow-lg">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white">
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-col items-center">
          <img src="/logo.png" alt="Vale do Eden" className="h-7 w-auto object-contain opacity-90" />
          <span className="text-[8px] uppercase tracking-[0.4em] text-[#c3a37a]/70 mt-0.5">Chalé Pinheiros</span>
        </div>
        <div className="text-right">
          <span className="block text-[9px] uppercase tracking-widest text-white/40">Check-out</span>
          <span className="text-xs font-semibold text-[#c3a37a]">{countdown.days}d {countdown.hours}h</span>
        </div>
      </header>

      {/* Tab content */}
      <main className="max-w-2xl mx-auto px-4 pt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {activeTab === 'home' && <HomeTab mood={mood} countdown={countdown} guestName={firstName} stay={stay} onShare={() => generateStayShareImage(stay, countdown)} />}
            {activeTab === 'roomservice' && (
              <RoomServiceTab
                menu={menuItems} menuLoading={menuLoading}
                cart={cart} changeCart={changeCart} total={cartTotal} count={cartCount}
                onCheckout={() => setPaymentModal('select')}
                lastOrder={lastOrderResult}
                canOrder={stay.canOrder}
                error={orderError}
                deliveryLocation={deliveryLocation || stay.accommodation.name}
                setDeliveryLocation={setDeliveryLocation}
                deliveryOptions={[stay.accommodation.name, 'Piscina', 'Deck', 'Área de Lazer', 'Restaurante']}
                orderNotes={orderNotes}
                setOrderNotes={setOrderNotes}
                guestOrders={guestOrders}
                subTab={roomServiceSubTab}
                setSubTab={setRoomServiceSubTab}
              />
            )}
            {activeTab === 'frigobar' && (
              <FrigobarTab consumed={frigobarConsumed} onChange={changeFrigobar} />
            )}
            {activeTab === 'experiences' && <ExperiencesTab />}
            {activeTab === 'chalet' && (
              <ChaletTab
                hkTime={hkTime} setHkTime={setHkTime}
                hkServices={hkServices} toggleHKService={s => setHkServices(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                hkConfirmed={hkConfirmed} confirmHK={confirmHK}
              />
            )}
            {activeTab === 'concierge' && <ConciergeTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a0f0a] border-t border-white/8 px-2 pb-safe">
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-3 relative transition-colors ${activeTab === id ? 'text-[#c3a37a]' : 'text-white/38 hover:text-white/70'}`}
            >
              {id === 'roomservice' && cartCount > 0 && (
                <span className="absolute top-2 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c3a37a] text-[8px] font-bold text-[#1a0f0a]">{cartCount}</span>
              )}
              <Icon size={20} />
              <span className="text-[9px] tracking-wide">{label}</span>
              {activeTab === id && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#c3a37a] rounded-full" />}
            </button>
          ))}
        </div>
      </nav>

      {/* Payment modal */}
      <AnimatePresence>
        {paymentModal && (
          <PaymentModal
            mode={paymentModal}
            total={cartTotal}
            placing={orderPlacing}
            onSelectPix={() => setPaymentModal('pix')}
            onSelectRoom={() => confirmPayment('room')}
            onConfirmPix={() => confirmPayment('pix')}
            onClose={() => setPaymentModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Home Tab ────────────────────────────────────────────────────────────────

function HomeTab({ mood, countdown, guestName, stay, onShare }: {
  mood: { period: string; weather: string; note: string };
  countdown: { days: number; hours: number; minutes: number };
  guestName: string;
  stay: GuestStay;
  onShare: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#101917] text-white" style={{ minHeight: 220 }}>
        <img src={IMG.hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#101917]" />
        <div className="relative p-5">
          <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#c3a37a]">Vale do Eden Reserva</span>
          <h1 className="mt-2 font-serif text-3xl italic leading-tight">Bem-vindo, {guestName}.</h1>
          <p className="mt-2 max-w-xs text-sm text-white/66">{mood.note}</p>
          <div className="mt-4 flex gap-3">
            <Pill icon={<CloudSun size={13} />} label={mood.weather} />
            <Pill icon={<CalendarDays size={13} />} label="18 mai · 12:00" />
          </div>
        </div>
        <div className="relative flex gap-2 px-5 pb-5">
          <CountBox label="dias" value={countdown.days} />
          <CountBox label="horas" value={countdown.hours} />
          <CountBox label="min" value={countdown.minutes} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.32em] text-[#3a6b4a]">Sua hospedagem</span>
            <h2 className="mt-1 font-serif text-2xl italic">{stay.accommodation.name}</h2>
            <p className="mt-1 text-xs text-[#1a0f0a]/50">{statusLabel(stay.status)} · {stay.confirmationCode}</p>
          </div>
          <button onClick={onShare} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1a0f0a] text-white transition hover:bg-[#c3a37a] hover:text-[#1a0f0a]" title="Gerar imagem">
            <Download size={17} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <CountBox label="dias" value={countdown.days} />
          <CountBox label="noites" value={stay.nights} />
          <CountBox label="hospedes" value={stay.guestsCount} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[#1a0f0a]/45">
          {stay.canOrder ? 'Pedidos, concierge e solicitacoes estao liberados durante sua estadia.' : 'Pedidos e solicitacoes serao liberados apos o check-in.'}
        </p>
      </div>

      {/* Today highlights */}
      <SectionLabel eyebrow="Hoje para você" title="Momentos selecionados." />
      <div className="grid grid-cols-3 gap-3">
        {[
          { title: 'Vinho 18:10', image: IMG.deck, icon: Wine },
          { title: 'Massagem 17:00', image: IMG.room, icon: Sparkles },
          { title: 'Cachoeira 13:00', image: IMG.water, icon: Waves },
        ].map(item => (
          <div key={item.title} className="relative overflow-hidden rounded-xl aspect-square">
            <img src={item.image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-[10px] font-semibold text-white leading-tight">{item.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Day program */}
      <SectionLabel eyebrow="Programação" title="Seu dia no vale." />
      <div className="rounded-2xl bg-[#101917] p-4 space-y-3">
        {DAY_PROGRAM.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.time} className="flex items-center gap-3 text-white">
              <span className="font-mono text-sm text-[#c3a37a] w-12 shrink-0">{item.time}</span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-[#c3a37a]"><Icon size={14} /></span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-[10px] text-white/40 truncate">{item.place}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Room Service Tab ─────────────────────────────────────────────────────────

function RoomServiceTab({ menu, menuLoading, cart, changeCart, total, count, onCheckout, lastOrder, canOrder, error, deliveryLocation, setDeliveryLocation, deliveryOptions, orderNotes, setOrderNotes, guestOrders, subTab, setSubTab }: {
  menu: MenuProduct[]; menuLoading: boolean;
  cart: Cart; changeCart: (id: string, d: number) => void;
  total: number; count: number; onCheckout: () => void;
  lastOrder: { orderId: string; orderNumber: string } | null;
  canOrder: boolean; error: string;
  deliveryLocation: string; setDeliveryLocation: (v: string) => void;
  deliveryOptions: string[];
  orderNotes: string; setOrderNotes: (v: string) => void;
  guestOrders: GuestOrderRecord[];
  subTab: 'order' | 'myorders'; setSubTab: (v: 'order' | 'myorders') => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState('');
  const activeOrders = guestOrders.filter(o => ['new', 'preparing', 'ready'].includes(o.status));

  const categories = useMemo(
    () => [...new Set(menu.map(m => {
      const cat = Array.isArray(m.restaurant_categories) ? m.restaurant_categories[0] : m.restaurant_categories;
      return cat?.name || 'Outros';
    }))].sort(),
    [menu],
  );

  const getCategory = (m: MenuProduct) => {
    const cat = Array.isArray(m.restaurant_categories) ? m.restaurant_categories[0] : m.restaurant_categories;
    return cat?.name || 'Outros';
  };

  const grouped = useMemo(() => {
    const filtered = categoryFilter ? menu.filter(m => getCategory(m) === categoryFilter) : menu;
    const map: Record<string, MenuProduct[]> = {};
    for (const m of filtered) {
      const cat = getCategory(m);
      if (!map[cat]) map[cat] = [];
      map[cat].push(m);
    }
    return map;
  }, [menu, categoryFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#c3a37a]">Room Service</p>
        <h2 className="font-serif text-3xl italic leading-tight mt-0.5">Do café ao vinho,<br />no seu tempo.</h2>
      </div>

      {/* Sub-tab switcher */}
      <div className="flex gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm">
        <button
          onClick={() => setSubTab('order')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wide transition ${subTab === 'order' ? 'bg-[#1a0f0a] text-white shadow-sm' : 'text-[#1a0f0a]/45 hover:text-[#1a0f0a]/70'}`}
        >
          Novo Pedido
          {count > 0 && subTab !== 'order' && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#c3a37a] text-[8px] font-bold text-[#1a0f0a]">{count}</span>
          )}
        </button>
        <button
          onClick={() => setSubTab('myorders')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wide transition ${subTab === 'myorders' ? 'bg-[#1a0f0a] text-white shadow-sm' : 'text-[#1a0f0a]/45 hover:text-[#1a0f0a]/70'}`}
        >
          Meus Pedidos
          {activeOrders.length > 0 && (
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold ${subTab === 'myorders' ? 'bg-[#c3a37a] text-[#1a0f0a]' : 'bg-[#c3a37a]/80 text-[#1a0f0a]'}`}>{activeOrders.length}</span>
          )}
        </button>
      </div>

      {/* ── Novo Pedido ── */}
      {subTab === 'order' && (
        <>
          {!canOrder && (
            <div className="rounded-2xl border border-[#c3a37a]/30 bg-white p-5">
              <p className="text-sm font-semibold text-[#1a0f0a]">Pedidos ainda não liberados.</p>
              <p className="mt-1 text-xs leading-relaxed text-[#1a0f0a]/50">O cardápio fica disponível após o check-in e fecha automaticamente no checkout.</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
          )}

          {/* Delivery location */}
          {canOrder && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-[#1a0f0a]/35 mb-2">Local de entrega</p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {deliveryOptions.map(loc => (
                  <button
                    key={loc}
                    onClick={() => setDeliveryLocation(loc)}
                    className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${
                      deliveryLocation === loc
                        ? 'bg-[#1a0f0a] text-white'
                        : 'bg-white border border-[#1a0f0a]/12 text-[#1a0f0a]/55 hover:border-[#1a0f0a]/30'
                    }`}
                  >
                    <MapPin size={9} className={deliveryLocation === loc ? 'text-[#c3a37a]' : ''} />
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category chips */}
          {!menuLoading && categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <button onClick={() => setCategoryFilter('')}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${!categoryFilter ? 'bg-[#1a0f0a] text-white' : 'bg-white border border-[#1a0f0a]/12 text-[#1a0f0a]/55'}`}>
                Tudo
              </button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${categoryFilter === cat ? 'bg-[#c3a37a] text-[#1a0f0a]' : 'bg-white border border-[#1a0f0a]/12 text-[#1a0f0a]/55'}`}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Skeleton while loading */}
          {menuLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm animate-pulse">
                  <div className="h-20 w-20 shrink-0 rounded-xl bg-black/8" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-2/3 rounded bg-black/8" />
                    <div className="h-3 w-full rounded bg-black/8" />
                    <div className="h-3 w-1/3 rounded bg-black/8" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Menu grouped by category */}
          {!menuLoading && (
            <div className="space-y-7">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-3">
                    <p className="font-serif text-xl italic text-[#1a0f0a]">{cat}</p>
                    <div className="flex-1 h-px bg-[#1a0f0a]/8" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#1a0f0a]/25">{items.length}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {items.map(item => {
                      const qty = cart[item.id] || 0;
                      return (
                        <div key={item.id} className={`flex flex-col rounded-2xl bg-white shadow-sm overflow-hidden transition ${qty > 0 ? 'ring-1 ring-[#c3a37a]/50' : ''}`}>
                          <div className="relative aspect-square overflow-hidden">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[#f4efe6]">
                                <UtensilsCrossed size={16} className="text-[#c3a37a]/60" />
                              </div>
                            )}
                            {qty > 0 && (
                              <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c3a37a] text-[9px] font-bold text-[#1a0f0a] shadow">
                                {qty}
                              </span>
                            )}
                          </div>
                          <div className="p-2 flex flex-col flex-1">
                            <p className="text-[11px] font-semibold leading-snug line-clamp-2 flex-1 text-[#1a0f0a]">{item.name}</p>
                            <div className="mt-1.5 flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-[#1a0f0a]">{BRL_CENTS(item.sale_price)}</span>
                              <div className="flex items-center gap-0.5">
                                {qty > 0 && (
                                  <button
                                    onClick={() => changeCart(item.id, -1)}
                                    className="flex h-6 w-6 items-center justify-center rounded-full border border-[#1a0f0a]/15 text-[#1a0f0a]/50 active:bg-[#1a0f0a]/5 transition"
                                  >
                                    <Minus size={9} />
                                  </button>
                                )}
                                <button
                                  onClick={() => changeCart(item.id, 1)}
                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a0f0a] text-white active:bg-[#c3a37a] active:text-[#1a0f0a] transition"
                                >
                                  <Plus size={9} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {menu.length === 0 && !menuLoading && (
                <div className="rounded-2xl border border-dashed border-[#1a0f0a]/12 bg-white p-8 text-center">
                  <UtensilsCrossed size={28} className="mx-auto mb-3 text-[#c3a37a]/50" />
                  <p className="text-sm text-[#1a0f0a]/45">Cardápio sendo preparado. Volte em breve.</p>
                </div>
              )}
            </div>
          )}

          {/* Cart bar with notes */}
          {count > 0 && (
            <div className="sticky bottom-24 space-y-2">
              <div className="rounded-2xl bg-white border border-[#1a0f0a]/8 px-4 py-3 shadow-sm">
                <input
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Observação opcional (sem açúcar, gelado, etc.)"
                  className="w-full text-sm bg-transparent outline-none text-[#1a0f0a] placeholder:text-[#1a0f0a]/30"
                />
              </div>
              <div className="rounded-2xl bg-[#1a0f0a] p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/55">{count} {count === 1 ? 'item' : 'itens'}</span>
                    <span className="flex items-center gap-1 text-[10px] text-[#c3a37a]/60">
                      <MapPin size={9} />{deliveryLocation}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-[#c3a37a]">{BRL_CENTS(total)}</span>
                </div>
                <button onClick={onCheckout}
                  className="w-full rounded-full bg-[#c3a37a] py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#1a0f0a] hover:bg-amber-200 transition">
                  Confirmar pedido
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Meus Pedidos ── */}
      {subTab === 'myorders' && (
        <div className="space-y-4">
          {lastOrder && (
            <motion.div
              key={lastOrder.orderId}
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="rounded-2xl bg-[#3a6b4a] p-5 text-white shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check size={20} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base">Pedido confirmado!</p>
                  <p className="text-[11px] text-white/65 mt-0.5 font-mono">{lastOrder.orderNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-white/55" />{deliveryLocation}</span>
                <span className="flex items-center gap-1.5"><Clock size={13} className="text-white/55" />~20–30 min</span>
              </div>
              <p className="mt-2.5 text-xs text-white/50">Acompanhe o status abaixo enquanto preparamos seu pedido.</p>
            </motion.div>
          )}

          {guestOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1a0f0a]/12 bg-white p-10 text-center space-y-3">
              <UtensilsCrossed size={28} className="mx-auto text-[#c3a37a]/50" />
              <p className="text-sm font-semibold text-[#1a0f0a]/55">Nenhum pedido ainda.</p>
              <p className="text-xs text-[#1a0f0a]/35">Faça seu primeiro pedido pelo cardápio.</p>
              <button onClick={() => setSubTab('order')}
                className="mt-1 rounded-full bg-[#1a0f0a] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#c3a37a] hover:text-[#1a0f0a] transition">
                Ver cardápio
              </button>
            </div>
          ) : (
            <MyOrdersSection orders={guestOrders} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── My Orders Section ────────────────────────────────────────────────────────

const ORDER_STATUS_CFG: Record<string, { label: string; badge: string; dot: string; pulse: boolean }> = {
  new: { label: 'Recebido', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', pulse: true },
  preparing: { label: 'Em preparo', badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', pulse: true },
  ready: { label: 'Pronto!', badge: 'bg-[#3a6b4a]/12 text-[#3a6b4a] border-[#3a6b4a]/30', dot: 'bg-[#3a6b4a]', pulse: false },
  delivered: { label: 'Entregue', badge: 'bg-gray-50 text-gray-500 border-gray-200', dot: 'bg-gray-300', pulse: false },
  cancelled: { label: 'Cancelado', badge: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400', pulse: false },
};

function MyOrdersSection({ orders }: { orders: GuestOrderRecord[] }) {
  const [expanded, setExpanded] = useState(true);
  const active = orders.filter(o => ['new', 'preparing', 'ready'].includes(o.status));
  const done = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
  const shown = expanded ? orders.slice(0, 6) : active.slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <p className="font-serif text-xl italic text-[#1a0f0a]">Meus pedidos</p>
        <div className="flex-1 h-px bg-[#1a0f0a]/8" />
        {active.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c3a37a] text-[9px] font-bold text-[#1a0f0a]">
            {active.length}
          </span>
        )}
        {(done.length > 0 || orders.length > 3) && (
          <button onClick={() => setExpanded(v => !v)} className="text-[10px] text-[#1a0f0a]/35 uppercase tracking-widest hover:text-[#1a0f0a]/60 transition">
            {expanded ? 'Recolher' : 'Ver todos'}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {shown.map(order => <OrderTrackCard key={order.id} order={order} />)}
      </div>
      {!expanded && done.length > 0 && (
        <button onClick={() => setExpanded(true)} className="text-xs text-[#1a0f0a]/40 pl-1 hover:text-[#1a0f0a]/60 transition">
          + {done.length} pedido{done.length > 1 ? 's' : ''} concluído{done.length > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}

function OrderTrackCard({ order }: { order: GuestOrderRecord }) {
  const cfg = ORDER_STATUS_CFG[order.status] ?? ORDER_STATUS_CFG.new;
  const isActive = ['new', 'preparing', 'ready'].includes(order.status);
  const itemsSummary = order.restaurant_order_items.map(i => `${i.quantity}× ${i.name}`).join(', ');
  const time = new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`rounded-xl border p-3.5 transition ${isActive ? 'border-[#c3a37a]/25 bg-white shadow-sm' : 'border-[#1a0f0a]/6 bg-white/60'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}${cfg.pulse ? ' animate-pulse' : ''}`} />
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}>{cfg.label}</span>
          <span className="text-[10px] text-[#1a0f0a]/30">{time}</span>
        </div>
        <span className="text-xs font-bold text-[#1a0f0a] shrink-0">{BRL_CENTS(order.total)}</span>
      </div>
      {itemsSummary && (
        <p className="mt-1.5 text-xs text-[#1a0f0a]/50 line-clamp-1">{itemsSummary}</p>
      )}
      {order.notes && (
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#1a0f0a]/35">
          <MapPin size={9} className="shrink-0" />
          <span className="truncate">{order.notes}</span>
        </p>
      )}
    </div>
  );
}

// ─── Frigobar Tab ─────────────────────────────────────────────────────────────

function FrigobarTab({ consumed, onChange }: { consumed: Record<string, number>; onChange: (name: string, delta: number) => void }) {
  const total = FRIGOBAR_ITEMS.reduce((sum, item) => sum + (consumed[item.name] || 0) * item.price, 0);

  return (
    <div className="space-y-5">
      <SectionLabel eyebrow="Frigobar" title="O que você consumiu." desc="Itens padrão do seu chalé. Marque o que utilizou e o valor será lançado na conta." />

      <div className="rounded-2xl bg-[#101917] p-4 text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/50 uppercase tracking-widest">Consumação atual</span>
          <span className="text-lg font-bold text-[#c3a37a]">R$ {total}</span>
        </div>
        <p className="text-[10px] text-white/30">Será lançado na sua conta ao finalizar a estadia.</p>
      </div>

      <div className="space-y-3">
        {FRIGOBAR_ITEMS.map(item => {
          const Icon = item.icon;
          const qty = consumed[item.name] || 0;
          const isFree = item.price === 0;
          return (
            <div key={item.name} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4efe6]">
                <Icon size={18} className="text-[#8c6b42]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[#1a0f0a]/40">{item.standardQty} incluso{item.standardQty > 1 ? 's' : ''}</span>
                  {isFree ? (
                    <span className="rounded-full bg-[#3a6b4a]/10 px-2 py-0.5 text-[9px] font-bold text-[#3a6b4a]">Incluso</span>
                  ) : (
                    <span className="text-[10px] text-[#8c6b42] font-semibold">{item.note}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onChange(item.name, -1)} disabled={qty === 0} className="flex h-7 w-7 items-center justify-center rounded-full border border-[#1a0f0a]/15 disabled:opacity-30 transition hover:border-[#1a0f0a]/40">
                  <Minus size={12} />
                </button>
                <span className="w-5 text-center text-sm font-mono font-semibold">{qty}</span>
                <button onClick={() => onChange(item.name, 1)} disabled={qty >= item.standardQty} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a0f0a] text-white disabled:opacity-30 transition hover:bg-[#c3a37a] hover:text-[#1a0f0a]">
                  <Plus size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-[#1a0f0a]/35 pb-2">Consumação incorreta? Fale com o concierge.</p>
    </div>
  );
}

// ─── Experiences Tab ──────────────────────────────────────────────────────────

function ExperiencesTab() {
  return (
    <div className="space-y-5">
      <SectionLabel eyebrow="Experiências" title="Como a reserva vai ficar na memória." />
      <div className="space-y-4">
        {EXPERIENCES.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="relative h-44 overflow-hidden">
                <img src={item.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <Icon size={20} className="mb-2 text-[#c3a37a]" />
                  <h3 className="font-serif text-xl italic">{item.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#1a0f0a]/55 leading-relaxed">{item.copy}</p>
                <div className="mt-3 flex gap-2">
                  <Tag label={item.duration} />
                  <Tag label={item.seats} />
                  <Tag label={item.best} />
                </div>
                <button className="mt-4 w-full flex items-center justify-center gap-2 rounded-full bg-[#1a0f0a] py-3 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-[#c3a37a] hover:text-[#1a0f0a] transition">
                  Reservar <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chalet Tab ───────────────────────────────────────────────────────────────

function ChaletTab({ hkTime, setHkTime, hkServices, toggleHKService, hkConfirmed, confirmHK }: {
  hkTime: string; setHkTime: (v: string) => void;
  hkServices: string[]; toggleHKService: (s: string) => void;
  hkConfirmed: string; confirmHK: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Status */}
      <SectionLabel eyebrow="Status do Chalé" title="Tudo pronto para você." />
      <div className="grid grid-cols-3 gap-3">
        {CHALET_STATUS.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl bg-white p-3 shadow-sm text-center">
              <Icon size={16} className="mx-auto mb-2 text-[#8c6b42]" />
              <span className="block text-[9px] font-bold uppercase tracking-wider text-[#1a0f0a]/38">{item.label}</span>
              <strong className="mt-0.5 block text-xs">{item.value}</strong>
            </div>
          );
        })}
      </div>

      {/* Housekeeping */}
      <SectionLabel eyebrow="Arrumação" title="Agendar limpeza." desc="Escolha o horário e os cuidados. A equipe entra com discrição." />
      <div className="rounded-2xl bg-white p-4 shadow-sm space-y-4">
        <div className="flex gap-2">
          {['14:00', '15:30', '17:00'].map(t => (
            <button key={t} onClick={() => setHkTime(t)} className={`flex-1 rounded-full border py-3 text-sm font-semibold transition ${hkTime === t ? 'border-[#c3a37a] bg-[#1a0f0a] text-white' : 'border-[#1a0f0a]/10 bg-[#f8f3ea]'}`}>{t}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {HK_OPTIONS.map(opt => (
            <button key={opt} onClick={() => toggleHKService(opt)} className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${hkServices.includes(opt) ? 'border-[#c3a37a] bg-[#c3a37a]/18 text-[#6f542f]' : 'border-[#1a0f0a]/10 bg-[#f4efe6] text-[#1a0f0a]/55'}`}>{opt}</button>
          ))}
        </div>
        <button onClick={confirmHK} disabled={!!hkConfirmed} className="w-full rounded-full bg-[#1a0f0a] py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-[#c3a37a] hover:text-[#1a0f0a] transition disabled:opacity-50">
          Confirmar arrumação
        </button>
        {hkConfirmed && (
          <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-[#3a6b4a]/10 p-3 text-sm text-[#2e573b]">
            <Check size={14} className="inline mr-2" />{hkConfirmed}
          </motion.p>
        )}
      </div>

      {/* Comforts */}
      <SectionLabel eyebrow="Aconchegos" title="Presentes no seu cômodo." />
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: 'Roupão e toalhas', icon: Bath },
          { title: 'Amenities botânicos', icon: Leaf },
          { title: 'Ducha pressurizada', icon: ShowerHead },
          { title: 'Café e chá', icon: Coffee },
          { title: 'Mantas para a noite', icon: Flame },
          { title: 'Caixa de som', icon: Music2 },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c3a37a]/15">
                <Icon size={16} className="text-[#8c6b42]" />
              </div>
              <span className="text-xs font-medium">{item.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Concierge Tab ────────────────────────────────────────────────────────────

function ConciergeTab() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: 'eden', text: 'Estou por aqui para preparar o dia no seu ritmo. O que você deseja sentir agora?' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(p => [...p, { from: 'guest', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(p => [...p, { from: 'eden', text: CHAT_RESPONSES[text] || 'Posso cuidar disso com discrição. Para hoje, recomendo algo leve, sensorial e sem pressa.' }]);
    }, 900);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 160px)' }}>
      <SectionLabel eyebrow="Concierge Eden" title="Conte o que você deseja." />
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'guest' ? 'justify-end' : 'justify-start'}`}>
            {msg.from === 'eden' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c3a37a] text-[#1a0f0a] mr-2 mt-1 self-start">
                <ConciergeBell size={14} />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.from === 'eden' ? 'bg-white text-[#1a0f0a]/75 shadow-sm' : 'bg-[#1a0f0a] text-white'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-2 ml-10">
            <div className="flex gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm">
              {[0, 1, 2].map(i => <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#1a0f0a]/30 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.keys(CHAT_RESPONSES).map(s => (
          <button key={s} onClick={() => send(s)} className="rounded-full border border-[#1a0f0a]/12 bg-white px-3 py-2 text-[10px] font-semibold text-[#1a0f0a]/60 hover:border-[#c3a37a] hover:text-[#c3a37a] transition shadow-sm">
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2 sticky bottom-24">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(input); }}
          className="flex-1 h-12 rounded-full border border-[#1a0f0a]/12 bg-white px-4 text-sm outline-none placeholder:text-[#1a0f0a]/30 focus:border-[#c3a37a] shadow-sm"
          placeholder="Conte o que você deseja..."
        />
        <button onClick={() => send(input)} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a0f0a] text-white hover:bg-[#c3a37a] hover:text-[#1a0f0a] transition">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentModal({ mode, total, placing, onSelectPix, onSelectRoom, onConfirmPix, onClose }: {
  mode: 'select' | 'pix' | 'room';
  total: number;
  placing: boolean;
  onSelectPix: () => void;
  onSelectRoom: () => void;
  onConfirmPix: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText(PIX_KEY).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[920] flex items-end bg-black/55 backdrop-blur-sm p-3 md:items-center md:justify-center">
      <motion.div initial={{ y: 60, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full max-w-md rounded-2xl bg-[#f8f3ea] p-5 shadow-2xl md:p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#3a6b4a]">Pagamento</span>
            <h3 className="mt-1 font-serif text-2xl italic">R$ {total}</h3>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
            <X size={15} />
          </button>
        </div>

        {mode === 'select' && (
          <div className="space-y-3">
            <button onClick={onSelectPix} className="w-full flex items-center gap-4 rounded-xl border-2 border-[#1a0f0a]/10 bg-white p-4 hover:border-[#c3a37a] transition">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c3a37a]/15">
                <QrCode size={22} className="text-[#8c6b42]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Pagar agora com PIX</p>
                <p className="text-xs text-[#1a0f0a]/50">QR code · aprovação imediata</p>
              </div>
              <ChevronRight size={18} className="ml-auto text-[#1a0f0a]/30" />
            </button>
            <button onClick={onSelectRoom} className="w-full flex items-center gap-4 rounded-xl border-2 border-[#1a0f0a]/10 bg-white p-4 hover:border-[#c3a37a] transition">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c3a37a]/15">
                <CreditCard size={22} className="text-[#8c6b42]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Marcar na conta do quarto</p>
                <p className="text-xs text-[#1a0f0a]/50">Pague na saída · simples e prático</p>
              </div>
              <ChevronRight size={18} className="ml-auto text-[#1a0f0a]/30" />
            </button>
          </div>
        )}

        {mode === 'pix' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-inner">
              <QRCode
                value={`PIX:${PIX_KEY}?amount=${total}&description=Vale+do+Eden+-+Quarto+101`}
                size={180}
                fgColor={DARK}
                bgColor="#ffffff"
                level="M"
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-[#1a0f0a]/50 mb-1">{PIX_MERCHANT}</p>
              <p className="text-lg font-bold text-[#1a0f0a]">R$ {total}</p>
            </div>
            <button onClick={copyKey} className="flex items-center gap-2 rounded-full border border-[#1a0f0a]/15 bg-white px-4 py-2.5 text-xs font-semibold text-[#1a0f0a]/70 hover:border-[#c3a37a] transition w-full justify-center">
              {copied ? <><Check size={13} className="text-[#3a6b4a]" /> Chave copiada!</> : <><Copy size={13} /> Copiar chave PIX · {PIX_KEY}</>}
            </button>
            <p className="text-[10px] text-[#1a0f0a]/35 text-center">Após o pagamento, toque em confirmar abaixo.</p>
            <button onClick={onConfirmPix} disabled={placing} className="w-full rounded-full bg-[#3a6b4a] py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-[#2e573b] transition disabled:opacity-60">
              {placing ? 'Processando...' : 'Confirmei o pagamento'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionLabel({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mb-1">
      <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#3a6b4a]">{eyebrow}</span>
      <h2 className="mt-1 font-serif text-2xl italic leading-tight text-[#1a0f0a]">{title}</h2>
      {desc && <p className="mt-1.5 text-sm leading-relaxed text-[#1a0f0a]/55">{desc}</p>}
    </div>
  );
}

function CountBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-xl border border-white/14 bg-black/25 p-3 text-center backdrop-blur-md">
      <strong className="block font-serif text-2xl text-[#c3a37a]">{value}</strong>
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/46">{label}</span>
    </div>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-white backdrop-blur-md">
      <span className="text-[#c3a37a]">{icon}</span>{label}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#f4efe6] px-3 py-1 text-[9px] uppercase tracking-widest text-[#1a0f0a]/55">{label}</span>
  );
}

function GuestStateCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-black/8 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#c3a37a]/15 text-[#8c6b42]">
        <BedDouble size={20} />
      </div>
      <h1 className="font-serif text-3xl italic text-[#1a0f0a]">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#1a0f0a]/55">{text}</p>
    </section>
  );
}
