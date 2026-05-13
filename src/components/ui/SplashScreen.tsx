import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 900);
    }, 4500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: '#0d0a07' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Vignette radial */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
            }}
          />

          {/* Linha decorativa topo */}
          <motion.div
            className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-4"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#c3a37a]" />
            <span
              className="text-[#c3a37a] uppercase tracking-[0.5em] text-[9px] font-medium"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Serra Gaúcha
            </span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-[#c3a37a]" />
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 relative"
          >
            {/* Glow atrás da logo */}
            <div
              className="absolute inset-0 -m-8 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(195,163,122,0.18) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
            <img
              src="/logo.png"
              alt="Casarão Vale do Eden"
              className="relative w-40 h-40 object-contain drop-shadow-2xl"
              style={{ filter: 'brightness(1.1) sepia(0.15)' }}
            />
          </motion.div>

          {/* Nome principal */}
          <motion.div
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.4, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-3"
          >
            <h1
              className="text-5xl md:text-6xl text-white leading-tight"
              style={{ fontFamily: 'Playfair Display, serif', fontWeight: 400 }}
            >
              Casarão
            </h1>
            <h2
              className="text-3xl md:text-4xl text-[#c3a37a] italic font-light mt-1"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Vale do Eden Reserva
            </h2>
          </motion.div>

          {/* Divisor ornamental */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 my-5"
          >
            <div className="h-px w-16 bg-[#c3a37a]/40" />
            <span className="text-[#c3a37a]/60 text-base">✦</span>
            <div className="h-px w-16 bg-[#c3a37a]/40" />
          </motion.div>

          {/* Frase impactante */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 2.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-sm px-6"
            style={{
              fontFamily: 'Outfit, sans-serif',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.82rem',
              letterSpacing: '0.12em',
              lineHeight: 1.8,
              textTransform: 'uppercase',
            }}
          >
            Onde a natureza sussurra <br />e o tempo pertence a você
          </motion.p>

          {/* Barra de progresso */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 0.8 }}
          >
            <div className="w-32 h-px bg-white/10 relative overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-y-0 left-0 bg-[#c3a37a]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, delay: 2.5, ease: 'linear' }}
              />
            </div>
            <span
              className="text-white/20 uppercase tracking-[0.4em]"
              style={{ fontSize: '8px', fontFamily: 'Outfit, sans-serif' }}
            >
              Preparando sua experiência
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
