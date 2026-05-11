import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Church, Heart, ArrowRight } from 'lucide-react';

interface WeddingTeaserProps {
  onWeddingClick: () => void;
}

const PILLARS = [
  { Icon: Church, label: 'Capela de Pedras', sub: 'Cerimônia íntima na natureza' },
  { Icon: Heart, label: 'Experiências Exclusivas', sub: 'MasterChef, spa & muito mais' },
  { Icon: ArrowRight, label: 'Memórias Eternas', sub: 'O dia mais especial da sua vida' },
];

export const WeddingTeaser: React.FC<WeddingTeaserProps> = ({ onWeddingClick }) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax background */}
      <motion.div className="absolute inset-0 scale-110" style={{ y: imgY }}>
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=85"
          alt="Casamentos no Vale do Eden — Chapel de Pedras"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-black/70 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(195,163,122,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 text-center px-6 py-32 w-full max-w-5xl mx-auto"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: '-80px' }}
          className="flex items-center justify-center gap-4 mb-10"
        >
          <div className="h-px w-12" style={{ background: 'rgba(195,163,122,0.4)' }} />
          <span
            className="uppercase tracking-[0.5em] text-[9px] font-bold"
            style={{ color: 'rgba(195,163,122,0.75)' }}
          >
            Casamentos · Vale do Eden Reserva
          </span>
          <div className="h-px w-12" style={{ background: 'rgba(195,163,122,0.4)' }} />
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 60, filter: 'blur(14px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 2, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: '-80px' }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[1.06] mb-8"
        >
          Celebre o amor <br />
          <span className="italic font-light" style={{ color: '#d4b896' }}>
            onde a natureza abraça
          </span>
          <br />
          cada momento.
        </motion.h2>

        {/* Sub-copy */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-white/55 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-14"
        >
          Nossa Chapel de Pedras, inserida na natureza preservada do Vale do Eden,
          é o cenário mais exclusivo para o dia mais importante da sua história.
        </motion.p>

        {/* Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-14"
        >
          {PILLARS.map(({ Icon, label, sub }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 + i * 0.12 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div
                className="w-10 h-10 flex items-center justify-center rounded-xl mb-1"
                style={{ background: 'rgba(195,163,122,0.15)', border: '1px solid rgba(195,163,122,0.25)' }}
              >
                <Icon size={16} style={{ color: '#c3a37a' }} />
              </div>
              <span className="text-white/80 text-xs font-semibold tracking-wide">{label}</span>
              <span className="text-white/35 text-[10px] tracking-wide">{sub}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            onClick={onWeddingClick}
            className="group relative px-12 py-5 overflow-hidden rounded-full"
            style={{ border: '1px solid rgba(195,163,122,0.5)' }}
            whileHover={{ borderColor: 'rgba(195,163,122,1)' }}
          >
            <span className="relative z-10 text-[11px] uppercase tracking-[0.3em] font-semibold text-white group-hover:text-brown transition-colors duration-400 flex items-center gap-3">
              Descobrir o Módulo de Casamentos
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <motion.div
              className="absolute inset-0 origin-left"
              style={{ background: '#c3a37a' }}
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.button>
        </motion.div>

        {/* Accent quote */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.9 }}
          viewport={{ once: true }}
          className="mt-14 font-serif italic text-white/25 text-sm"
        >
          "O lugar onde o amor encontra a eternidade."
        </motion.p>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-beige to-transparent z-10 pointer-events-none" />
    </section>
  );
};
