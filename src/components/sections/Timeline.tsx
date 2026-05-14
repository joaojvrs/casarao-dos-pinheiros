import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'motion/react';
import { Sunrise, Waves, Moon, Church, Zap, Mountain, Anchor, Sparkles, Fish, UtensilsCrossed } from 'lucide-react';

// All accents drawn from the site palette: gold (#c3a37a), mist (#e8e2d9), forest (#3a6b4a)
const STEPS = [
  {
    id: 1, time: '07:00', icon: Sunrise,
    accent: '#d4a96a', glow: 'rgba(212,169,106,0.14)', glowS: 'rgba(212,169,106,0.30)',
    title: 'Despertar no Silêncio',
    desc: 'Café da manhã ao ar livre enquanto a névoa da manhã abraça a reserva e os pássaros anunciam o dia.',
  },
  {
    id: 2, time: '09:00', icon: Church,
    accent: '#c3a37a', glow: 'rgba(195,163,122,0.13)', glowS: 'rgba(195,163,122,0.28)',
    title: 'Contemplação na Capela',
    desc: 'Visita à linda Capela de Pedras rústicas — um espaço de recolhimento e paz inserido na natureza.',
  },
  {
    id: 3, time: '10:30', icon: Zap,
    accent: '#e8d5b0', glow: 'rgba(232,213,176,0.12)', glowS: 'rgba(232,213,176,0.28)',
    title: 'Aventura de Quadriciclo',
    desc: 'Exploração das trilhas e paisagens da reserva em um passeio cheio de adrenalina e liberdade.',
  },
  {
    id: 10, time: '12:30', icon: UtensilsCrossed,
    accent: '#c8a880', glow: 'rgba(200,168,128,0.14)', glowS: 'rgba(200,168,128,0.32)',
    title: 'Almoço com o MasterChef',
    desc: 'Uma experiência gastronômica exclusiva e intimista. Nosso chef cria um menu especial ao vivo, com ingredientes frescos e sabores que contam a história do lugar.',
  },
  {
    id: 4, time: '13:00', icon: Mountain,
    accent: '#d4cfc8', glow: 'rgba(212,207,200,0.12)', glowS: 'rgba(212,207,200,0.26)',
    title: 'Lagos e Cachoeiras',
    desc: 'Refrescamento nas cachoeiras cristalinas e contemplação dos lagos tranquilos da propriedade.',
  },
  {
    id: 5, time: '15:00', icon: Anchor,
    accent: '#a8b89e', glow: 'rgba(168,184,158,0.13)', glowS: 'rgba(168,184,158,0.28)',
    title: 'Stand-Up Paddle',
    desc: 'Deslize pelas águas em equilíbrio. Atividade leve, divertida e conectada com a natureza.',
  },
  {
    id: 6, time: '17:00', icon: Sparkles,
    accent: '#c3a37a', glow: 'rgba(195,163,122,0.14)', glowS: 'rgba(195,163,122,0.30)',
    title: 'Renovação & Massagem',
    desc: 'Técnicas que aliviam tensões e renovam energias. Bem-estar pleno ao entardecer da reserva.',
  },
  {
    id: 7, time: '19:00', icon: Waves,
    accent: '#8a9e8a', glow: 'rgba(138,158,138,0.12)', glowS: 'rgba(138,158,138,0.26)',
    title: 'Piscinas Aquecidas',
    desc: 'Imersão nas piscinas aquecidas ao entardecer, com temperatura ideal e a natureza ao redor.',
  },
  {
    id: 8, time: '21:00', icon: Fish,
    accent: '#6a8a6a', glow: 'rgba(106,138,106,0.11)', glowS: 'rgba(106,138,106,0.24)',
    title: 'Pesca Noturna',
    desc: 'Tranquilidade à beira do lago. A paciência se transforma em prazer sob o céu estrelado.',
  },
  {
    id: 9, time: '23:00', icon: Moon,
    accent: '#c3a37a', glow: 'rgba(195,163,122,0.11)', glowS: 'rgba(195,163,122,0.24)',
    title: 'Silêncio Profundo',
    desc: 'A floresta respira. O silêncio do Vale do Eden envolve e renova como poucas coisas no mundo.',
  },
] as const;

type Step = typeof STEPS[number];

// Deterministic particles — warm dust and forest motes
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: (i * 37.3 + 13) % 100,
  y: 5 + (i * 29.1 + 7) % 88,
  size: 0.7 + (i % 4) * 0.5,
  delay: (i * 1.4) % 10,
  duration: 8 + (i % 6) * 1.4,
  dy: 26 + (i % 4) * 12,
  dx: ((i % 5) - 2) * 9,
  gold: i % 3 !== 1,
}));

const StepCard: React.FC<{ step: Step; index: number }> = ({ step, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isRight = index % 2 === 0;
  const active = useInView(ref, { margin: '-28% 0px -28% 0px' });
  const Icon = step.icon;

  return (
    <div ref={ref} className="relative flex items-center" style={{ minHeight: 230 }}>

      {/* Ghost time — opposite side, very subtle */}
      <motion.span
        className="absolute font-mono font-bold select-none pointer-events-none hidden md:block"
        style={{
          fontSize: 'clamp(86px, 12vw, 144px)',
          lineHeight: 1,
          color: step.accent,
          WebkitTextStroke: '1px rgba(26,15,10,0.18)',
          textShadow: '0 10px 34px rgba(26,15,10,0.14)',
          top: '50%',
          transform: 'translateY(-50%)',
          ...(isRight ? { left: '4%' } : { right: '4%' }),
        }}
        animate={{ opacity: active ? 0.42 : 0.18 }}
        transition={{ duration: 1 }}
      >
        {step.time}
      </motion.span>

      {/* Center marker — desktop */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center justify-center z-20">
        <motion.div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle, ${step.glow} 0%, transparent 70%)`,
            borderWidth: 1,
            borderStyle: 'solid',
          }}
          animate={{
            scale: active ? 1.12 : 1,
            borderColor: active ? `${step.accent}70` : `${step.accent}20`,
            boxShadow: active
              ? `0 0 18px ${step.glowS}, 0 0 36px ${step.glow}`
              : '0 0 0px transparent',
          }}
          transition={{ duration: 0.8 }}
        >
          <Icon size={17} style={{ color: step.accent }} />
        </motion.div>

        {active && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ border: `1px solid ${step.accent}40` }}
            initial={{ width: 44, height: 44, opacity: 0.6 }}
            animate={{ width: 96, height: 96, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </div>

      {/* Mobile marker */}
      <div
        className="absolute md:hidden z-20"
        style={{ left: '1rem', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <motion.div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: `${step.accent}15`,
            borderWidth: 1,
            borderStyle: 'solid',
          }}
          animate={{
            borderColor: active ? `${step.accent}60` : `${step.accent}20`,
            boxShadow: active ? `0 0 14px ${step.glowS}` : '0 0 0 transparent',
          }}
          transition={{ duration: 0.7 }}
        >
          <Icon size={13} style={{ color: step.accent }} />
        </motion.div>
      </div>

      {/* Desktop card */}
      <div className={`hidden md:flex w-full ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
        <motion.div
          className={`w-5/12 ${isRight ? 'pr-14' : 'pl-14'}`}
          initial={{ opacity: 0, x: isRight ? 75 : -75, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div
            className="relative rounded-2xl overflow-hidden p-8"
            style={{
              background: 'rgba(10,20,18,0.96)',
              backdropFilter: 'blur(28px)',
              borderWidth: 1,
              borderStyle: 'solid',
            }}
            animate={{
              borderColor: active ? `${step.accent}70` : 'rgba(255,255,255,0.14)',
              boxShadow: active
                ? `0 16px 56px rgba(0,0,0,0.28), 0 12px 52px ${step.glow}, 0 0 0 1px ${step.accent}18`
                : '0 12px 36px rgba(0,0,0,0.16)',
            }}
            transition={{ duration: 0.9 }}
          >
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{ opacity: active ? 1 : 0 }}
              transition={{ duration: 0.9 }}
              style={{
                background: `radial-gradient(ellipse at 55% 35%, ${step.glowS.replace(/[\d.]+\)$/, '0.14)')} 0%, transparent 68%)`,
              }}
            />

            <div className="relative z-10">
              <motion.span
                className="inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] mb-4 tracking-widest"
                style={{
                  color: '#fcf9f2',
                  background: `${step.accent}2e`,
                  borderColor: `${step.accent}75`,
                  boxShadow: `0 0 22px ${step.glow}`,
                  textShadow: '0 1px 10px rgba(0,0,0,0.65)',
                }}
                animate={{ opacity: active ? 1 : 0.9 }}
                transition={{ duration: 0.6 }}
              >
                {step.time}
              </motion.span>
              <h3 className="font-serif text-[22px] leading-tight mb-3" style={{ color: 'rgba(252,249,242,0.96)' }}>
                {step.title}
              </h3>
              <motion.div
                className="h-px mb-4"
                initial={{ width: 0 }}
                whileInView={{ width: 44 }}
                transition={{ duration: 0.9, delay: 0.25, ease: 'easeOut' }}
                viewport={{ once: true }}
                style={{ background: `${step.accent}50` }}
              />
              <p className="text-[13px] leading-relaxed max-w-[280px]" style={{ color: 'rgba(232,226,217,0.72)' }}>
                {step.desc}
              </p>
            </div>
          </motion.div>
        </motion.div>
        <div className="w-5/12" />
      </div>

      {/* Mobile card */}
      <motion.div
        className="md:hidden w-full pl-10"
        initial={{ opacity: 0, x: 44, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, margin: '-60px' }}
      >
        <motion.div
          className="relative rounded-xl overflow-hidden p-5"
          style={{
            background: 'linear-gradient(145deg, rgba(7,13,12,0.99) 0%, rgba(15,25,22,0.98) 100%)',
            backdropFilter: 'blur(18px)',
            borderWidth: 1,
            borderStyle: 'solid',
          }}
          animate={{
            borderColor: active ? `${step.accent}82` : 'rgba(195,163,122,0.38)',
            boxShadow: active ? `0 14px 36px rgba(0,0,0,0.34), 0 6px 32px ${step.glow}` : '0 12px 30px rgba(0,0,0,0.28)',
          }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            animate={{ opacity: active ? 1 : 0 }}
            style={{ background: `radial-gradient(ellipse at 50% 30%, ${step.glow} 0%, transparent 70%)` }}
          />
          <div className="relative z-10">
            <span
              className="inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] mb-3 tracking-widest"
              style={{
                color: '#fcf9f2',
                background: `${step.accent}45`,
                borderColor: `${step.accent}a8`,
                boxShadow: `0 0 18px ${step.glow}`,
                textShadow: '0 1px 10px rgba(0,0,0,0.65)',
              }}
            >
              {step.time}
            </span>
            <h3 className="font-serif text-[19px] mb-2 leading-tight" style={{ color: '#fffaf0' }}>
              {step.title}
            </h3>
            <div className="h-px mb-3" style={{ width: 30, background: `${step.accent}48` }} />
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(252,249,242,0.84)' }}>
              {step.desc}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Timeline: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: lineProgress } = useScroll({
    target: stepsRef,
    offset: ['start 85%', 'end 15%'],
  });
  const springLine = useSpring(lineProgress, { stiffness: 55, damping: 22 });
  const lineScaleY = useTransform(springLine, [0, 1], [0, 1]);

  // Atmospheric bloom that drifts as you scroll
  const { scrollYProgress: sectionProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const bloomY = useTransform(sectionProgress, [0, 1], ['0%', '70%']);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ background: '#fcf9f2', paddingBlock: '9rem' }}
    >

      {/* Floating warm dust particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {PARTICLES.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.gold ? 'rgba(195,163,122,0.55)' : 'rgba(26,15,10,0.18)',
            }}
            animate={{
              y: [-p.dy / 2, -p.dy, -p.dy / 2],
              x: [-p.dx / 2, p.dx / 2, -p.dx / 2],
              opacity: [0, 0.55, 0],
            }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Scroll-following warm bloom */}
      <motion.div
        className="absolute inset-x-0 h-[700px] pointer-events-none z-0"
        style={{
          top: bloomY,
          background: 'radial-gradient(ellipse 55% 50% at 50% 50%, rgba(195,163,122,0.055) 0%, transparent 100%)',
        }}
      />

      <div className="relative z-10 container mx-auto px-6">

        {/* Header with logo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: '-60px' }}
          className="max-w-4xl mb-32"
        >
          {/* Logo — used as a section seal */}
          <motion.div
            className="mb-10 relative inline-block"
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            {/* Warm glow halo behind logo */}
            <div
              className="absolute pointer-events-none"
              style={{
                inset: '-40%',
                background: 'radial-gradient(circle at 50% 50%, rgba(195,163,122,0.22) 0%, transparent 65%)',
                filter: 'blur(28px)',
              }}
            />
            <img
              src="/logo.png"
              alt="Casarão Vale do Eden"
              className="relative h-24 w-auto object-contain"
              style={{
                opacity: 0.88,
                filter: 'drop-shadow(0 4px 28px rgba(195,163,122,0.35))',
              }}
            />
          </motion.div>

          <span
            className="uppercase tracking-[0.4em] text-[10px] font-bold mb-5 block"
            style={{ color: '#3a6b4a' }}
          >
            A Jornada
          </span>
          <h2
            className="font-serif text-5xl md:text-7xl font-light leading-[1.1]"
            style={{ color: '#1a0f0a' }}
          >
            Sua vida em{' '}
            <br />
            <span className="italic font-bold" style={{ color: '#c3a37a' }}>
              fluxo constante.
            </span>
          </h2>
          <motion.p
            className="mt-6 text-sm leading-relaxed max-w-sm"
            style={{ color: 'rgba(26,15,10,0.45)' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Do amanhecer ao silêncio da madrugada — uma jornada completa de renovação no coração da natureza.
          </motion.p>
        </motion.div>

        {/* Timeline */}
        <div ref={stepsRef} className="relative">

          {/* Static background line — desktop */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px hidden md:block pointer-events-none"
            style={{ background: 'rgba(26,15,10,0.1)' }}
          />
          {/* Animated progress line — desktop */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 top-0 w-px origin-top hidden md:block pointer-events-none"
            style={{
              scaleY: lineScaleY,
              height: '100%',
              background: 'linear-gradient(to bottom, #d4a96a 0%, #e8d5b0 28%, #a8b89e 58%, #6a8a6a 80%, #c3a37a 100%)',
              filter: 'blur(0.3px)',
            }}
          />

          {/* Static background line — mobile */}
          <div
            className="absolute top-0 bottom-0 w-px md:hidden pointer-events-none"
            style={{ left: '1rem', background: 'rgba(195,163,122,0.07)' }}
          />
          {/* Animated progress line — mobile */}
          <motion.div
            className="absolute top-0 w-px origin-top md:hidden pointer-events-none"
            style={{
              scaleY: lineScaleY,
              height: '100%',
              left: '1rem',
              background: 'linear-gradient(to bottom, #d4a96a 0%, #e8d5b0 28%, #a8b89e 58%, #6a8a6a 80%, #c3a37a 100%)',
            }}
          />

          <div className="space-y-20 md:space-y-28">
            {STEPS.map((step, i) => (
              <StepCard key={step.id} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
