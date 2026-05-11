import React from 'react';
import { motion } from 'motion/react';
import { Menu, Search, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 w-full z-[500] px-6 py-8 flex items-center justify-between pointer-events-none"
    >
      <div className="flex items-center gap-8 pointer-events-auto">
        <button data-hover="menu" className="p-2 glass rounded-full hover:glass-gold transition-all">
          <Menu size={20} className="text-brown" />
        </button>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
        <h2 className="text-xl font-serif text-brown tracking-widest uppercase text-center leading-none">
          Casarão <br /> <span className="text-[10px] opacity-60">dos Pinheiros</span>
        </h2>
      </div>

      <div className="flex items-center gap-4 pointer-events-auto">
        <button data-hover="perfil" className="p-2 glass rounded-full hover:glass-gold transition-all">
          <User size={20} className="text-brown" />
        </button>
        <button 
          data-hover="reservar"
          className="px-6 py-2 glass-gold rounded-full text-[10px] uppercase tracking-widest font-medium hover:bg-brown hover:text-white transition-all text-brown"
        >
          Book Now
        </button>
      </div>
    </motion.nav>
  );
};
