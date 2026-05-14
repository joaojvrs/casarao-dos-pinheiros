import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export const FinalSection: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.9, 0.95], [0, 1]);
  const scale = useTransform(scrollYProgress, [0.9, 1], [0.8, 1]);

  return (
    <section className="h-screen bg-pine flex items-center justify-center relative overflow-hidden">
      {/* Background Particles Pattern */}
      <div className="absolute inset-0 z-0 opacity-55">
        <svg width="100%" height="100%" className="fill-none stroke-white/10 stroke-[0.5]">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(195,163,122,0.18),transparent_62%)]" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />

      <div className="relative z-10 text-center px-6">
        <motion.div
           style={{ opacity, scale }}
           className="space-y-12"
        >
          <h2 className="font-serif text-5xl md:text-8xl lg:text-9xl italic text-white font-light drop-shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
            Existe um lugar onde o <br />
            <motion.span 
               animate={{ opacity: [0.78, 1, 0.78] }} 
               transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
               className="font-bold text-gold"
            >
              tempo desacelera.
            </motion.span>
          </h2>

          <div className="h-px w-24 bg-gold/45 mx-auto" />

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button 
              data-hover="reservar"
              className="px-10 sm:px-20 py-6 rounded-full text-xs uppercase tracking-[0.34em] sm:tracking-[0.5em] font-bold hover:bg-gold hover:text-brown transition-all group overflow-hidden relative text-white border border-gold/65 bg-black/35 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-md"
            >
              <span className="relative z-10">Reservar sua experiência</span>
              <div className="absolute inset-0 bg-gold/10 animate-pulse pointer-events-none" />
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Finishing gradient */}
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black/45 to-transparent" />
    </section>
  );
};
