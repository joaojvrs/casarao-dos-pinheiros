import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { Menu, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 72);
  });

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 w-full z-[500] pointer-events-none"
    >
      {/* Glass background — appears on scroll */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: scrolled ? 'rgba(10,20,18,0.88)' : 'rgba(10,20,18,0)',
          backdropFilter: scrolled ? 'blur(22px)' : 'blur(0px)',
          boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.35)' : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Bottom gold hairline — appears on scroll */}
      <motion.div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        animate={{ opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.55 }}
        style={{
          background: 'linear-gradient(to right, transparent 0%, rgba(195,163,122,0.3) 30%, rgba(195,163,122,0.3) 70%, transparent 100%)',
        }}
      />

      <div className="relative px-6 py-4 flex items-center justify-between pointer-events-auto">

        {/* Left — menu */}
        <motion.button
          data-hover="menu"
          className="flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300"
          animate={{
            borderColor: scrolled ? 'rgba(195,163,122,0.25)' : 'rgba(255,255,255,0.15)',
          }}
          whileHover={{ borderColor: 'rgba(195,163,122,0.6)', backgroundColor: 'rgba(195,163,122,0.08)' }}
          transition={{ duration: 0.3 }}
        >
          <Menu size={16} className="text-white/75" />
        </motion.button>

        {/* Center — logo */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          animate={{ scale: scrolled ? 0.78 : 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Warm halo behind logo — always present, subtle */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: '-50%',
              background: 'radial-gradient(circle at 50% 50%, rgba(195,163,122,0.18) 0%, transparent 65%)',
              filter: 'blur(20px)',
            }}
          />
          <img
            src="/logo.png"
            alt="Casarão Vale do Eden Reserva"
            className="relative h-14 w-auto object-contain"
            style={{
              mixBlendMode: 'screen',
              opacity: 0.94,
              filter: 'brightness(1.06) contrast(1.04)',
            }}
          />
        </motion.div>

        {/* Right — user + reservar */}
        <div className="flex items-center gap-3">
          <motion.button
            data-hover="perfil"
            className="flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300"
            animate={{
              borderColor: scrolled ? 'rgba(195,163,122,0.25)' : 'rgba(255,255,255,0.15)',
            }}
            whileHover={{ borderColor: 'rgba(195,163,122,0.6)', backgroundColor: 'rgba(195,163,122,0.08)' }}
            transition={{ duration: 0.3 }}
          >
            <User size={16} className="text-white/75" />
          </motion.button>

          <motion.button
            data-hover="reservar"
            className="px-5 py-[7px] rounded-full text-[10px] uppercase tracking-widest font-medium border transition-all duration-300"
            animate={{
              borderColor: scrolled ? 'rgba(195,163,122,0.45)' : 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.85)',
            }}
            whileHover={{
              borderColor: 'rgba(195,163,122,0.8)',
              backgroundColor: 'rgba(195,163,122,0.12)',
              color: 'rgb(195,163,122)',
            }}
            transition={{ duration: 0.3 }}
          >
            Book Now
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};
