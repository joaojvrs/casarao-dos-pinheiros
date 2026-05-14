import React, { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Church, Heart } from 'lucide-react';

interface WeddingTeaserProps {
  onWeddingClick: () => void;
}

const CHAPEL_IMAGE = '/casamento/foto%20capela%20retangular.png';

const PILLARS = [
  { Icon: Church, label: 'Capela de Pedras', sub: 'Cerimonia intima na natureza' },
  { Icon: Heart, label: 'Experiencias Exclusivas', sub: 'Gastronomia, bem-estar e cuidado' },
  { Icon: ArrowRight, label: 'Memorias Eternas', sub: 'Um dia desenhado para emocionar' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export const WeddingTeaser: React.FC<WeddingTeaserProps> = memo(({ onWeddingClick }) => {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.85, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brown">
      <img
        src={CHAPEL_IMAGE}
        alt="Capela de Pedras do Casarao Vale do Eden"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/42 to-black/72 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(195,163,122,0.10),transparent_58%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-beige to-transparent pointer-events-none" />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ staggerChildren: reduceMotion ? 0 : 0.08 }}
        className="relative z-10 text-center px-6 py-28 w-full max-w-5xl mx-auto"
      >
        <motion.div
          variants={fadeUp}
          transition={transition}
          className="flex items-center justify-center gap-4 mb-10"
        >
          <div className="h-px w-10 bg-gold/45" />
          <span className="uppercase tracking-[0.5em] text-[9px] font-bold text-gold/80">
            Casamentos · Vale do Eden Reserva
          </span>
          <div className="h-px w-10 bg-gold/45" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          transition={transition}
          className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[1.06] mb-8"
        >
          Celebre o amor <br />
          <span className="italic font-light text-[#d4b896]">onde a natureza abraca</span>
          <br />
          cada momento.
        </motion.h2>

        <motion.p
          variants={fadeUp}
          transition={transition}
          className="text-white/60 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-14"
        >
          Nossa Capela de Pedras, inserida na natureza preservada do Vale do Eden,
          e o cenario mais exclusivo para o dia mais importante da sua historia.
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={transition}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-14"
        >
          {PILLARS.map(({ Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gold/15 border border-gold/25">
                <Icon size={16} className="text-gold" />
              </div>
              <span className="text-white/82 text-xs font-semibold tracking-wide">{label}</span>
              <span className="text-white/38 text-[10px] tracking-wide">{sub}</span>
            </div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} transition={transition}>
          <button
            onClick={onWeddingClick}
            className="group relative px-8 sm:px-12 py-5 overflow-hidden rounded-full border border-gold/50 hover:border-gold transition-colors duration-300"
          >
            <span className="relative z-10 text-[10px] sm:text-[11px] uppercase tracking-[0.26em] sm:tracking-[0.3em] font-semibold text-white group-hover:text-brown transition-colors duration-300 flex items-center gap-3">
              Descobrir o Modulo de Casamentos
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
            </span>
            <span className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </button>
        </motion.div>

        <motion.p
          variants={fadeUp}
          transition={transition}
          className="mt-14 font-serif italic text-white/28 text-sm"
        >
          "O lugar onde o amor encontra a eternidade."
        </motion.p>
      </motion.div>
    </section>
  );
});
