import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  CloudSun,
  Coffee,
  ConciergeBell,
  Flame,
  GlassWater,
  Heart,
  KeyRound,
  Lamp,
  Leaf,
  MessageCircle,
  Minus,
  Mountain,
  Music2,
  Plus,
  Send,
  ShowerHead,
  Sparkles,
  ThermometerSun,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wine,
  X,
} from 'lucide-react';

interface GuestPortalProps {
  onBack: () => void;
}

type Cart = Record<string, number>;
type ModalMode = 'breakfast' | 'relax' | 'housekeeping' | null;
type ChatMessage = { from: 'guest' | 'eden'; text: string };

const CREDENTIALS = { user: 'Jairo Alves', password: 'jairo123' };

const IMG = {
  hero: 'https://images.unsplash.com/photo-1758250899745-c2bbd225a110?auto=format&fit=crop&w=2200&q=82',
  deck: 'https://images.unsplash.com/photo-1754342167460-54ada734ae86?auto=format&fit=crop&w=1600&q=82',
  cabin: 'https://images.unsplash.com/photo-1764942711945-32b66ef549cd?auto=format&fit=crop&w=1600&q=82',
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

const EXPERIENCES = [
  {
    title: 'Trilhas de quadriciclo',
    copy: 'Mirantes, terra vermelha e a sensacao rara de atravessar a reserva por dentro.',
    duration: '1h20',
    seats: '3 vagas',
    best: '10:30',
    image: IMG.leisure,
    icon: Mountain,
  },
  {
    title: 'Lagos e cachoeiras',
    copy: 'Agua cristalina, sombra de mata e uma pausa fresca no ponto mais silencioso do vale.',
    duration: '1h',
    seats: 'Privativo',
    best: '13:00',
    image: IMG.water,
    icon: Waves,
  },
  {
    title: 'Massagem no entardecer',
    copy: 'Um ritual de desaceleracao antes da noite, com aromas naturais e luz baixa.',
    duration: '50 min',
    seats: '2 horarios',
    best: '17:00',
    image: IMG.spa,
    icon: Sparkles,
  },
  {
    title: 'Capela em silencio',
    copy: 'Pedra, natureza e uma caminhada curta para respirar fundo sem pressa.',
    duration: '35 min',
    seats: 'Livre',
    best: '09:00',
    image: IMG.chapel,
    icon: Heart,
  },
];

const DAY_PROGRAM = [
  { time: '07:30', title: 'Cafe no deck', place: 'Deck do Chale Pinheiros', duration: '45 min', status: 'confirmado', icon: Coffee },
  { time: '10:30', title: 'Quadriciclo', place: 'Trilhas da reserva', duration: '1h20', status: '2 vagas livres', icon: Mountain },
  { time: '13:00', title: 'Lagos e cachoeiras', place: 'Trilha das aguas', duration: '1h', status: 'sugerido', icon: Waves },
  { time: '17:00', title: 'Massagem relaxante', place: 'Spa privativo', duration: '50 min', status: 'agendado', icon: Sparkles },
  { time: '20:00', title: 'Jantar especial', place: 'Chale ou deck', duration: 'sob reserva', status: 'chef disponivel', icon: UtensilsCrossed },
  { time: '21:00', title: 'Pesca noturna', place: 'Lago principal', duration: '1h', status: 'clima favoravel', icon: Waves },
];

const MENU = [
  { category: 'cafe', name: 'Cafe da manha no deck', copy: 'Frutas, paes artesanais, cafe coado e mel local.', price: 148, eta: 25, image: IMG.breakfast, icon: Coffee },
  { category: 'vinhos', name: 'Tabua Vale do Eden', copy: 'Queijos, castanhas, geleias e paes rusticos.', price: 186, eta: 18, image: IMG.deck, icon: Wine },
  { category: 'vinhos', name: 'Pinot da serra', copy: 'Vinho leve para noite fria e lareira acesa.', price: 230, eta: 12, image: IMG.wineFire, icon: GlassWater },
  { category: 'jantar', name: 'Jantar MasterChef privativo', copy: 'Menu autoral servido no chale com mise en place discreta.', price: 420, eta: 55, image: IMG.room, icon: UtensilsCrossed },
  { category: 'sobremesas', name: 'Fondue de chocolate', copy: 'Frutas frescas, chocolate quente e final lento.', price: 132, eta: 22, image: IMG.pool, icon: Sparkles },
  { category: 'amenities', name: 'Kit banho botanico', copy: 'Sais, vela aromatica e toalhas aquecidas.', price: 96, eta: 14, image: IMG.bath, icon: Bath },
];

const CHALET = [
  { label: 'Temperatura', value: '22 C', icon: ThermometerSun },
  { label: 'Lareira', value: 'Pronta', icon: Flame },
  { label: 'Jacuzzi', value: 'Aquecendo', icon: Bath },
  { label: 'Luz', value: 'Cena noite', icon: Lamp },
  { label: 'Wi-Fi', value: 'Excelente', icon: Wifi },
  { label: 'Musica', value: 'Jazz baixo', icon: Music2 },
];

const COMFORTS = [
  { title: 'Roupao e toalhas macias', copy: 'Texturas prontas para banho quente, jacuzzi ou uma manha lenta no deck.', icon: Bath },
  { title: 'Amenities botanicos', copy: 'Sabonetes, aromas e itens de cuidado inspirados na natureza da reserva.', icon: Leaf },
  { title: 'Ducha quente pressurizada', copy: 'Banho confortavel depois da trilha, piscina ou experiencia ao ar livre.', icon: ShowerHead },
  { title: 'Cafe e cha no chale', copy: 'Uma pequena selecao para pausar sem precisar chamar o concierge.', icon: Coffee },
  { title: 'Mantas para a noite', copy: 'Perfeitas para vinho no deck, leitura ou lareira acesa.', icon: Flame },
  { title: 'Caixa de som ambiente', copy: 'Som baixo, jazz ou natureza para acompanhar o ritmo da estadia.', icon: Music2 },
];

const CHAT_RESPONSES: Record<string, string> = {
  'Quero algo romantico': 'Perfeito. Eu sugiro preparar a Tabua Vale do Eden no deck as 18:10, com Pinot da serra e luz baixa. Posso deixar isso encaminhado.',
  'O que fazer hoje?': 'Hoje o clima favorece cachoeira as 13:00 e massagem as 17:00. Depois, vinho no deck antes do jantar fica impecavel.',
  'Melhor experiencia para o por do sol': 'O deck do Chale Pinheiros e o melhor ponto hoje. O por do sol comeca em 42 minutos; eu recomendo chegar com vinho 15 minutos antes.',
  'Quero relaxar': 'Vamos desacelerar. Massagem as 17:00, banho botanico no chale e jantar leve sao a melhor combinacao para hoje.',
  'Sugestao de vinho': 'Para a noite fria, Pinot da serra. Ele acompanha a tabua da casa e conversa bem com lareira e clima de montanha.',
};

const CHAT_SUGGESTIONS = Object.keys(CHAT_RESPONSES);

function useCountdown() {
  const checkout = useMemo(() => new Date('2026-05-18T12:00:00'), []);
  const [remaining, setRemaining] = useState(() => checkout.getTime() - Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setRemaining(Math.max(0, checkout.getTime() - Date.now())), 30000);
    return () => window.clearInterval(id);
  }, [checkout]);

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return { days, hours, minutes };
}

export const GuestPortal: React.FC<GuestPortalProps> = ({ onBack }) => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<Cart>({ 'Cafe da manha no deck': 1 });
  const [modal, setModal] = useState<ModalMode>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [houseTime, setHouseTime] = useState('15:30');
  const [houseServices, setHouseServices] = useState(['Toalhas aquecidas']);
  const [houseConfirmed, setHouseConfirmed] = useState('');

  const todayRef = useRef<HTMLElement>(null);
  const programRef = useRef<HTMLElement>(null);
  const experiencesRef = useRef<HTMLElement>(null);
  const gastronomyRef = useRef<HTMLElement>(null);

  const countdown = useCountdown();
  const total = MENU.reduce((sum, item) => sum + (cart[item.name] || 0) * item.price, 0);
  const itemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const mood = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { period: 'manha', weather: '18 C · ceu limpo', note: 'A luz esta suave. O deck esta pronto para um cafe sem pressa.' };
    if (hour < 18) return { period: 'tarde', weather: '23 C · sol entre nuvens', note: 'A reserva esta luminosa. Agua, trilha e pausa combinam com agora.' };
    return { period: 'noite', weather: '15 C · noite fria', note: 'A noite pede vinho, lareira e um ritmo mais intimo no chale.' };
  }, []);

  const login = (event: React.FormEvent) => {
    event.preventDefault();
    if (user.trim() === CREDENTIALS.user && password === CREDENTIALS.password) {
      setLogged(true);
      setError('');
    } else {
      setError('Essas credenciais nao abriram o refugio. Tente Jairo Alves e jairo123.');
    }
  };

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleHeroAction = (action: string) => {
    if (action === 'Agendar experiencia') scrollTo(experiencesRef);
    if (action === 'Pedir cafe da manha') setModal('breakfast');
    if (action === 'Relaxar hoje') setModal('relax');
    if (action === 'Explorar atividades') scrollTo(programRef);
  };

  const changeCart = (name: string, delta: number) => {
    setCart(current => ({ ...current, [name]: Math.max(0, (current[name] || 0) + delta) }));
  };

  const toggleHouseService = (service: string) => {
    setHouseServices(current => current.includes(service) ? current.filter(item => item !== service) : [...current, service]);
  };

  if (!logged) {
    return <LoginScreen onBack={onBack} login={login} user={user} setUser={setUser} password={password} setPassword={setPassword} error={error} />;
  }

  return (
    <section className="min-h-screen bg-[#f3eee5] text-[#1a0f0a]">
      <Hero
        onBack={onBack}
        countdown={countdown}
        mood={mood}
        onAction={handleHeroAction}
      />

      <main className="mx-auto max-w-7xl space-y-14 px-4 pb-28 pt-8 sm:px-6 md:space-y-20 md:px-8">
        <Today ref={todayRef} />
        <Program ref={programRef} />
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <CurrentMoment cart={cart} total={total} itemsCount={itemsCount} />
          <Housekeeping
            houseTime={houseTime}
            setHouseTime={setHouseTime}
            services={houseServices}
            toggleService={toggleHouseService}
            confirmed={houseConfirmed}
            confirm={() => setHouseConfirmed(`Seu chale sera preparado as ${houseTime}.`)}
          />
        </div>
        <Experiences ref={experiencesRef} />
        <RoomService ref={gastronomyRef} cart={cart} changeCart={changeCart} total={total} />
        <div className="grid gap-5 lg:grid-cols-[1fr_0.92fr]">
          <Chalet />
          <Mood mood={mood} countdown={countdown} />
        </div>
        <RoomComforts />
      </main>

      <FloatingOrder cart={cart} total={total} scrollToMenu={() => scrollTo(gastronomyRef)} />
      <ConciergeAI open={chatOpen} setOpen={setChatOpen} setModal={setModal} />
      <ActionModal modal={modal} setModal={setModal} changeCart={changeCart} scrollToExperiences={() => scrollTo(experiencesRef)} />
    </section>
  );
};

function LoginScreen({
  onBack,
  login,
  user,
  setUser,
  password,
  setPassword,
  error,
}: {
  onBack: () => void;
  login: (event: React.FormEvent) => void;
  user: string;
  setUser: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
}) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#07110f]">
      <img src={IMG.hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/82 via-[#07110f]/72 to-black/38" />
      <button onClick={onBack} className="absolute left-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md" aria-label="Voltar">
        <ArrowLeft size={18} />
      </button>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-16">
        <motion.form
          onSubmit={login}
          initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[430px] rounded-[10px] border border-white/16 bg-black/38 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:p-8"
        >
          <img src="/logo.png" alt="Casarao Vale do Eden" className="mx-auto mb-8 h-20 w-auto object-contain" />
          <span className="mb-4 block text-center text-[10px] font-bold uppercase tracking-[0.42em] text-[#c3a37a]">Concierge particular</span>
          <h1 className="mb-3 text-center font-serif text-4xl italic leading-tight text-white">Bem-vindo ao seu refugio.</h1>
          <p className="mx-auto mb-8 max-w-xs text-center text-sm leading-relaxed text-white/62">Entre para cuidar da estadia, pedir momentos e descobrir o que a reserva preparou para hoje.</p>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/55">Hospede</label>
          <input value={user} onChange={event => setUser(event.target.value)} className="mb-5 h-12 w-full rounded-[8px] border border-white/14 bg-white/10 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c3a37a]" placeholder="Jairo Alves" />
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/55">Senha de acesso</label>
          <input value={password} onChange={event => setPassword(event.target.value)} type="password" className="mb-5 h-12 w-full rounded-[8px] border border-white/14 bg-white/10 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c3a37a]" placeholder="jairo123" />
          {error && <p className="mb-5 rounded-[8px] bg-red-950/35 p-3 text-sm text-red-100">{error}</p>}
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#c3a37a] text-xs font-bold uppercase tracking-[0.28em] text-[#1a0f0a] transition hover:bg-white">
            <KeyRound size={15} />
            Entrar no refugio
          </button>
        </motion.form>
      </div>
    </section>
  );
}

function Hero({ onBack, countdown, mood, onAction }: { onBack: () => void; countdown: { days: number; hours: number; minutes: number }; mood: { period: string; weather: string; note: string }; onAction: (action: string) => void }) {
  const actions = ['Agendar experiencia', 'Pedir cafe da manha', 'Relaxar hoje', 'Explorar atividades'];
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#07110f] text-white">
      <img src={IMG.hero} alt="Vista do chale na reserva" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/76 via-black/52 to-[#07110f]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/58 via-transparent to-black/20" />
      <div className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-[#f3eee5] via-[#f3eee5]/35 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 py-5 md:px-8 md:py-7">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-black/22 backdrop-blur-md transition hover:bg-white/12" aria-label="Voltar">
            <ArrowLeft size={18} />
          </button>
          <div className="rounded-full border border-white/16 bg-black/22 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/76 backdrop-blur-md">Chale Pinheiros</div>
        </div>

        <div className="flex flex-1 items-end pb-16 pt-20 md:pb-24">
          <motion.div initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-5xl">
            <span className="mb-5 block text-[10px] font-bold uppercase tracking-[0.5em] text-[#c3a37a]">Vale do Eden Reserva</span>
            <h1 className="max-w-4xl font-serif text-5xl italic leading-[1.02] tracking-normal md:text-8xl">Bem-vindo ao seu refugio, Jairo.</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/74 md:text-lg">{mood.note}</p>
            <div className="mt-7 grid max-w-4xl grid-cols-3 gap-2 sm:gap-3">
              <CountdownBox label="dias" value={countdown.days} />
              <CountdownBox label="horas" value={countdown.hours} />
              <CountdownBox label="min" value={countdown.minutes} />
            </div>
            <div className="mt-4 grid max-w-4xl grid-cols-1 gap-2 sm:grid-cols-3">
              <HeroPill label="clima" value={mood.weather} icon={<CloudSun size={15} />} />
              <HeroPill label="mood" value={mood.period} icon={<Sparkles size={15} />} />
              <HeroPill label="check-out" value="18 mai · 12:00" icon={<CalendarDays size={15} />} />
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {actions.map(action => (
                <motion.button
                  key={action}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onAction(action)}
                  className="rounded-full border border-white/18 bg-white/11 px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md transition hover:border-[#c3a37a] hover:bg-[#c3a37a] hover:text-[#1a0f0a]"
                >
                  {action}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CountdownBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] border border-white/14 bg-black/25 p-4 text-center shadow-[0_16px_48px_rgba(0,0,0,0.18)] backdrop-blur-md">
      <motion.strong key={value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="block font-serif text-4xl text-[#c3a37a] md:text-5xl">{value}</motion.strong>
      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/46">{label}</span>
    </div>
  );
}

function HeroPill({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-white/12 bg-black/24 px-4 py-3 text-sm backdrop-blur-md">
      <span className="text-[#c3a37a]">{icon}</span>
      <span className="text-white/42">{label}</span>
      <strong className="ml-auto text-white">{value}</strong>
    </div>
  );
}

const SectionTitle = React.forwardRef<HTMLDivElement, { eyebrow: string; title: string; desc?: string; light?: boolean }>(({ eyebrow, title, desc, light = false }, ref) => (
  <div ref={ref} className="mb-7">
    <span className="text-[10px] font-bold uppercase tracking-[0.36em] text-[#3a6b4a]">{eyebrow}</span>
    <h2 className={`mt-3 max-w-3xl font-serif text-4xl italic leading-[1.08] md:text-5xl ${light ? 'text-white' : 'text-[#1a0f0a]'}`}>{title}</h2>
    {desc && <p className={`mt-3 max-w-2xl text-sm leading-relaxed ${light ? 'text-white/62' : 'text-[#1a0f0a]/58'}`}>{desc}</p>}
  </div>
));
SectionTitle.displayName = 'SectionTitle';

const Today = React.forwardRef<HTMLElement>((_, ref) => (
  <section ref={ref} className="scroll-mt-10">
    <SectionTitle eyebrow="Hoje para voce" title="Pequenos luxos escolhidos para o seu ritmo." desc="Recomendacoes criadas a partir do clima, do horario e do tipo de experiencia que combina com sua estadia." />
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { title: 'Vinho ao entardecer', text: 'Luz baixa, deck reservado e a mata respirando ao redor.', time: '18:10', image: IMG.deck, icon: Wine },
        { title: 'Massagem antes da noite', text: 'Um ritual silencioso para desacelerar o corpo.', time: '17:00', image: IMG.room, icon: Sparkles },
        { title: 'Cachoeira com sol aberto', text: 'Agua fria, trilha curta e uma pausa que muda o dia.', time: '13:00', image: IMG.water, icon: Waves },
      ].map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.article key={item.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} viewport={{ once: true }} className="group overflow-hidden rounded-[10px] bg-white shadow-[0_18px_55px_rgba(48,33,20,0.08)]">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#111]">
              <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-95 transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md"><Icon size={13} />{item.time}</span>
                <h3 className="font-serif text-2xl italic">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/66">{item.text}</p>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  </section>
));
Today.displayName = 'Today';

const Program = React.forwardRef<HTMLElement>((_, ref) => (
  <section ref={ref} className="scroll-mt-8 rounded-[10px] bg-[#101917] p-5 text-white shadow-[0_24px_70px_rgba(16,25,23,0.18)] md:p-8">
    <SectionTitle eyebrow="Programacao de hoje" title="Seu dia no Vale do Eden." desc="Uma agenda viva, discreta e ajustavel para voce atravessar o dia sem pressa." light />
    <div className="space-y-4">
      {DAY_PROGRAM.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div key={item.time} initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} viewport={{ once: true }} className="relative grid gap-4 rounded-[10px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-md md:grid-cols-[86px_1fr_auto] md:items-center">
            <div className="flex items-center gap-3 md:block">
              <span className="font-mono text-lg text-[#c3a37a] md:text-2xl">{item.time}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c3a37a]/35 bg-[#c3a37a]/12 text-[#c3a37a] md:mt-3"><Icon size={16} /></span>
            </div>
            <div>
              <h3 className="font-serif text-2xl italic">{item.title}</h3>
              <p className="mt-1 text-sm text-white/56">{item.place} · {item.duration}</p>
            </div>
            <button className="rounded-full border border-[#c3a37a]/35 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c3a37a] transition hover:bg-[#c3a37a] hover:text-[#101917]">{item.status}</button>
          </motion.div>
        );
      })}
    </div>
  </section>
));
Program.displayName = 'Program';

function CurrentMoment({ cart, total, itemsCount }: { cart: Cart; total: number; itemsCount: number }) {
  const status = itemsCount > 0 ? 'Preparando seu pedido' : 'Nenhum pedido ativo';
  return (
    <section className="rounded-[10px] bg-white p-5 shadow-[0_18px_55px_rgba(48,33,20,0.08)] md:p-8">
      <SectionTitle eyebrow="Seu momento atual" title="O cuidado em andamento." desc="Pedidos, previsao e status em uma linguagem mais humana." />
      <div className="rounded-[10px] border border-[#1a0f0a]/8 bg-[#f8f3ea] p-5">
        <div className="mb-5 flex items-center justify-between">
          <span className="rounded-full bg-[#3a6b4a]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#3a6b4a]">{status}</span>
          <strong>R$ {total}</strong>
        </div>
        {Object.entries(cart).filter(([, qty]) => qty > 0).map(([name, qty]) => (
          <div key={name} className="flex items-center justify-between border-t border-[#1a0f0a]/8 py-3 text-sm">
            <span>{name}</span>
            <span className="font-mono">x{qty}</span>
          </div>
        ))}
        <p className="mt-4 rounded-[8px] bg-white p-4 text-sm text-[#1a0f0a]/58">Saindo da cozinha em instantes. Chega em aproximadamente 8 minutos.</p>
      </div>
    </section>
  );
}

function Housekeeping({ houseTime, setHouseTime, services, toggleService, confirmed, confirm }: { houseTime: string; setHouseTime: (value: string) => void; services: string[]; toggleService: (service: string) => void; confirmed: string; confirm: () => void }) {
  const options = ['Limpeza rapida', 'Troca de toalhas', 'Toalhas aquecidas', 'Reposicao de amenities', 'Preparar jacuzzi'];
  return (
    <section className="rounded-[10px] bg-white p-5 shadow-[0_18px_55px_rgba(48,33,20,0.08)] md:p-8">
      <SectionTitle eyebrow="Seu chale" title="Agendar arrumacao." desc="Escolha o horario e o tipo de cuidado. A equipe entra com discricao." />
      <div className="mb-5 grid grid-cols-3 gap-2">
        {['14:00', '15:30', '17:00'].map(time => (
          <button key={time} onClick={() => setHouseTime(time)} className={`rounded-full border px-3 py-3 text-sm font-semibold transition ${houseTime === time ? 'border-[#c3a37a] bg-[#1a0f0a] text-white' : 'border-[#1a0f0a]/10 bg-[#f8f3ea]'}`}>{time}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button key={option} onClick={() => toggleService(option)} className={`rounded-full border px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] transition ${services.includes(option) ? 'border-[#c3a37a] bg-[#c3a37a]/18 text-[#6f542f]' : 'border-[#1a0f0a]/10 bg-[#f8f3ea] text-[#1a0f0a]/58'}`}>{option}</button>
        ))}
      </div>
      <button onClick={confirm} className="mt-5 w-full rounded-full bg-[#1a0f0a] px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#c3a37a] hover:text-[#1a0f0a]">preparar meu chale</button>
      {confirmed && <p className="mt-4 rounded-[8px] bg-[#3a6b4a]/10 p-4 text-sm text-[#2e573b]">{confirmed}</p>}
    </section>
  );
}

const Experiences = React.forwardRef<HTMLElement>((_, ref) => (
  <section ref={ref} className="scroll-mt-8">
    <SectionTitle eyebrow="Experiencias" title="Escolha como a reserva vai ficar na memoria." />
    <div className="grid gap-5 lg:grid-cols-4">
      {EXPERIENCES.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.article key={item.title} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} viewport={{ once: true }} className="group overflow-hidden rounded-[10px] bg-white shadow-[0_18px_55px_rgba(48,33,20,0.08)]">
            <div className="relative aspect-[4/5] overflow-hidden">
              <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/14 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white"><Icon size={22} className="mb-4 text-[#c3a37a]" /><h3 className="font-serif text-2xl italic">{item.title}</h3></div>
            </div>
            <div className="p-5">
              <p className="text-sm leading-relaxed text-[#1a0f0a]/58">{item.copy}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-widest text-[#1a0f0a]/55">
                <span className="rounded-full bg-[#f4efe6] px-2 py-2">{item.duration}</span>
                <span className="rounded-full bg-[#f4efe6] px-2 py-2">{item.seats}</span>
                <span className="rounded-full bg-[#f4efe6] px-2 py-2">{item.best}</span>
              </div>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1a0f0a] px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#c3a37a] hover:text-[#1a0f0a]">reservar <ChevronRight size={15} /></button>
            </div>
          </motion.article>
        );
      })}
    </div>
  </section>
));
Experiences.displayName = 'Experiences';

const RoomService = React.forwardRef<HTMLElement, { cart: Cart; changeCart: (name: string, delta: number) => void; total: number }>(({ cart, changeCart, total }, ref) => (
  <section ref={ref} className="scroll-mt-8">
    <SectionTitle eyebrow="Gastronomia e room service" title="Do cafe no deck ao vinho da noite, tudo preparado no seu tempo." desc="Cafe da manha, vinhos, jantar, amenities e detalhes para o chale." />
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4 md:grid-cols-2">
        {MENU.map(item => {
          const Icon = item.icon;
          return (
            <article key={item.name} className="overflow-hidden rounded-[10px] bg-[#15100c] text-white shadow-[0_22px_65px_rgba(21,16,12,0.16)]">
              <div className="relative h-48">
                <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#15100c] to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-[#c3a37a] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#1a0f0a]">{item.category}</span>
              </div>
              <div className="p-5">
                <Icon size={20} className="mb-4 text-[#c3a37a]" />
                <h3 className="font-serif text-2xl italic">{item.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/58">{item.copy}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-white/52">{item.eta} min · R$ {item.price}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeCart(item.name, -1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/16"><Minus size={13} /></button>
                    <span className="w-5 text-center font-mono">{cart[item.name] || 0}</span>
                    <button onClick={() => changeCart(item.name, 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c3a37a] text-[#1a0f0a]"><Plus size={13} /></button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <aside className="sticky top-5 h-fit rounded-[10px] bg-white p-5 shadow-[0_18px_55px_rgba(48,33,20,0.08)]">
        <h3 className="font-serif text-3xl italic">Seu pedido</h3>
        <div className="mt-5 space-y-3">
          {Object.entries(cart).filter(([, qty]) => qty > 0).map(([name, qty]) => <div key={name} className="flex justify-between border-b border-[#1a0f0a]/8 pb-3 text-sm"><span>{name}</span><strong>x{qty}</strong></div>)}
        </div>
        <div className="mt-5 flex items-center justify-between"><span>Total</span><strong>R$ {total}</strong></div>
        <button className="mt-5 w-full rounded-full bg-[#1a0f0a] py-4 text-xs font-bold uppercase tracking-[0.2em] text-white">confirmar pedido</button>
        <p className="mt-4 text-sm leading-relaxed text-[#1a0f0a]/52">Status mockado: preparando seu pedido. Entrega estimada em 8 minutos.</p>
      </aside>
    </div>
  </section>
));
RoomService.displayName = 'RoomService';

function Chalet() {
  return (
    <section className="rounded-[10px] bg-white p-5 shadow-[0_18px_55px_rgba(48,33,20,0.08)] md:p-8">
      <SectionTitle eyebrow="Status do chale" title="Tudo pronto para voce nao pensar em nada." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CHALET.map(item => {
          const Icon = item.icon;
          return <div key={item.label} className="rounded-[10px] border border-[#1a0f0a]/8 bg-[#f8f3ea] p-4"><Icon size={18} className="mb-4 text-[#8c6b42]" /><span className="block text-[10px] font-bold uppercase tracking-widest text-[#1a0f0a]/38">{item.label}</span><strong className="mt-1 block text-sm">{item.value}</strong></div>;
        })}
      </div>
    </section>
  );
}

function RoomComforts() {
  return (
    <section className="overflow-hidden rounded-[10px] bg-white shadow-[0_18px_55px_rgba(48,33,20,0.08)]">
      <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
        <div className="relative min-h-[340px] overflow-hidden bg-[#101917]">
          <img src={IMG.room} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-72" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101917] via-[#101917]/38 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.36em] text-[#c3a37a]">Aconchegos</span>
            <h2 className="mt-3 font-serif text-4xl italic leading-tight">Presentes no seu comodo.</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/62">
              Pequenos cuidados ja preparados para que o chale pareca seu, desde o primeiro minuto.
            </p>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 md:p-7">
          {COMFORTS.map(item => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[10px] border border-[#1a0f0a]/8 bg-[#f8f3ea] p-5 transition hover:-translate-y-0.5 hover:border-[#c3a37a]/45 hover:shadow-[0_16px_40px_rgba(48,33,20,0.08)]">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#c3a37a]/16 text-[#8c6b42]">
                  <Icon size={19} />
                </div>
                <h3 className="font-serif text-xl italic">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#1a0f0a]/56">{item.copy}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Mood({ mood, countdown }: { mood: { weather: string; note: string }; countdown: { days: number; hours: number; minutes: number } }) {
  return (
    <section className="relative overflow-hidden rounded-[10px] bg-[#07110f] p-5 text-white shadow-[0_22px_65px_rgba(7,17,15,0.20)] md:p-8">
      <img src={IMG.pool} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#07110f]/92 via-[#07110f]/70 to-black/45" />
      <div className="relative">
        <SectionTitle eyebrow="Clima e mood" title="O dia esta pedindo calma." desc={mood.note} light />
        <div className="grid gap-3">
          <div className="rounded-[10px] border border-white/12 bg-white/8 p-4 backdrop-blur-md"><CloudSun size={20} className="mb-3 text-[#c3a37a]" /><strong>{mood.weather}</strong></div>
          <div className="rounded-[10px] border border-[#c3a37a]/25 bg-[#c3a37a]/12 p-4"><span className="text-[10px] font-bold uppercase tracking-widest text-[#c3a37a]">Sinal da reserva</span><p className="mt-2 font-serif text-2xl italic">Check-out em {countdown.days}d {countdown.hours}h {countdown.minutes}m</p></div>
        </div>
      </div>
    </section>
  );
}

function FloatingOrder({ cart, total, scrollToMenu }: { cart: Cart; total: number; scrollToMenu: () => void }) {
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  if (count === 0) return null;
  return <button onClick={scrollToMenu} className="fixed bottom-5 left-4 z-[850] rounded-full bg-white px-5 py-4 text-sm font-semibold text-[#1a0f0a] shadow-[0_18px_55px_rgba(26,15,10,0.22)] md:left-8">Pedido atual · {count} itens · R$ {total}</button>;
}

function ActionModal({ modal, setModal, changeCart, scrollToExperiences }: { modal: ModalMode; setModal: (modal: ModalMode) => void; changeCart: (name: string, delta: number) => void; scrollToExperiences: () => void }) {
  return (
    <AnimatePresence>
      {modal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[920] flex items-end bg-black/55 p-3 backdrop-blur-sm md:items-center md:justify-center">
          <motion.div initial={{ y: 40, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }} className="w-full max-w-lg rounded-[12px] bg-[#f8f3ea] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#3a6b4a]">Sugestao do concierge</span>
                <h3 className="mt-2 font-serif text-3xl italic">{modal === 'breakfast' ? 'Cafe no deck?' : 'Relaxar hoje?'}</h3>
              </div>
              <button onClick={() => setModal(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white"><X size={16} /></button>
            </div>
            <p className="text-sm leading-relaxed text-[#1a0f0a]/60">
              {modal === 'breakfast' ? 'Podemos preparar cafe da manha no deck em cerca de 25 minutos, com frutas, paes artesanais e cafe coado.' : 'Minha sugestao: massagem as 17:00, banho botanico e vinho no deck ao entardecer.'}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button onClick={() => { if (modal === 'breakfast') changeCart('Cafe da manha no deck', 1); else scrollToExperiences(); setModal(null); }} className="rounded-full bg-[#1a0f0a] px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white">{modal === 'breakfast' ? 'adicionar pedido' : 'ver experiencias'}</button>
              <button onClick={() => setModal(null)} className="rounded-full border border-[#1a0f0a]/12 bg-white px-5 py-4 text-xs font-bold uppercase tracking-[0.18em]">agora nao</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ConciergeAI({ open, setOpen, setModal }: { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>>; setModal: (modal: ModalMode) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ from: 'eden', text: 'Estou por aqui para preparar o dia no seu ritmo. O que voce deseja sentir agora?' }]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(current => [...current, { from: 'guest', text }]);
    setInput('');
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setMessages(current => [...current, { from: 'eden', text: CHAT_RESPONSES[text] || 'Posso cuidar disso com discricao. Para hoje, recomendo algo leve, sensorial e sem pressa.' }]);
      if (text === 'Quero relaxar') setModal('relax');
      if (text === 'Sugestao de vinho') setModal('breakfast');
    }, 900);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18 }} className="fixed bottom-24 left-4 right-4 z-[900] rounded-[12px] border border-white/18 bg-[#101917]/96 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:left-auto md:right-8 md:w-[410px]">
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c3a37a] text-[#101917]"><ConciergeBell size={18} /></div><div><h3 className="font-serif text-2xl italic">Concierge Eden</h3><p className="text-xs text-white/48">Resposta simulada com contexto da estadia.</p></div></div>
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {messages.map((message, index) => <div key={`${message.text}-${index}`} className={`rounded-[10px] p-3 text-sm leading-relaxed ${message.from === 'eden' ? 'bg-white/8 text-white/72' : 'ml-10 bg-[#c3a37a] text-[#101917]'}`}>{message.text}</div>)}
              {typing && <div className="w-fit rounded-full bg-white/8 px-4 py-2 text-sm text-white/58">digitando...</div>}
            </div>
            <div className="my-4 flex flex-wrap gap-2">{CHAT_SUGGESTIONS.map(item => <button key={item} onClick={() => send(item)} className="rounded-full border border-white/12 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/68 transition hover:border-[#c3a37a] hover:text-[#c3a37a]">{item}</button>)}</div>
            <div className="flex gap-2"><input value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') send(input); }} className="h-11 min-w-0 flex-1 rounded-full border border-white/12 bg-white/8 px-4 text-sm outline-none placeholder:text-white/30" placeholder="Conte o que voce deseja..." /><button onClick={() => send(input)} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c3a37a] text-[#101917]"><Send size={16} /></button></div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen(value => !value)} className="fixed bottom-5 right-5 z-[901] flex items-center gap-3 rounded-full bg-[#1a0f0a] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_55px_rgba(26,15,10,0.32)] transition hover:bg-[#c3a37a] hover:text-[#1a0f0a]"><MessageCircle size={18} />Precisa de algo?</button>
    </>
  );
}
