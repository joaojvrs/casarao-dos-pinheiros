import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';
import {
  ArrowLeft, Bath, BedDouble, CalendarDays, Check, ChevronRight, Clock,
  CloudSun, Coffee, ConciergeBell, Copy, CreditCard, Flame, GlassWater,
  Heart, Home, KeyRound, Lamp, Leaf, MessageCircle, Minus, Mountain,
  Music2, Package, Plus, QrCode, Refrigerator, Send, ShowerHead,
  Sparkles, ThermometerSun, UtensilsCrossed, Waves, Wifi, Wine, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

const CREDENTIALS = { user: 'Jairo Alves', password: 'jairo123' };
const PIX_KEY = 'casarao@valeeden.com.br';
const PIX_MERCHANT = 'CASARÃO VALE DO EDEN';

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

const MENU = [
  { name: 'Cafe da manha no deck', copy: 'Frutas, paes artesanais, cafe coado e mel local.', price: 148, eta: 25, image: IMG.breakfast, icon: Coffee, category: 'cafe' },
  { name: 'Tabua Vale do Eden', copy: 'Queijos, castanhas, geleias e paes rusticos.', price: 186, eta: 18, image: IMG.deck, icon: Wine, category: 'vinhos' },
  { name: 'Pinot da serra', copy: 'Vinho leve para noite fria e lareira acesa.', price: 230, eta: 12, image: IMG.wineFire, icon: GlassWater, category: 'vinhos' },
  { name: 'Jantar MasterChef privativo', copy: 'Menu autoral servido no chale com mise en place discreta.', price: 420, eta: 55, image: IMG.room, icon: UtensilsCrossed, category: 'jantar' },
  { name: 'Moqueca de Pintado', copy: 'Peixe do pantanal cozido no leite de coco com pimentoes e azeite de dende. Servida na panela de barro.', price: 118, eta: 40, image: IMG.leisure, icon: UtensilsCrossed, category: 'jantar' },
  { name: 'Fondue de chocolate', copy: 'Frutas frescas, chocolate quente e final lento.', price: 132, eta: 22, image: IMG.pool, icon: Sparkles, category: 'sobremesas' },
  { name: 'Kit banho botanico', copy: 'Sais, vela aromatica e toalhas aquecidas.', price: 96, eta: 14, image: IMG.bath, icon: Bath, category: 'amenities' },
];

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

function useCountdown() {
  const checkout = useMemo(() => new Date('2026-05-18T12:00:00'), []);
  const [remaining, setRemaining] = useState(() => checkout.getTime() - Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setRemaining(Math.max(0, checkout.getTime() - Date.now())), 30000);
    return () => window.clearInterval(id);
  }, [checkout]);
  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining % 86400000) / 3600000),
    minutes: Math.floor((remaining % 3600000) / 60000),
  };
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
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [logged, setLogged] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [cart, setCart] = useState<Cart>({});
  const [paymentModal, setPaymentModal] = useState<'select' | 'pix' | 'room' | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [hkTime, setHkTime] = useState('15:30');
  const [hkServices, setHkServices] = useState<string[]>(['Toalhas aquecidas']);
  const [hkConfirmed, setHkConfirmed] = useState('');
  const countdown = useCountdown();

  const mood = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return { period: 'manha', weather: '18°C · ceu limpo', note: 'A luz esta suave. O deck esta pronto para um cafe sem pressa.' };
    if (h < 18) return { period: 'tarde', weather: '23°C · sol entre nuvens', note: 'A reserva esta luminosa. Agua, trilha e pausa combinam com agora.' };
    return { period: 'noite', weather: '15°C · noite fria', note: 'A noite pede vinho, lareira e um ritmo mais intimo no chale.' };
  }, []);

  const cartTotal = MENU.reduce((sum, item) => sum + (cart[item.name] || 0) * item.price, 0);
  const cartCount = Object.values(cart).reduce((s, v) => s + v, 0);

  const changeCart = (name: string, delta: number) =>
    setCart(c => ({ ...c, [name]: Math.max(0, (c[name] || 0) + delta) }));

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.trim() === CREDENTIALS.user && password === CREDENTIALS.password) {
      setLogged(true); setLoginError('');
    } else {
      setLoginError('Credenciais incorretas. Use Jairo Alves / jairo123');
    }
  };

  const confirmPayment = (method: PaymentMethod) => {
    const items = MENU.filter(m => (cart[m.name] || 0) > 0).map(m => ({ name: m.name, qty: cart[m.name], price: m.price }));
    const order: GuestOrder = {
      id: uid(), room: 'Chalé Pinheiros', guestName: 'Jairo Alves',
      items, total: cartTotal, payment: method,
      paymentStatus: method === 'pix' ? 'pending' : 'charged',
      status: 'pending', placedAt: new Date().toISOString(),
    };
    onPlaceOrder(order);
    setCart({});
    setOrderConfirmed(true);
    setPaymentModal(null);
    setTimeout(() => setOrderConfirmed(false), 4000);
  };

  const confirmHK = () => {
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

  if (!logged) {
    return <LoginScreen onBack={onBack} login={login} user={user} setUser={setUser} password={password} setPassword={setPassword} error={loginError} />;
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
            {activeTab === 'home' && <HomeTab mood={mood} countdown={countdown} />}
            {activeTab === 'roomservice' && (
              <RoomServiceTab
                cart={cart} changeCart={changeCart} total={cartTotal} count={cartCount}
                onCheckout={() => setPaymentModal('select')}
                confirmed={orderConfirmed}
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
            onSelectPix={() => setPaymentModal('pix')}
            onSelectRoom={() => { confirmPayment('room'); setPaymentModal(null); }}
            onConfirmPix={() => confirmPayment('pix')}
            onClose={() => setPaymentModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Login ───────────────────────────────────────────────────────────────────

function LoginScreen({ onBack, login, user, setUser, password, setPassword, error }: {
  onBack: () => void; login: (e: React.FormEvent) => void;
  user: string; setUser: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  error: string;
}) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#07110f]">
      <img src={IMG.hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/82 via-[#07110f]/72 to-black/38" />
      <button onClick={onBack} className="absolute left-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md">
        <ArrowLeft size={18} />
      </button>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-16">
        <motion.form onSubmit={login} initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-[430px] rounded-[10px] border border-white/16 bg-black/38 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:p-8">
          <img src="/logo.png" alt="Casarao Vale do Eden" className="mx-auto mb-8 h-20 w-auto object-contain" />
          <span className="mb-4 block text-center text-[10px] font-bold uppercase tracking-[0.42em] text-[#c3a37a]">Concierge particular</span>
          <h1 className="mb-3 text-center font-serif text-4xl italic leading-tight text-white">Bem-vindo ao seu refugio.</h1>
          <p className="mx-auto mb-8 max-w-xs text-center text-sm leading-relaxed text-white/62">Entre para cuidar da estadia, pedir momentos e descobrir o que a reserva preparou para hoje.</p>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/55">Hóspede</label>
          <input value={user} onChange={e => setUser(e.target.value)} className="mb-5 h-12 w-full rounded-[8px] border border-white/14 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#c3a37a]" placeholder="Jairo Alves" />
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/55">Senha de acesso</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="mb-5 h-12 w-full rounded-[8px] border border-white/14 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#c3a37a]" placeholder="jairo123" />
          {error && <p className="mb-5 rounded-[8px] bg-red-950/35 p-3 text-sm text-red-100">{error}</p>}
          <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#c3a37a] text-xs font-bold uppercase tracking-[0.28em] text-[#1a0f0a] transition hover:bg-white">
            <KeyRound size={15} /> Entrar no refugio
          </button>
        </motion.form>
      </div>
    </section>
  );
}

// ─── Home Tab ────────────────────────────────────────────────────────────────

function HomeTab({ mood, countdown }: { mood: { period: string; weather: string; note: string }; countdown: { days: number; hours: number; minutes: number } }) {
  return (
    <div className="space-y-5">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#101917] text-white" style={{ minHeight: 220 }}>
        <img src={IMG.hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#101917]" />
        <div className="relative p-5">
          <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#c3a37a]">Vale do Eden Reserva</span>
          <h1 className="mt-2 font-serif text-3xl italic leading-tight">Bem-vindo, Jairo.</h1>
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

function RoomServiceTab({ cart, changeCart, total, count, onCheckout, confirmed }: {
  cart: Cart; changeCart: (n: string, d: number) => void;
  total: number; count: number; onCheckout: () => void; confirmed: boolean;
}) {
  return (
    <div className="space-y-5">
      <SectionLabel eyebrow="Room Service" title="Do cafe ao vinho, no seu tempo." />

      <AnimatePresence>
        {confirmed && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-xl bg-[#3a6b4a]/15 border border-[#3a6b4a]/30 p-4">
            <Check size={18} className="text-[#3a6b4a] shrink-0" />
            <p className="text-sm text-[#2e573b] font-medium">Pedido confirmado! Entrega em aproximadamente 20–30 min.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {MENU.map(item => {
          const Icon = item.icon;
          const qty = cart[item.name] || 0;
          return (
            <div key={item.name} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                <img src={item.image} alt="" className="h-full w-full object-cover" />
                <span className="absolute top-1 left-1 rounded-full bg-[#c3a37a] px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#1a0f0a]">{item.category}</span>
              </div>
              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <h3 className="text-sm font-semibold leading-tight">{item.name}</h3>
                  <p className="mt-0.5 text-xs text-[#1a0f0a]/50 line-clamp-2">{item.copy}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-[#1a0f0a]">R$ {item.price}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeCart(item.name, -1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[#1a0f0a]/15 text-[#1a0f0a]/60 hover:border-[#1a0f0a]/40 transition">
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-sm font-mono font-semibold">{qty}</span>
                    <button onClick={() => changeCart(item.name, 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a0f0a] text-white hover:bg-[#c3a37a] hover:text-[#1a0f0a] transition">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 0 && (
        <div className="sticky bottom-24 rounded-2xl bg-[#1a0f0a] p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/60">{count} {count === 1 ? 'item' : 'itens'}</span>
            <span className="text-lg font-bold text-[#c3a37a]">R$ {total}</span>
          </div>
          <button onClick={onCheckout} className="w-full rounded-full bg-[#c3a37a] py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#1a0f0a] hover:bg-white transition">
            Confirmar Pedido
          </button>
        </div>
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

function PaymentModal({ mode, total, onSelectPix, onSelectRoom, onConfirmPix, onClose }: {
  mode: 'select' | 'pix' | 'room';
  total: number;
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
            <button onClick={onConfirmPix} className="w-full rounded-full bg-[#3a6b4a] py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-[#2e573b] transition">
              Confirmei o pagamento
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
