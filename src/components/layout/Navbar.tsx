import React, { useMemo, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { Check, LogOut, Mail, Phone, Save, ShieldCheck, Sparkles, User, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { signOutUser, updateCurrentUserProfile } from '../../services/auth';
import type { AppPage } from '../../types/navigation';

interface NavbarProps {
  onWeddingClick?: () => void;
  onGuestClick?: () => void;
  onBookingClick?: () => void;
  onNavigate?: (page: AppPage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onWeddingClick, onGuestClick, onBookingClick, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const auth = useAuth();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', y => setScrolled(y > 72));

  const hasTeamAccess = useMemo(() => {
    if (auth.role === 'visitor' || auth.role === 'guest') return false;
    if (auth.role === 'master' || auth.role === 'admin') return true;
    return Object.values(auth.permissions).some(Boolean);
  }, [auth.permissions, auth.role]);

  const hasGuestPortalAccess = useMemo(
    () => auth.authenticated && ['guest', 'master', 'admin', 'manager'].includes(auth.role),
    [auth.authenticated, auth.role],
  );

  const handleNavigate = (page: AppPage) => {
    setAccountOpen(false);
    if (page === 'booking') onBookingClick?.();
    else if (page === 'auth') onGuestClick?.();
    else onNavigate?.(page);
  };

  const openAccount = () => {
    if (!auth.authenticated) {
      onGuestClick?.();
      return;
    }

    setProfileEmail(String(auth.user?.email || ''));
    setProfileName(String(auth.user?.user_metadata?.full_name || ''));
    setProfilePhone(String(auth.user?.user_metadata?.phone || ''));
    setProfileMessage('');
    setProfileError('');
    setAccountOpen(open => !open);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');
    try {
      await updateCurrentUserProfile({ email: profileEmail, fullName: profileName, phone: profilePhone });
      await auth.refreshAccess();
      setProfileMessage('Dados atualizados. Se o e-mail mudou, verifique a caixa de entrada.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Nao foi possivel atualizar sua conta.');
    } finally {
      setProfileSaving(false);
    }
  };

  const logout = async () => {
    setProfileSaving(true);
    setProfileError('');
    try {
      await signOutUser();
      await auth.refreshAccess();
      setAccountOpen(false);
      onNavigate?.('home');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Nao foi possivel sair da conta.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed left-0 top-0 z-[500] w-full"
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: scrolled ? 'rgba(10,20,18,0.88)' : 'rgba(10,20,18,0)',
          backdropFilter: scrolled ? 'blur(22px)' : 'blur(0px)',
          boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.35)' : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-px"
        animate={{ opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.55 }}
        style={{
          background: 'linear-gradient(to right, transparent 0%, rgba(195,163,122,0.3) 30%, rgba(195,163,122,0.3) 70%, transparent 100%)',
        }}
      />

      <div className="pointer-events-auto relative flex items-center justify-between px-6 py-4">
        <div className="w-9" />

        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          animate={{ scale: scrolled ? 0.78 : 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="pointer-events-none absolute"
            style={{
              inset: '-50%',
              background: 'radial-gradient(circle at 50% 50%, rgba(195,163,122,0.18) 0%, transparent 65%)',
              filter: 'blur(20px)',
            }}
          />
          <img
            src="/logo.png"
            alt="Casarao Vale do Eden Reserva"
            className="relative h-14 w-auto object-contain"
            style={{ mixBlendMode: 'screen', opacity: 0.94, filter: 'brightness(1.06) contrast(1.04)' }}
          />
        </motion.div>

        <div className="flex items-center gap-3">
          {hasTeamAccess && (
            <motion.button
              onClick={() => handleNavigate('operations')}
              className="hidden items-center gap-1.5 rounded-full border px-4 py-[7px] text-[10px] font-medium uppercase tracking-widest transition-all duration-300 sm:flex"
              animate={{
                borderColor: scrolled ? 'rgba(195,163,122,0.35)' : 'rgba(255,255,255,0.18)',
                color: 'rgba(195,163,122,0.9)',
              }}
              whileHover={{ borderColor: 'rgba(195,163,122,0.8)', backgroundColor: 'rgba(195,163,122,0.12)', color: 'rgb(195,163,122)' }}
              transition={{ duration: 0.3 }}
            >
              <ShieldCheck size={13} />
              Acesso da equipe
            </motion.button>
          )}

          {onWeddingClick && (
            <motion.button
              onClick={onWeddingClick}
              className="hidden items-center gap-1.5 rounded-full border px-4 py-[7px] text-[10px] font-medium uppercase tracking-widest transition-all duration-300 md:flex"
              animate={{
                borderColor: scrolled ? 'rgba(195,163,122,0.2)' : 'rgba(255,255,255,0.1)',
                color: 'rgba(195,163,122,0.75)',
              }}
              whileHover={{ borderColor: 'rgba(195,163,122,0.65)', color: 'rgb(195,163,122)', backgroundColor: 'rgba(195,163,122,0.08)' }}
              transition={{ duration: 0.3 }}
            >
              <span style={{ fontSize: 9 }}>*</span>
              Casamentos
            </motion.button>
          )}

          {hasGuestPortalAccess && (
            <motion.button
              onClick={() => handleNavigate('guest')}
              className="hidden items-center gap-1.5 rounded-full border px-4 py-[7px] text-[10px] font-medium uppercase tracking-widest transition-all duration-300 sm:flex"
              animate={{
                borderColor: scrolled ? 'rgba(195,163,122,0.35)' : 'rgba(255,255,255,0.16)',
                color: 'rgba(255,255,255,0.84)',
              }}
              whileHover={{ borderColor: 'rgba(195,163,122,0.75)', backgroundColor: 'rgba(195,163,122,0.12)', color: 'rgb(195,163,122)' }}
              transition={{ duration: 0.3 }}
            >
              <Sparkles size={13} />
              Portal do hospede
            </motion.button>
          )}

          <div className="relative">
            <motion.button
              onClick={openAccount}
              data-hover="perfil"
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300"
              animate={{ borderColor: scrolled ? 'rgba(195,163,122,0.25)' : 'rgba(255,255,255,0.15)' }}
              whileHover={{ borderColor: 'rgba(195,163,122,0.6)', backgroundColor: 'rgba(195,163,122,0.08)' }}
              transition={{ duration: 0.3 }}
            >
              {accountOpen ? <X size={16} className="text-white/75" /> : <User size={16} className="text-white/75" />}
            </motion.button>

            {accountOpen && auth.authenticated && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 top-12 w-[min(88vw,320px)] overflow-hidden rounded-xl border border-white/12 bg-[#101815]/96 p-4 text-white shadow-2xl backdrop-blur-xl"
              >
                <div className="mb-4 border-b border-white/10 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#c3a37a]">Minha conta</p>
                  <p className="mt-1 flex items-center gap-2 truncate text-xs text-white/55"><Mail size={13} />{auth.user?.email}</p>
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35"><Mail size={12} />E-mail</span>
                    <input type="email" value={profileEmail} onChange={event => setProfileEmail(event.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/8 px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c3a37a]/70" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35"><User size={12} />Nome</span>
                    <input value={profileName} onChange={event => setProfileName(event.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/8 px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c3a37a]/70" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35"><Phone size={12} />Telefone</span>
                    <input value={profilePhone} onChange={event => setProfilePhone(event.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/8 px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c3a37a]/70" />
                  </label>
                </div>

                {profileMessage && <p className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-2 text-xs text-emerald-100"><Check size={13} />{profileMessage}</p>}
                {profileError && <p className="mt-3 rounded-lg border border-red-400/25 bg-red-400/10 p-2 text-xs text-red-100">{profileError}</p>}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={saveProfile} disabled={profileSaving} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#c3a37a] text-xs font-bold uppercase tracking-[0.16em] text-[#1a0f0a] transition hover:bg-amber-200 disabled:opacity-60">
                    <Save size={13} />Salvar
                  </button>
                  <button onClick={logout} disabled={profileSaving} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/12 text-xs font-bold uppercase tracking-[0.16em] text-white/70 transition hover:border-red-300/50 hover:text-red-100 disabled:opacity-60">
                    <LogOut size={13} />Sair
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <motion.button
            onClick={onBookingClick}
            data-hover="reservar"
            className="rounded-full border px-5 py-[7px] text-[10px] font-medium uppercase tracking-widest transition-all duration-300"
            animate={{ borderColor: scrolled ? 'rgba(195,163,122,0.45)' : 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }}
            whileHover={{ borderColor: 'rgba(195,163,122,0.8)', backgroundColor: 'rgba(195,163,122,0.12)', color: 'rgb(195,163,122)' }}
            transition={{ duration: 0.3 }}
          >
            Reservar
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};
