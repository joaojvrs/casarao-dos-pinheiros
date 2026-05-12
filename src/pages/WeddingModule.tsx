import React, { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowDown,
  Camera,
  ChevronLeft,
  Church,
  Flower2,
  Heart,
  MapPin,
  Music,
  Play,
  Sparkles,
  Star,
  Users,
  UtensilsCrossed,
  Wine,
} from 'lucide-react';

interface WeddingModuleProps {
  onBack: () => void;
}

const GOLD = '#c3a37a';
const HERO_IMAGE = '/casamento/fotocapenaprincipal.jpeg';
const CHAPEL_IMAGE = '/casamento/fotocapela.jpeg';
const BRIDE_IMAGE = '/casamento/imagem_noiva.jpeg';
const HONEYMOON_IMAGE = '/1761873810367-CabanaMata_Quarto2.jpg';
const FINE_DINING_IMAGE =
  'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=82';

const WEDDING_EXPERIENCES = [
  {
    id: '01',
    title: 'Cerimonia na Capela de Pedras',
    tagline: 'O momento mais sagrado',
    description:
      'Nossa Capela de pedras rusticas cria um cenario intimo e inesquecivel. Inserida na natureza preservada, ela carrega uma energia unica para o seu sim.',
    image: CHAPEL_IMAGE,
    Icon: Church,
  },
  {
    id: '02',
    title: 'Almoco exclusivo com o MasterChef',
    tagline: 'Gastronomia intima & memoravel',
    description:
      'Um chef dedicado cria um menu exclusivo ao vivo para o casal e seus convidados mais proximos, com sabor, memoria e cuidado em cada prato.',
    image: FINE_DINING_IMAGE,
    Icon: UtensilsCrossed,
  },
  {
    id: '03',
    title: 'Suite de Lua de Mel',
    tagline: 'Intimidade & luxo absoluto',
    description:
      'Cabana privativa, ofuro ao entardecer, deck com vista para a natureza e uma noite preparada para fechar o dia com delicadeza.',
    image: HONEYMOON_IMAGE,
    Icon: Heart,
  },
  {
    id: '04',
    title: 'Ritual de Bem-Estar para Noivas',
    tagline: 'Perfeita de dentro para fora',
    description:
      'Massagem, pausa e cuidado para a noiva e suas acompanhantes antes da cerimonia, em uma experiencia silenciosa e restauradora.',
    image: BRIDE_IMAGE,
    Icon: Sparkles,
  },
  {
    id: '05',
    title: 'Sessao Fotografica na Natureza',
    tagline: 'Memorias que duram eternamente',
    description:
      'Lagos, trilhas e a luz entre os pinheiros criam cenarios cinematograficos para fotografias com textura, emocao e verdade.',
    image: '/geral_hotel/foto1.jpeg',
    Icon: Camera,
  },
  {
    id: '06',
    title: 'Recepcao ao Ar Livre',
    tagline: 'Celebracao em plena natureza',
    description:
      'Espacos abertos com o vale como cenario, iluminacao especial, floricultura exclusiva e atendimento personalizado do inicio ao fim.',
    image: '/geral_hotel/foto6.jpeg',
    Icon: Star,
  },
];

const TESTIMONIALS = [
  {
    couple: 'Mariana & Rafael',
    date: 'Outubro de 2024',
    text: 'A cerimonia na capela foi o momento mais bonito das nossas vidas. O lugar tem uma energia muito especial, como se o tempo parasse ali dentro.',
    location: 'Sao Paulo, SP',
  },
  {
    couple: 'Camila & Thiago',
    date: 'Marco de 2025',
    text: 'Desde a primeira visita soubemos que era la. A equipe e incrivel, os cenarios sao emocionantes e a comida foi espetacular.',
    location: 'Curitiba, PR',
  },
  {
    couple: 'Ana Luiza & Pedro',
    date: 'Dezembro de 2024',
    text: 'Sonhavamos com um casamento na natureza, intimo e sofisticado. O Casarao entregou exatamente isso, e muito mais.',
    location: 'Florianopolis, SC',
  },
];

const GALLERY_IMAGES = [
  { url: BRIDE_IMAGE, label: 'A noiva' },
  { url: '/geral_hotel/foto2.jpeg', label: 'Refugio do casal' },
  { url: '/geral_hotel/foto1.jpeg', label: 'Lagos cristalinos' },
  { url: HERO_IMAGE, label: 'A Capela' },
];

const GALLERY_VIDEOS = [
  { url: '/casamento/videocasamento1.mp4', label: 'Cerimonia' },
  { url: '/casamento/videocasamento2.mp4', label: 'Celebracao' },
  { url: '/casamento/videocasamento3.mp4', label: 'Memorias' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const useSoftTransition = () => {
  const reduceMotion = useReducedMotion();
  return reduceMotion
    ? { duration: 0 }
    : { duration: 0.85, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };
};

const Reveal: React.FC<React.PropsWithChildren<{ className?: string; delay?: number }>> = ({
  children,
  className,
  delay = 0,
}) => {
  const transition = useSoftTransition();
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      variants={fadeUp}
      transition={{ ...transition, delay }}
      viewport={{ once: true, margin: '-80px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const WeddingNavbar: React.FC<{ onBack: () => void }> = memo(({ onBack }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 80);
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full z-[500] pointer-events-none">
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${
          scrolled ? 'bg-brown/92 shadow-lg' : 'bg-transparent'
        }`}
      />
      <div
        className={`absolute bottom-0 inset-x-0 h-px transition-opacity duration-300 ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'linear-gradient(to right, transparent 0%, rgba(195,163,122,0.35) 30%, rgba(195,163,122,0.35) 70%, transparent 100%)',
        }}
      />

      <div className="relative px-5 md:px-6 py-4 flex items-center justify-between pointer-events-auto">
        <button onClick={onBack} className="flex items-center gap-2 group">
          <span className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 group-hover:border-white/50 transition-colors">
            <ChevronLeft size={14} className="text-white/70 group-hover:text-white transition-colors" />
          </span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/55 group-hover:text-white/80 transition-colors">
            Voltar
          </span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2">
          <img
            src="/logo.png"
            alt="Casarao Vale do Eden"
            className="h-12 w-auto object-contain opacity-90"
            loading="eager"
            decoding="async"
          />
        </div>

        <button className="hidden sm:block px-5 py-[7px] rounded-full text-[10px] uppercase tracking-widest font-medium border border-white/20 text-white/80 hover:border-gold/60 hover:text-gold transition-colors duration-300">
          Agendar Visita
        </button>
      </div>
    </nav>
  );
});

const WeddingHero: React.FC = memo(() => {
  const transition = useSoftTransition();

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-end justify-center bg-brown">
      <img
        src={HERO_IMAGE}
        alt="Capela de Pedras para casamentos no Vale do Eden"
        className="absolute inset-0 h-full w-full object-contain object-center"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/62 via-black/22 to-beige pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/24 pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.08 }}
        className="relative z-10 text-center px-6 pb-28 md:pb-36 w-full max-w-5xl mx-auto"
      >
        <motion.div variants={fadeUp} transition={transition} className="mb-8 flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-white/30" />
          <span className="text-white/62 uppercase tracking-[0.5em] text-[10px]">
            Casamentos · Vale do Eden Reserva
          </span>
          <div className="h-px w-12 bg-white/30" />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          transition={transition}
          className="font-serif text-5xl md:text-8xl lg:text-[96px] text-white leading-[1.05] mb-8"
        >
          O lugar onde <br />
          <span className="italic font-light text-[#d4b896]">o amor</span>
          <br />
          encontra a eternidade.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={transition}
          className="text-white/66 text-sm md:text-base max-w-lg mx-auto leading-relaxed mb-14"
        >
          Cerimonias exclusivas na nossa Capela de Pedras, cercada pela natureza intocada
          do Vale do Eden, onde cada detalhe vira memoria.
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={transition}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button className="group relative px-10 py-4 overflow-hidden rounded-full border border-white/30 hover:border-gold/80 transition-colors duration-300">
            <span className="relative z-10 text-[11px] uppercase tracking-[0.28em] font-medium text-white group-hover:text-brown transition-colors duration-300">
              Agendar uma Visita
            </span>
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-white transition-transform duration-300 ease-out group-hover:scale-y-100" />
          </button>

          <button className="text-[11px] uppercase tracking-[0.28em] text-white/48 hover:text-white/82 transition-colors flex items-center gap-2">
            <ArrowDown size={13} />
            Conhecer mais
          </button>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-beige to-transparent z-10 pointer-events-none" />
    </section>
  );
});

const WeddingManifesto: React.FC = memo(() => (
  <section className="py-28 md:py-44 bg-beige overflow-hidden">
    <div className="max-w-5xl mx-auto px-6 md:px-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 md:gap-24 items-start">
        <Reveal>
          <span className="text-forest uppercase tracking-[0.45em] text-[10px] font-bold block mb-5">
            A Essencia
          </span>
          <div className="h-px w-10 bg-gold" />
        </Reveal>

        <div className="space-y-8">
          <Reveal>
            <h2 className="font-serif text-4xl md:text-6xl text-brown leading-[1.1]">
              Alguns momentos merecem
              <br />
              <span className="italic font-light opacity-55">um lugar a altura.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.05}>
            <p className="text-brown/55 text-lg leading-relaxed">
              O Casarao Vale do Eden Reserva foi criado para quem entende que um casamento
              nao e apenas uma festa. E o inicio de uma nova historia, com natureza intocada,
              arquitetura historica e cuidado verdadeiramente personalizado.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="text-brown/40 text-base leading-relaxed">
              Aqui, cada cerimonia e unica. Cada detalhe e pensado. Cada memoria e para sempre.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid grid-cols-3 gap-0 rounded-2xl overflow-hidden border border-brown/8 bg-brown/[0.025] mt-12">
              {[
                { value: '80', label: 'Convidados', sub: 'capacidade maxima' },
                { value: '5h', label: 'Natureza', sub: 'trilhas e lagos' },
                { value: '∞', label: 'Memorias', sub: 'para uma vida' },
              ].map(({ value, label, sub }, i) => (
                <div
                  key={label}
                  className="py-7 md:py-8 px-3 md:px-4 text-center"
                  style={{ borderRight: i < 2 ? '1px solid rgba(26,15,10,0.06)' : 'none' }}
                >
                  <div className="font-serif text-3xl md:text-4xl text-gold mb-1">{value}</div>
                  <div className="text-[9px] md:text-[10px] uppercase tracking-[0.22em] text-brown/70 font-semibold mb-1">
                    {label}
                  </div>
                  <div className="text-[9px] text-brown/32 tracking-wider">{sub}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  </section>
));

const ChapelSection: React.FC = memo(() => (
  <section className="py-24 md:py-40 overflow-hidden bg-[#f5f0e8]">
    <div className="max-w-7xl mx-auto px-6 md:px-16">
      <Reveal className="text-center mb-20 md:mb-28">
        <span className="text-forest uppercase tracking-[0.5em] text-[10px] font-bold">
          A Nossa Capela
        </span>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <Reveal className="relative">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_24px_70px_rgba(26,15,10,0.14)]">
            <img
              src={CHAPEL_IMAGE}
              alt="Capela de pedras do Vale do Eden"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brown/26 via-transparent to-transparent" />
          </div>

          <div className="absolute -bottom-8 -right-4 md:-right-10 p-6 md:p-8 rounded-2xl shadow-xl bg-[#fcf9f2]/95 border border-gold/20">
            <Church size={22} className="text-gold mb-3" />
            <div className="font-serif text-5xl text-brown leading-none mb-1">80</div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-brown/40">convidados</div>
          </div>
        </Reveal>

        <div className="space-y-8 lg:pl-8">
          <Reveal>
            <h2 className="font-serif text-4xl md:text-6xl text-brown leading-[1.1]">
              Construida em pedras,
              <br />
              <span className="italic font-light opacity-50">erguida em amor.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="h-px w-16 bg-gold" />
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-brown/55 text-lg leading-relaxed">
              Nossa Capela foi construida com pedras rusticas que carregam a historia
              e a energia da terra. Inserida harmoniosamente na natureza preservada,
              ela cria uma atmosfera de silencio sagrado e beleza intemporal.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-brown/38 text-base leading-relaxed">
              A luz que entra pelas janelas em arco, o som da natureza ao redor e a presenca
              unica do lugar criam uma experiencia que vai alem da cerimonia.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="space-y-4 pt-4">
              {[
                { Icon: Users, text: 'Capacidade para ate 80 convidados' },
                { Icon: MapPin, text: 'Inserida na natureza preservada da fazenda' },
                { Icon: Flower2, text: 'Decoracao exclusiva com floricultura premium' },
                { Icon: Music, text: 'Sonorizacao personalizada para a cerimonia' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 bg-gold/12">
                    <Icon size={13} className="text-gold" />
                  </div>
                  <span className="text-brown/55 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  </section>
));

const BrideFeature: React.FC = memo(() => (
  <section className="py-24 md:py-40 bg-beige overflow-hidden">
    <div className="max-w-6xl mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-14 lg:gap-24 items-center">
      <div className="space-y-8 order-2 lg:order-1">
        <Reveal>
          <span className="text-forest uppercase tracking-[0.45em] text-[10px] font-bold mb-6 block">
            O cuidado da noiva
          </span>
          <h2 className="font-serif text-4xl md:text-6xl text-brown leading-[1.1]">
            Um retrato de calma
            <br />
            <span className="italic font-light opacity-50">antes do sim.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.06}>
          <p className="text-brown/50 text-lg leading-relaxed">
            A preparacao tambem faz parte da memoria. Criamos pausas, rituais e ambientes
            pensados para que a noiva viva o dia com presenca, beleza e tranquilidade.
          </p>
        </Reveal>
      </div>

      <Reveal className="relative order-1 lg:order-2">
        <div className="absolute -inset-4 rounded-[2rem] bg-gold/10" />
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_26px_80px_rgba(26,15,10,0.16)]">
          <img
            src={BRIDE_IMAGE}
            alt="Noiva em destaque no Casarao Vale do Eden"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brown/22 via-transparent to-transparent" />
        </div>
      </Reveal>
    </div>
  </section>
));

const WeddingExperiences: React.FC = memo(() => (
  <section className="py-28 md:py-40 bg-beige px-6 md:px-16 xl:px-20 overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-end mb-18 md:mb-24">
        <Reveal>
          <span className="text-forest uppercase tracking-[0.45em] text-[10px] font-bold mb-6 block">
            Experiencias Exclusivas
          </span>
          <h2 className="font-serif text-5xl md:text-7xl italic text-brown leading-tight">
            Cada detalhe <br /> pensado para voce.
          </h2>
        </Reveal>

        <Reveal delay={0.06}>
          <p className="text-brown/45 text-lg leading-relaxed lg:max-w-md">
            Do ritual de bem-estar antes da cerimonia ao almoco exclusivo com nosso MasterChef,
            cada experiencia e curada para tornar o seu dia verdadeiramente inesquecivel.
          </p>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {WEDDING_EXPERIENCES.map(({ id, title, tagline, description, image, Icon }) => (
          <article
            key={id}
            className="group bg-[#f7f1e8] flex flex-col overflow-hidden rounded-2xl border border-brown/8 shadow-[0_18px_55px_rgba(26,15,10,0.055)] hover:border-gold/25 hover:bg-[#fbf6ee] transition-colors duration-300 cursor-default"
          >
            <div className="relative h-56 overflow-hidden">
              <img
                src={image}
                alt={title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brown/40 via-transparent to-transparent opacity-55" />
              <div className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-[#fcf9f2]/94 shadow-sm border border-white/45">
                <Icon size={16} className="text-gold" />
              </div>
              <span className="absolute top-4 left-4 font-mono text-[10px] tracking-widest text-white/65">
                {id}
              </span>
            </div>

            <div className="flex flex-col gap-5 p-8 xl:p-9 flex-1">
              <div className="h-px w-10 bg-gold" />
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] uppercase tracking-[0.38em] text-brown/30 font-bold">
                  {tagline}
                </span>
                <h3 className="font-serif text-2xl text-brown leading-snug group-hover:text-brown/82 transition-colors">
                  {title}
                </h3>
              </div>
              <p className="text-brown/50 text-sm leading-relaxed flex-1 group-hover:text-brown/62 transition-colors">
                {description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
));

const WeddingGallery: React.FC = memo(() => {
  const [lightbox, setLightbox] = useState<{ type: 'image' | 'video'; url: string } | null>(null);

  return (
    <section className="py-28 md:py-40 overflow-hidden bg-[#f0ebe0]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <Reveal className="text-center mb-16 md:mb-24">
          <span className="text-forest uppercase tracking-[0.45em] text-[10px] font-bold mb-4 block">
            Galeria
          </span>
          <h2 className="font-serif text-5xl md:text-7xl italic text-brown">
            Fragmentos <span className="not-italic opacity-38">do eterno.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {GALLERY_IMAGES.map(img => (
            <button
              key={img.url}
              type="button"
              className="relative group overflow-hidden rounded-2xl bg-beige aspect-[4/5] cursor-zoom-in text-left border border-brown/8 shadow-[0_20px_56px_rgba(26,15,10,0.08)]"
              onClick={() => setLightbox({ type: 'image', url: img.url })}
            >
              <img
                src={img.url}
                alt={img.label}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.018]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-black/5 to-transparent opacity-80 md:opacity-45 md:group-hover:opacity-80 transition-opacity duration-300" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-serif text-xl italic text-white/90">{img.label}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mt-5 md:mt-6">
          {GALLERY_VIDEOS.map(video => (
            <button
              key={video.url}
              type="button"
              className="relative group overflow-hidden rounded-2xl bg-brown aspect-video cursor-pointer text-left border border-brown/8 shadow-[0_20px_56px_rgba(26,15,10,0.08)]"
              onClick={() => setLightbox({ type: 'video', url: video.url })}
            >
              <video
                src={video.url}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.018]"
                preload="metadata"
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-transparent transition-opacity duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 rounded-full border border-white/35 bg-white/10 flex items-center justify-center text-white text-lg leading-none group-hover:bg-gold group-hover:text-brown group-hover:border-gold transition-colors duration-300">
                  <Play size={17} fill="currentColor" />
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-serif text-2xl italic text-white/92">{video.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0a0604]/92"
            onClick={() => setLightbox(null)}
          >
            {lightbox.type === 'image' ? (
              <motion.img
                src={lightbox.url}
                alt=""
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-5xl max-h-[90vh] w-full object-contain rounded-xl shadow-2xl"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <motion.video
                src={lightbox.url}
                controls
                autoPlay
                playsInline
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-5xl max-h-[90vh] w-full rounded-xl shadow-2xl bg-black"
                onClick={e => e.stopPropagation()}
              />
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors text-white"
            >
              x
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});

const WeddingTestimonials: React.FC = memo(() => {
  const [active, setActive] = useState(0);

  return (
    <section className="py-28 md:py-40 bg-beige overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-16">
        <Reveal className="text-center mb-16 md:mb-20">
          <span className="text-forest uppercase tracking-[0.45em] text-[10px] font-bold mb-4 block">
            Historias Reais
          </span>
          <h2 className="font-serif text-4xl md:text-6xl italic text-brown">
            Casais que escolheram<br />
            <span className="not-italic font-light opacity-45">o Vale do Eden.</span>
          </h2>
        </Reveal>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="w-8 h-px mx-auto mb-10 bg-gold" />
              <blockquote className="font-serif text-2xl md:text-3xl text-brown/75 leading-relaxed italic mb-10">
                "{TESTIMONIALS[active].text}"
              </blockquote>
              <div className="flex flex-col items-center gap-2">
                <span className="font-serif text-lg text-brown font-medium">
                  {TESTIMONIALS[active].couple}
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-brown/35">
                  {TESTIMONIALS[active].date} · {TESTIMONIALS[active].location}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-3 mt-12">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === active ? 28 : 6,
                  background: i === active ? GOLD : 'rgba(26,15,10,0.18)',
                }}
                aria-label={`Ver depoimento ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

const WeddingCTA: React.FC = memo(() => (
  <section className="relative min-h-[78vh] flex items-center justify-center overflow-hidden bg-brown">
    <img
      src={CHAPEL_IMAGE}
      alt=""
      loading="lazy"
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-brown/70 via-brown/50 to-brown/78" />

    <div className="relative z-10 text-center px-6 py-28">
      <Reveal className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px w-10 bg-white/25" />
          <span className="text-white/52 uppercase tracking-[0.45em] text-[9px]">
            O proximo passo
          </span>
          <div className="h-px w-10 bg-white/25" />
        </div>

        <h2 className="font-serif text-5xl md:text-7xl text-white leading-[1.08]">
          O seu dia mais
          <br />
          <span className="italic font-light text-[#d4b896]">especial comeca aqui.</span>
        </h2>

        <p className="text-white/58 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          Agende uma visita para conhecer a propriedade, sentir a energia do lugar
          e conversar com nossa equipe sobre como tornar o seu casamento unico.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <button className="group relative px-10 sm:px-12 py-5 overflow-hidden rounded-full bg-gold/15 border border-gold/50 hover:border-gold transition-colors duration-300">
            <span className="relative z-10 text-[11px] uppercase tracking-[0.32em] font-semibold text-white group-hover:text-brown transition-colors duration-300">
              Agendar uma Visita
            </span>
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-gold transition-transform duration-300 ease-out group-hover:scale-y-100" />
          </button>

          <button className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/44 hover:text-white/78 transition-colors">
            <Wine size={14} />
            Falar pelo WhatsApp
          </button>
        </div>
      </Reveal>
    </div>
  </section>
));

const WeddingFooter: React.FC<{ onBack: () => void }> = memo(({ onBack }) => (
  <footer className="py-16 px-6 bg-brown">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <img
        src="/logo.png"
        alt="Casarao Vale do Eden"
        className="h-12 w-auto object-contain opacity-70"
        loading="lazy"
        decoding="async"
      />
      <p className="text-[9px] uppercase tracking-[0.3em] text-white/25 text-center">
        © 2026 Casarao Vale do Eden Reserva · Casamentos Exclusivos
      </p>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40 hover:text-white/70 transition-colors"
      >
        <ChevronLeft size={12} />
        Voltar ao site
      </button>
    </div>
  </footer>
));

export const WeddingModule: React.FC<WeddingModuleProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-beige text-brown min-h-screen"
    >
      <WeddingNavbar onBack={onBack} />
      <main>
        <WeddingHero />
        <WeddingManifesto />
        <ChapelSection />
        <BrideFeature />
        <WeddingExperiences />
        <WeddingGallery />
        <WeddingTestimonials />
        <WeddingCTA />
      </main>
      <WeddingFooter onBack={onBack} />
    </motion.div>
  );
};
