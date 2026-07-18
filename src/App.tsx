import { lazy, Suspense, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { SmoothScroll } from './components/layout/SmoothScroll';
import { CustomCursor } from './components/ui/CustomCursor';
import { PortalLoader } from './components/ui/PortalLoader';
import { SplashScreen } from './components/ui/SplashScreen';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/sections/Hero';
import { Accommodations } from './components/sections/Accommodations';
import { Experiences } from './components/sections/Experiences';
import { SensoryMap } from './components/sections/SensoryMap';
import { Gallery } from './components/sections/Gallery';
import { Timeline } from './components/sections/Timeline';
import { Concierge } from './components/sections/Concierge';
import { FinalSection } from './components/sections/FinalSection';
import { WeddingTeaser } from './components/sections/WeddingTeaser';
import { useAuth } from './contexts/AuthContext';
import { getDefaultRouteForAccess } from './lib/access-routing';
import type { PermissionSet } from './types/auth';
import type { AppPage } from './types/navigation';

const WeddingModule = lazy(() => import('./pages/WeddingModule').then(m => ({ default: m.WeddingModule })));
const GuestPortal = lazy(() => import('./pages/GuestPortal').then(m => ({ default: m.GuestPortal })));
const AttendantPortal = lazy(() => import('./pages/AttendantPortal').then(m => ({ default: m.AttendantPortal })));
const BookingPortal = lazy(() => import('./pages/BookingPortal').then(m => ({ default: m.BookingPortal })));
const AuthPortal = lazy(() => import('./pages/AuthPortal').then(m => ({ default: m.AuthPortal })));
const AccessPortal = lazy(() => import('./pages/AccessPortal').then(m => ({ default: m.AccessPortal })));
const OperationsPortal = lazy(() => import('./pages/OperationsPortal').then(m => ({ default: m.OperationsPortal })));
const FrontDeskPortal = lazy(() => import('./pages/FrontDeskPortal').then(m => ({ default: m.FrontDeskPortal })));
const KitchenPortal = lazy(() => import('./pages/KitchenPortal').then(m => ({ default: m.KitchenPortal })));
const HRPortal = lazy(() => import('./pages/HRPortal').then(m => ({ default: m.HRPortal })));
const HousekeepingPortal = lazy(() => import('./pages/HousekeepingPortal').then(m => ({ default: m.HousekeepingPortal })));
const FinancialPortal = lazy(() => import('./pages/FinancialPortal').then(m => ({ default: m.FinancialPortal })));
const GarcomPortal = lazy(() => import('./pages/GarcomPortal').then(m => ({ default: m.GarcomPortal })));
const SetPasswordPage = lazy(() => import('./pages/SetPasswordPage').then(m => ({ default: m.SetPasswordPage })));

const ROUTES: Record<AppPage, string> = {
  home: '/',
  wedding: '/casamentos',
  guest: '/hospede',
  attendant: '/equipe/atendimento',
  frontdesk: '/equipe/recepcao',
  kitchen: '/equipe/cozinha',
  housekeeping: '/equipe/governanca',
  booking: '/reservas',
  auth: '/login',
  access: '/equipe/acessos',
  operations: '/equipe',
  hr: '/equipe/rh',
  financial: '/equipe/financeiro',
  garcom: '/equipe/garcom',
};

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-beige">
    <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

function Guard({ children, teamOnly = false, guestOnly = false, adminOnly = false, permission, permissionAny }: {
  children: ReactElement;
  teamOnly?: boolean;
  guestOnly?: boolean;
  adminOnly?: boolean;
  permission?: keyof PermissionSet;
  permissionAny?: Array<keyof PermissionSet>;
}) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) return <Spinner />;
  if (!auth.authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (teamOnly && (auth.role === 'visitor' || auth.role === 'guest')) return <Navigate to={getDefaultRouteForAccess(auth.role, auth.permissions)} replace state={{ from: location.pathname }} />;
  if (guestOnly && !['guest', 'master', 'admin', 'manager'].includes(auth.role)) return <Navigate to={getDefaultRouteForAccess(auth.role, auth.permissions)} replace state={{ from: location.pathname }} />;
  if (adminOnly && auth.role !== 'master' && auth.role !== 'admin') return <Navigate to="/equipe" replace />;
  if (permission && auth.role !== 'master' && auth.role !== 'admin' && auth.role !== 'manager' && !auth.permissions[permission]) return <Navigate to="/equipe" replace />;
  if (permissionAny && auth.role !== 'master' && auth.role !== 'admin' && auth.role !== 'manager' && !permissionAny.some(item => auth.permissions[item])) return <Navigate to="/equipe" replace />;

  return children;
}

function HomePage({ navigatePage }: { navigatePage: (page: AppPage) => void }) {
  const navigate = useNavigate();

  // Detecta convite no hash e redireciona
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=invite')) {
      navigate('/definir-senha', { replace: true });
    }
  }, [navigate]);

  return (
    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <Navbar
        onWeddingClick={() => navigatePage('wedding')}
        onGuestClick={() => navigatePage('auth')}
        onBookingClick={() => navigatePage('booking')}
        onNavigate={navigatePage}
      />
      <main>
        <Hero onWeddingClick={() => navigatePage('wedding')} onBookingClick={() => navigatePage('booking')} />
        <Accommodations onBookingClick={() => navigatePage('booking')} />
        <Experiences onBookingClick={() => navigatePage('booking')} />
        <SensoryMap />
        <Gallery />
        <WeddingTeaser onWeddingClick={() => navigatePage('wedding')} />
        <Timeline />
        <Concierge />
        <FinalSection />
      </main>

      <footer className="py-24 px-6 md:px-12 border-t border-black/5 bg-beige">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 text-center md:text-left">
          <div className="md:col-span-2 flex flex-col items-center md:items-start">
            <h2 className="font-serif text-5xl text-brown mb-6 italic tracking-tight">Vale do Eden.</h2>
            <p className="text-brown/70 max-w-sm text-sm leading-relaxed">
              Uma fusão entre a tecnologia de ponta e a harmonia da natureza.
              Sua jornada de luxo e reconexão começa aqui.
            </p>
          </div>
          <div>
            <h3 className="text-gold uppercase tracking-widest text-xs font-semibold mb-8">Explorar</h3>
            <ul className="space-y-4 text-sm text-brown/70">
              <li className="hover:text-gold cursor-pointer transition-colors duration-300">Acomodações</li>
              <li className="hover:text-gold cursor-pointer transition-colors duration-300">Gastronomia</li>
              <li className="hover:text-gold cursor-pointer transition-colors duration-300" onClick={() => navigatePage('wedding')}>Casamentos</li>
              <li className="hover:text-gold cursor-pointer transition-colors duration-300" onClick={() => navigatePage('booking')}>Reservas</li>
            </ul>
          </div>
          <div>
            <h3 className="text-gold uppercase tracking-widest text-xs font-semibold mb-8">Contato</h3>
            <ul className="space-y-4 text-sm text-brown/70">
              <li className="hover:text-gold cursor-pointer transition-colors duration-300">Instagram</li>
              <li className="hover:text-gold cursor-pointer transition-colors duration-300">WhatsApp</li>
              <li className="hover:text-gold cursor-pointer transition-colors duration-300">Privacidade</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs uppercase tracking-widest text-brown/40">
          <span>© 2026 Casarão Vale do Eden. All rights Reserved.</span>
        </div>
      </footer>
    </motion.div>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [frigobarConsumed, setFrigobarConsumed] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const location = useLocation();

  const navigatePage = (page: AppPage) => navigate(ROUTES[page]);
  const onBackHome = () => navigate('/');

  // Room-service orders and housekeeping requests are persisted in the backend and
  // read live by the Attendant Portal. These guest-side callbacks are now no-ops kept
  // only for the Guest Portal's local optimistic UI.
  const noop = () => {};

  return (
    <SmoothScroll>
      <div className="bg-beige text-brown min-h-screen selection:bg-brown selection:text-white font-sans font-light">
        {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
        <PortalLoader />
        <CustomCursor />

        <Suspense fallback={<Spinner />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage navigatePage={navigatePage} />} />
              <Route path="/casamentos" element={<motion.div key="wedding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><WeddingModule onBack={onBackHome} /></motion.div>} />
              <Route path="/reservas" element={<motion.div key="booking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><BookingPortal onBack={onBackHome} /></motion.div>} />
              <Route path="/login" element={<motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><AuthPortal onBack={onBackHome} /></motion.div>} />
              <Route path="/hospede" element={<Guard guestOnly><motion.div key="guest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><GuestPortal onBack={onBackHome} onPlaceOrder={noop} onHKRequest={noop} frigobarConsumed={frigobarConsumed} onFrigobarChange={setFrigobarConsumed} /></motion.div></Guard>} />
              <Route path="/equipe" element={<Guard teamOnly><motion.div key="operations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><OperationsPortal onBack={onBackHome} onNavigate={navigatePage} /></motion.div></Guard>} />
              <Route path="/equipe/acessos" element={<Guard teamOnly adminOnly><motion.div key="access" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><AccessPortal onBack={() => navigate('/equipe')} /></motion.div></Guard>} />
              <Route path="/equipe/atendimento" element={<Guard teamOnly permission="roomService"><motion.div key="attendant" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><AttendantPortal onBack={() => navigate('/equipe')} frigobarConsumed={frigobarConsumed} /></motion.div></Guard>} />
              <Route path="/equipe/recepcao" element={<Guard teamOnly permissionAny={['bookings', 'guests']}><motion.div key="frontdesk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><FrontDeskPortal onBack={() => navigate('/equipe')} /></motion.div></Guard>} />
              <Route path="/equipe/cozinha" element={<Guard teamOnly permission="kitchen"><motion.div key="kitchen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><KitchenPortal onBack={() => navigate('/equipe')} /></motion.div></Guard>} />
              <Route path="/equipe/governanca" element={<Guard teamOnly permission="housekeeping"><motion.div key="housekeeping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><HousekeepingPortal onBack={() => navigate('/equipe')} /></motion.div></Guard>} />
              <Route path="/equipe/rh" element={<Guard teamOnly permission="hr"><motion.div key="hr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><HRPortal onBack={() => navigate('/equipe')} /></motion.div></Guard>} />
              <Route path="/equipe/financeiro" element={<Guard teamOnly permission="payments"><motion.div key="financial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><FinancialPortal onBack={() => navigate('/equipe')} /></motion.div></Guard>} />
              <Route path="/equipe/garcom" element={<Guard teamOnly permission="kitchen"><motion.div key="garcom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><GarcomPortal onBack={() => navigate('/equipe')} /></motion.div></Guard>} />
              <Route path="/definir-senha" element={<motion.div key="set-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><SetPasswordPage /></motion.div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
    </SmoothScroll>
  );
}
