import React, { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
} from 'motion/react';
import {
  ChevronLeft,
  Heart,
  Church,
  UtensilsCrossed,
  Sparkles,
  Camera,
  Star,
  MapPin,
  Users,
  Calendar,
  ArrowDown,
  Flower2,
  Music,
  Wine,
} from 'lucide-react';

interface WeddingModuleProps {
  onBack: () => void;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const WEDDING_EXPERIENCES = [
  {
    id: '01',
    title: 'Cerimônia na Capela de Pedras',
    tagline: 'O momento mais sagrado',
    description:
      'Nossa linda Capela de pedras rústicas cria um cenário íntimo e inesquecível. Inserida na natureza preservada, ela carrega uma energia única — o cenário perfeito para o seu "sim".',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=82',
    Icon: Church,
  },
  {
    id: '02',
    title: 'Almoço exclusivo com o MasterChef',
    tagline: 'Gastronomia íntima & memorável',
    description:
      'Um chef dedicado cria um menu exclusivo ao vivo para o casal e seus convidados mais próximos. Cada prato narra a história do amor em forma de sabor e memória.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=82',
    Icon: UtensilsCrossed,
  },
  {
    id: '03',
    title: 'Suíte de Lua de Mel',
    tagline: 'Intimidade & luxo absoluto',
    description:
      'Cabana privativa com ofurô ao entardecer, deck com vista para a natureza e uma cama preparada com pétalas e champagne para a noite mais especial da sua vida.',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=700&q=82',
    Icon: Heart,
  },
  {
    id: '04',
    title: 'Ritual de Bem-Estar para Noivas',
    tagline: 'Perfeita de dentro para fora',
    description:
      'Sessão exclusiva de massagem e tratamentos para a noiva e suas acompanhantes. Relaxamento profundo, cuidado total e energia renovada antes do grande dia.',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=82',
    Icon: Sparkles,
  },
  {
    id: '05',
    title: 'Sessão Fotográfica na Natureza',
    tagline: 'Memórias que duram eternamente',
    description:
      'Lagos cristalinos, cachoeiras e a trilha entre os pinheiros como palco natural. Cenários cinematográficos para as fotografias mais bonitas da sua vida.',
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=82',
    Icon: Camera,
  },
  {
    id: '06',
    title: 'Recepção ao Ar Livre',
    tagline: 'Celebração em plena natureza',
    description:
      'Espaços deslumbrantes com o vale como cenário para a festa da sua vida. Iluminação especial, floricultura exclusiva e atendimento personalizado do início ao fim.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=700&q=82',
    Icon: Star,
  },
];

const TESTIMONIALS = [
  {
    couple: 'Mariana & Rafael',
    date: 'Outubro de 2024',
    text: 'A cerimônia na capela foi o momento mais bonito das nossas vidas. O lugar tem uma energia muito especial — parece que o tempo para ali dentro. Escolhemos o Vale do Eden e não poderíamos ser mais felizes com essa decisão.',
    location: 'São Paulo, SP',
  },
  {
    couple: 'Camila & Thiago',
    date: 'Março de 2025',
    text: 'Desde a primeira visita soubemos que era lá. A equipe é incrível, os cenários são de outro mundo e a comida foi espetacular. Nossos convidados ainda falam sobre o almoço com o MasterChef. Vale cada detalhe.',
    location: 'Curitiba, PR',
  },
  {
    couple: 'Ana Luiza & Pedro',
    date: 'Dezembro de 2024',
    text: 'Sonhávamos com um casamento na natureza, íntimo e sofisticado. O Casarão entregou exatamente isso — e muito mais. A lua de mel na cabana foi o capítulo mais lindo da nossa história.',
    location: 'Florianópolis, SC',
  },
];

const GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-[3/4]',
    label: 'A Capela',
  },
  {
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-[4/3]',
    label: 'Recepção ao ar livre',
  },
  {
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-square',
    label: 'Detalhe da cerimônia',
  },
  {
    url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-[4/3]',
    label: 'Natureza & amor',
  },
  {
    url: '/geral_hotel/foto1.jpeg',
    aspect: 'aspect-[3/4]',
    label: 'A propriedade',
  },
  {
    url: '/geral_hotel/foto6.jpeg',
    aspect: 'aspect-square',
    label: 'Lagos cristalinos',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const WeddingNavbar: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const unsub = scrollY.on('change', v => setScrolled(v > 80));
    return unsub;
  }, [scrollY]);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 w-full z-[500] pointer-events-none"
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: scrolled ? 'rgba(26,15,10,0.92)' : 'rgba(0,0,0,0)',
          backdropFilter: scrolled ? 'blur(24px)' : 'blur(0px)',
          boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        animate={{ opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background:
            'linear-gradient(to right, transparent 0%, rgba(195,163,122,0.35) 30%, rgba(195,163,122,0.35) 70%, transparent 100%)',
        }}
      />

      <div className="relative px-6 py-4 flex items-center justify-between pointer-events-auto">
        <motion.button
          onClick={onBack}
          className="flex items-center gap-2 group"
          whileHover={{ x: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 group-hover:border-white/50 transition-colors">
            <ChevronLeft size={14} className="text-white/70 group-hover:text-white transition-colors" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/50 group-hover:text-white/80 transition-colors">
            Voltar
          </span>
        </motion.button>

        <div className="absolute left-1/2 -translate-x-1/2">
          <img
            src="/logo.png"
            alt="Casarão Vale do Eden"
            className="h-12 w-auto object-contain"
            style={{ mixBlendMode: 'screen', opacity: 0.92 }}
          />
        </div>

        <motion.button
          className="px-5 py-[7px] rounded-full text-[10px] uppercase tracking-widest font-medium border border-white/20 text-white/80 hover:border-gold/60 hover:text-gold transition-all duration-300"
          style={{ color: 'rgba(255,255,255,0.8)' }}
          whileHover={{ borderColor: 'rgba(195,163,122,0.7)', color: 'rgb(195,163,122)' }}
        >
          Agendar Visita
        </motion.button>
      </div>
    </motion.nav>
  );
};

// ── Hero ──────────────────────────────────────────────────────────────────────

const WeddingHero: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden flex items-end justify-center">

      {/* Parallax background image */}
      <motion.div className="absolute inset-0 scale-110" style={{ y }}>
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=85"
          alt="Vale do Eden — Casamentos"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-beige pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 text-center px-6 pb-28 md:pb-36 w-full max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-center justify-center gap-4"
        >
          <div className="h-px w-12 bg-white/30" />
          <span className="text-white/60 uppercase tracking-[0.5em] text-[10px]">
            Casamentos · Vale do Eden Reserva
          </span>
          <div className="h-px w-12 bg-white/30" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 70, filter: 'blur(18px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 2.2, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-5xl md:text-8xl lg:text-[96px] text-white leading-[1.05] mb-8"
        >
          O lugar onde <br />
          <span className="italic font-light" style={{ color: '#d4b896' }}>o amor</span>
          <br />
          encontra a eternidade.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.1 }}
          className="text-white/65 text-sm md:text-base max-w-lg mx-auto leading-relaxed mb-14"
        >
          Cerimônias exclusivas na nossa Capela de Pedras, cercada pela natureza
          intocada do Vale do Eden — onde cada detalhe é um capítulo da sua história.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 1.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            className="group relative px-10 py-4 overflow-hidden rounded-full border border-white/30"
            whileHover={{ borderColor: 'rgba(195,163,122,0.8)' }}
          >
            <span className="relative z-10 text-[11px] uppercase tracking-[0.28em] font-medium text-white group-hover:text-brown transition-colors duration-400">
              Agendar uma Visita
            </span>
            <motion.div
              className="absolute inset-0 bg-white origin-bottom"
              initial={{ scaleY: 0 }}
              whileHover={{ scaleY: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.button>

          <motion.button
            className="text-[11px] uppercase tracking-[0.28em] text-white/45 hover:text-white/80 transition-colors flex items-center gap-2"
          >
            <ArrowDown size={13} className="animate-bounce" />
            Conhecer mais
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Bottom fade to beige */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-beige to-transparent z-10 pointer-events-none" />
    </section>
  );
};

// ── Manifesto ─────────────────────────────────────────────────────────────────

const WeddingManifesto: React.FC = () => {
  return (
    <section className="py-32 md:py-48 bg-beige overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 md:gap-24 items-start">

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: '-80px' }}
          >
            <span className="text-forest uppercase tracking-[0.45em] text-[10px] font-bold block mb-5">
              A Essência
            </span>
            <motion.div
              className="h-px"
              style={{ background: '#c3a37a', width: 40 }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            />
          </motion.div>

          <div className="space-y-8">
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, margin: '-80px' }}
              className="font-serif text-4xl md:text-6xl text-brown leading-[1.1]"
            >
              Alguns momentos merecem
              <br />
              <span className="italic font-light opacity-55">um lugar à altura.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="text-brown/55 text-lg leading-relaxed"
            >
              O Casarão Vale do Eden Reserva foi criado para quem entende que um casamento
              não é apenas uma festa — é o início de uma nova história. Nossa propriedade oferece
              algo raro: a combinação de natureza intocada, arquitetura histórica e um cuidado
              verdadeiramente personalizado.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="text-brown/40 text-base leading-relaxed"
            >
              Aqui, cada cerimônia é única. Cada detalhe é pensado. Cada memória é para sempre.
            </motion.p>

            {/* Floating stats */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.4 }}
              viewport={{ once: true }}
              className="grid grid-cols-3 gap-0 rounded-2xl overflow-hidden border border-brown/8 mt-12"
              style={{ background: 'rgba(26,15,10,0.025)' }}
            >
              {[
                { value: '80', label: 'Convidados', sub: 'capacidade máxima' },
                { value: '5h', label: 'Natureza', sub: 'de trilhas e lagos' },
                { value: '∞', label: 'Memórias', sub: 'para uma vida' },
              ].map(({ value, label, sub }, i) => (
                <div
                  key={label}
                  className="py-8 px-4 text-center"
                  style={{
                    borderRight: i < 2 ? '1px solid rgba(26,15,10,0.06)' : 'none',
                  }}
                >
                  <div className="font-serif text-4xl text-brown mb-1" style={{ color: '#c3a37a' }}>
                    {value}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-brown/70 font-semibold mb-1">
                    {label}
                  </div>
                  <div className="text-[9px] text-brown/30 tracking-wider">{sub}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Chapel Section ────────────────────────────────────────────────────────────

const ChapelSection: React.FC = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(imageRef, { once: true, margin: '-100px' });
  const { scrollYProgress } = useScroll({ target: imageRef, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <section className="py-24 md:py-40 overflow-hidden" style={{ background: '#f5f0e8' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-16">

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20 md:mb-28"
        >
          <span className="text-forest uppercase tracking-[0.5em] text-[10px] font-bold">
            A Nossa Chapel
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Image column */}
          <motion.div
            ref={imageRef}
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <motion.img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=85"
                alt="Chapel — Vale do Eden"
                style={{ y: imgY }}
                className="w-full h-[115%] object-cover absolute inset-x-0 -top-[7.5%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brown/25 to-transparent" />
            </div>

            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-8 -right-4 md:-right-10 p-6 md:p-8 rounded-2xl shadow-2xl"
              style={{
                background: 'rgba(252,249,242,0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(195,163,122,0.2)',
              }}
            >
              <Church size={22} style={{ color: '#c3a37a', marginBottom: 12 }} />
              <div className="font-serif text-5xl text-brown leading-none mb-1">80</div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-brown/40">convidados</div>
            </motion.div>
          </motion.div>

          {/* Text column */}
          <div className="space-y-8 lg:pl-8">
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="font-serif text-4xl md:text-6xl text-brown leading-[1.1]"
            >
              Construída em pedras,
              <br />
              <span className="italic font-light" style={{ opacity: 0.5 }}>erguida em amor.</span>
            </motion.h2>

            <motion.div
              className="h-px w-16"
              style={{ background: '#c3a37a' }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              viewport={{ once: true }}
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.15 }}
              viewport={{ once: true }}
              className="text-brown/55 text-lg leading-relaxed"
            >
              Nossa Chapel foi construída com pedras rústicas que carregam a história
              e a energia da terra. Inserida harmoniosamente na natureza preservada da
              propriedade, ela cria uma atmosfera de silêncio sagrado e beleza intemporal.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.28 }}
              viewport={{ once: true }}
              className="text-brown/38 text-base leading-relaxed"
            >
              A luz que entra pelas janelas em arco, o som da natureza ao redor e a
              presença única do lugar criam uma experiência que vai além da cerimônia —
              é uma transformação que fica para sempre em quem a vive.
            </motion.p>

            {/* Feature list */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.35 }}
              viewport={{ once: true }}
              className="space-y-4 pt-4"
            >
              {[
                { Icon: Users, text: 'Capacidade para até 80 convidados' },
                { Icon: MapPin, text: 'Inserida na natureza preservada da fazenda' },
                { Icon: Flower2, text: 'Decoração exclusiva com floricultura premium' },
                { Icon: Music, text: 'Sonorização personalizada para a cerimônia' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(195,163,122,0.12)' }}
                  >
                    <Icon size={13} style={{ color: '#c3a37a' }} />
                  </div>
                  <span className="text-brown/55 text-sm">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Wedding Experiences ───────────────────────────────────────────────────────

const WeddingExperiences: React.FC = () => {
  return (
    <section className="py-32 md:py-44 bg-beige px-6 md:px-16 xl:px-20 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-end mb-20 md:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: '-80px' }}
          >
            <span className="text-forest uppercase tracking-[0.45em] text-[10px] font-bold mb-6 block">
              Experiências Exclusivas
            </span>
            <h2 className="font-serif text-5xl md:text-7xl italic text-brown leading-tight">
              Cada detalhe <br /> pensado para você.
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-brown/45 text-lg leading-relaxed lg:max-w-md"
          >
            Do ritual de bem-estar antes da cerimônia ao almoço exclusivo com nosso MasterChef —
            cada experiência é cuidadosamente curada para tornar o seu dia verdadeiramente inesquecível.
          </motion.p>
        </div>

        {/* Experiences grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{ background: 'rgba(26,15,10,0.07)' }}
        >
          {WEDDING_EXPERIENCES.map(({ id, title, tagline, description, image, Icon }, i) => (
            <motion.article
              key={id}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: (i % 3) * 0.1,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              }}
              viewport={{ once: true, margin: '-60px' }}
              className="group bg-beige flex flex-col overflow-hidden hover:bg-brown/[0.022] transition-colors duration-500 cursor-default"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={image}
                  alt={title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-beige via-transparent to-transparent opacity-70" />

                {/* Floating icon */}
                <div
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{
                    background: 'rgba(252,249,242,0.90)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 16px rgba(26,15,10,0.12)',
                  }}
                >
                  <Icon size={16} style={{ color: '#c3a37a' }} />
                </div>

                {/* Id badge */}
                <span
                  className="absolute top-4 left-4 font-mono text-[10px] tracking-widest"
                  style={{ color: 'rgba(252,249,242,0.5)' }}
                >
                  {id}
                </span>
              </div>

              {/* Body */}
              <div className="flex flex-col gap-5 p-8 xl:p-10 flex-1">
                <motion.div
                  className="h-px w-10"
                  style={{ background: '#c3a37a' }}
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 0.3 + (i % 3) * 0.1 }}
                  viewport={{ once: true }}
                />

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase tracking-[0.38em] text-brown/28 font-bold">
                    {tagline}
                  </span>
                  <h3 className="font-serif text-2xl text-brown leading-snug group-hover:text-brown/80 transition-colors">
                    {title}
                  </h3>
                </div>

                <p className="text-brown/48 text-sm leading-relaxed flex-1 group-hover:text-brown/62 transition-colors">
                  {description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Gallery ───────────────────────────────────────────────────────────────────

const WeddingGallery: React.FC = () => {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <section className="py-28 md:py-40 overflow-hidden" style={{ background: '#f0ebe0' }}>
      <div className="max-w-6xl mx-auto px-6 md:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="text-forest uppercase tracking-[0.45em] text-[10px] font-bold mb-4 block">
            Galeria
          </span>
          <h2 className="font-serif text-5xl md:text-7xl italic text-brown">
            Fragmentos <span className="not-italic opacity-38">do eterno.</span>
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {GALLERY_IMAGES.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 36, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.9,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              }}
              viewport={{ once: true }}
              className={`relative group overflow-hidden rounded-2xl bg-beige ${img.aspect} cursor-zoom-in`}
              onClick={() => setLightbox(img.url)}
            >
              <img
                src={img.url}
                alt={img.label}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="absolute inset-x-0 bottom-0 p-5 text-white text-sm font-light translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                {img.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(10,6,4,0.92)', backdropFilter: 'blur(16px)' }}
            onClick={() => setLightbox(null)}
          >
            <motion.img
              src={lightbox}
              alt=""
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl max-h-[90vh] w-full object-contain rounded-xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors text-white"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

// ── Testimonials ──────────────────────────────────────────────────────────────

const WeddingTestimonials: React.FC = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="py-32 md:py-48 bg-beige overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="text-forest uppercase tracking-[0.45em] text-[10px] font-bold mb-4 block">
            Histórias Reais
          </span>
          <h2 className="font-serif text-4xl md:text-6xl italic text-brown">
            Casais que escolheram<br />
            <span className="not-italic font-light opacity-45">o Vale do Eden.</span>
          </h2>
        </motion.div>

        {/* Testimonial carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-3xl mx-auto"
            >
              {/* Quote */}
              <div
                className="w-8 h-px mx-auto mb-10"
                style={{ background: '#c3a37a' }}
              />

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

          {/* Dots */}
          <div className="flex items-center justify-center gap-3 mt-12">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="transition-all duration-300"
                style={{
                  width: i === active ? 28 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === active ? '#c3a37a' : 'rgba(26,15,10,0.18)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Final CTA ─────────────────────────────────────────────────────────────────

const WeddingCTA: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section ref={ref} className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">

      {/* Background */}
      <motion.div className="absolute inset-0 scale-110" style={{ y: bgY }}>
        <img
          src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1920&q=85"
          alt=""
          className="w-full h-full object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-brown/60 via-brown/45 to-brown/70" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-10 bg-white/25" />
            <span className="text-white/50 uppercase tracking-[0.45em] text-[9px]">
              O próximo passo
            </span>
            <div className="h-px w-10 bg-white/25" />
          </div>

          <h2 className="font-serif text-5xl md:text-7xl text-white leading-[1.08]">
            O seu dia mais
            <br />
            <span className="italic font-light" style={{ color: '#d4b896' }}>
              especial começa aqui.
            </span>
          </h2>

          <p className="text-white/55 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Agende uma visita para conhecer a propriedade, sentir a energia do lugar
            e conversar com nossa equipe sobre como tornar o seu casamento único.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          >
            <motion.button
              className="group relative px-12 py-5 overflow-hidden rounded-full"
              style={{
                background: 'rgba(195,163,122,0.15)',
                border: '1px solid rgba(195,163,122,0.5)',
              }}
              whileHover={{ borderColor: 'rgba(195,163,122,1)' }}
            >
              <span className="relative z-10 text-[11px] uppercase tracking-[0.32em] font-semibold text-white group-hover:text-brown transition-colors duration-400">
                Agendar uma Visita
              </span>
              <motion.div
                className="absolute inset-0 origin-bottom"
                style={{ background: '#c3a37a' }}
                initial={{ scaleY: 0 }}
                whileHover={{ scaleY: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.button>

            <motion.button
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/40 hover:text-white/75 transition-colors"
            >
              <Wine size={14} />
              Falar pelo WhatsApp
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// ── Footer mini ───────────────────────────────────────────────────────────────

const WeddingFooter: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <footer className="py-16 px-6 bg-brown">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <img
        src="/logo.png"
        alt="Casarão Vale do Eden"
        className="h-12 w-auto object-contain opacity-70"
        style={{ filter: 'brightness(1.4) contrast(0.9)' }}
      />
      <p className="text-[9px] uppercase tracking-[0.3em] text-white/25 text-center">
        © 2026 Casarão Vale do Eden Reserva · Casamentos Exclusivos
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
);

// ─── Main export ──────────────────────────────────────────────────────────────

export const WeddingModule: React.FC<WeddingModuleProps> = ({ onBack }) => {
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-beige text-brown min-h-screen"
    >
      <WeddingNavbar onBack={onBack} />

      <main>
        <WeddingHero />
        <WeddingManifesto />
        <ChapelSection />
        <WeddingExperiences />
        <WeddingGallery />
        <WeddingTestimonials />
        <WeddingCTA />
      </main>

      <WeddingFooter onBack={onBack} />
    </motion.div>
  );
};
