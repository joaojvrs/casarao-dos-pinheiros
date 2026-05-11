import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export const FinalSection: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.9, 0.95], [0, 1]);
  const scale = useTransform(scrollYProgress, [0.9, 1], [0.8, 1]);

  return (
    <section className="h-screen bg-beige flex items-center justify-center relative overflow-hidden">
      {/* Background Particles Pattern */}
      <div className="absolute inset-0 z-0 opacity-40">
        <svg width="100%" height="100%" className="fill-none stroke-brown/10 stroke-[0.5]">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 text-center px-6">
        <motion.div
           style={{ opacity, scale }}
           className="space-y-12"
        >
          <h2 className="font-serif text-5xl md:text-8xl lg:text-9xl italic text-brown font-light">
            Existe um lugar onde o <br />
            <motion.span 
               animate={{ opacity: [0.4, 0.8, 0.4] }} 
               transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
               className="font-bold text-brown"
            >
              tempo desacelera.
            </motion.span>
          </h2>

          <div className="h-px w-24 bg-brown/20 mx-auto" />

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button 
              data-hover="reservar"
              className="px-20 py-6 glass-gold rounded-full text-xs uppercase tracking-[0.5em] font-bold hover:bg-brown hover:text-white transition-all group overflow-hidden relative text-brown border border-brown/10"
            >
              <span className="relative z-10">Reservar sua experiência</span>
              <div className="absolute inset-0 bg-brown/5 animate-pulse pointer-events-none" />
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Finishing gradient */}
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};
