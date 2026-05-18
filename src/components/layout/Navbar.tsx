import React, { useMemo, useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { BedDouble, ClipboardList, ConciergeBell, CreditCard, KeyRound, Menu, ShieldCheck, Sparkles, User, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { AppPage } from '../../types/navigation';

interface NavbarProps {
  onWeddingClick?: () => void;
  onGuestClick?: () => void;
  onBookingClick?: () => void;
  onNavigate?: (page: AppPage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onWeddingClick, onGuestClick, onBookingClick, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { authenticated, role, permissions } = useAuth();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 72);
  });

  const hasTeamAccess = useMemo(() => {
    if (role === 'visitor' || role === 'guest') return false;
    if (role === 'master' || role === 'admin') return true;
    return Object.values(permissions).some(Boolean);
  }, [permissions, role]);

  const hasHRAccess = useMemo(
    () => ['master', 'admin', 'manager'].includes(role) || Boolean(permissions.hr),
    [role, permissions],
  );

  const hasHousekeepingAccess = useMemo(
    () => ['master', 'admin', 'manager', 'housekeeping'].includes(role) || Boolean(permissions.housekeeping),
    [role, permissions],
  );

  const hasFrontDeskAccess = useMemo(
    () => ['master', 'admin', 'manager', 'attendant'].includes(role) || Boolean(permissions.bookings) || Boolean(permissions.guests),
    [role, permissions],
  );

  const hasFinancialAccess = useMemo(
    () => ['master', 'admin', 'manager'].includes(role) || Boolean(permissions.payments),
    [role, permissions],
  );

  const hasGuestPortalAccess = useMemo(() => (
    role === 'guest' || role === 'master' || role === 'admin' || role === 'manager'
  ), [role]);

  const handleNavigate = (page: AppPage) => {
    setMenuOpen(false);
    if (page === 'booking') onBookingClick?.();
    else if (page === 'auth') onGuestClick?.();
    else onNavigate?.(page);
  };

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
        <div className="relative">
          <motion.button
            onClick={() => setMenuOpen(open => !open)}
            data-hover="menu"
            className="flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300"
            animate={{
              borderColor: scrolled ? 'rgba(195,163,122,0.25)' : 'rgba(255,255,255,0.15)',
            }}
            whileHover={{ borderColor: 'rgba(195,163,122,0.6)', backgroundColor: 'rgba(195,163,122,0.08)' }}
            transition={{ duration: 0.3 }}
          >
            {menuOpen ? <X size={16} className="text-white/75" /> : <Menu size={16} className="text-white/75" />}
          </motion.button>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="absolute left-0 top-12 w-72 overflow-hidden rounded-xl border border-white/12 bg-[#101815]/95 p-2 shadow-2xl backdrop-blur-xl"
            >
              <div className="border-b border-white/10 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#c3a37a]">Menu</p>
                <p className="mt-1 text-xs text-white/45">{authenticated ? 'Sua conta esta ativa.' : 'Acesse sua conta para personalizar a experiencia.'}</p>
              </div>

              <div className="py-2">
                <button onClick={() => handleNavigate('booking')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
                  <BedDouble size={16} className="text-[#c3a37a]" />
                  Reservas
                </button>
                {hasGuestPortalAccess && (
                  <button onClick={() => handleNavigate('guest')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
                    <Sparkles size={16} className="text-[#c3a37a]" />
                    Portal do hospede
                  </button>
                )}
                {hasHRAccess && (
                  <button onClick={() => handleNavigate('hr')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
                    <Users size={16} className="text-[#c3a37a]" />
                    RH & Escalas
                  </button>
                )}
                {hasFrontDeskAccess && (
                  <button onClick={() => handleNavigate('frontdesk')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
                    <ConciergeBell size={16} className="text-[#c3a37a]" />
                    Recepção
                  </button>
                )}
                {hasHousekeepingAccess && (
                  <button onClick={() => handleNavigate('housekeeping')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
                    <ClipboardList size={16} className="text-[#c3a37a]" />
                    Governança
                  </button>
                )}
                {hasFinancialAccess && (
                  <button onClick={() => handleNavigate('financial')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
                    <CreditCard size={16} className="text-[#c3a37a]" />
                    Financeiro
                  </button>
                )}
                <button onClick={() => handleNavigate('auth')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/72 transition hover:bg-white/8 hover:text-white">
                  <KeyRound size={16} className="text-[#c3a37a]" />
                  {authenticated ? 'Minha conta' : 'Entrar'}
                </button>
              </div>
            </motion.div>
          )}
        </div>

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

        {/* Right — casamentos + user + reservar */}
        <div className="flex items-center gap-3">
          {hasTeamAccess && (
            <motion.button
              onClick={() => handleNavigate('operations')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-[7px] rounded-full text-[10px] uppercase tracking-widest font-medium border transition-all duration-300"
              animate={{
                borderColor: scrolled ? 'rgba(195,163,122,0.35)' : 'rgba(255,255,255,0.18)',
                color: 'rgba(195,163,122,0.9)',
              }}
              whileHover={{
                borderColor: 'rgba(195,163,122,0.8)',
                backgroundColor: 'rgba(195,163,122,0.12)',
                color: 'rgb(195,163,122)',
              }}
              transition={{ duration: 0.3 }}
            >
              <ShieldCheck size={13} />
              Acesso da equipe
            </motion.button>
          )}

          {onWeddingClick && (
            <motion.button
              onClick={onWeddingClick}
              className="hidden md:flex items-center gap-1.5 px-4 py-[7px] rounded-full text-[10px] uppercase tracking-widest font-medium border transition-all duration-300"
              animate={{
                borderColor: scrolled ? 'rgba(195,163,122,0.2)' : 'rgba(255,255,255,0.1)',
                color: 'rgba(195,163,122,0.75)',
              }}
              whileHover={{
                borderColor: 'rgba(195,163,122,0.65)',
                color: 'rgb(195,163,122)',
                backgroundColor: 'rgba(195,163,122,0.08)',
              }}
              transition={{ duration: 0.3 }}
            >
              <span style={{ fontSize: 9 }}>✦</span>
              Casamentos
            </motion.button>
          )}

          <motion.button
            onClick={onGuestClick}
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
            onClick={onBookingClick}
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
            Reservar
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};
