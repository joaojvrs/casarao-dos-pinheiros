import { useState, lazy, Suspense } from 'react';
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
import type { GuestOrder, HKRequest } from './types/portal';

const WeddingModule = lazy(() => import('./pages/WeddingModule').then(m => ({ default: m.WeddingModule })));
const GuestPortal = lazy(() => import('./pages/GuestPortal').then(m => ({ default: m.GuestPortal })));
const AttendantPortal = lazy(() => import('./pages/AttendantPortal').then(m => ({ default: m.AttendantPortal })));

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-beige">
    <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const [page, setPage] = useState<'home' | 'wedding' | 'guest' | 'attendant'>('home');
  const [splashDone, setSplashDone] = useState(false);

  const [orders, setOrders] = useState<GuestOrder[]>([]);
  const [hkRequests, setHKRequests] = useState<HKRequest[]>([]);
  const [frigobarConsumed, setFrigobarConsumed] = useState<Record<string, number>>({});

  const addOrder = (order: GuestOrder) => setOrders(prev => [order, ...prev]);

  const updateOrderStatus = (id: string, status: GuestOrder['status']) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

  const updatePaymentStatus = (id: string, paymentStatus: GuestOrder['paymentStatus']) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus } : o));

  const addHKRequest = (req: HKRequest) => setHKRequests(prev => [req, ...prev]);

  const updateHKStatus = (id: string, status: HKRequest['status']) =>
    setHKRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));

  return (
    <SmoothScroll>
      <div className="bg-beige text-brown min-h-screen selection:bg-brown selection:text-white font-sans font-light">
        {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
        <PortalLoader />
        <CustomCursor />

        <AnimatePresence mode="wait">
          {page === 'wedding' ? (
            <motion.div key="wedding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
              <Suspense fallback={<Spinner />}>
                <WeddingModule onBack={() => setPage('home')} />
              </Suspense>
            </motion.div>

          ) : page === 'guest' ? (
            <motion.div key="guest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
              <Suspense fallback={<Spinner />}>
                <GuestPortal
                  onBack={() => setPage('home')}
                  onPlaceOrder={addOrder}
                  onHKRequest={addHKRequest}
                  frigobarConsumed={frigobarConsumed}
                  onFrigobarChange={setFrigobarConsumed}
                />
              </Suspense>
            </motion.div>

          ) : page === 'attendant' ? (
            <motion.div key="attendant" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
              <Suspense fallback={<Spinner />}>
                <AttendantPortal
                  onBack={() => setPage('home')}
                  orders={orders}
                  onUpdateOrderStatus={updateOrderStatus}
                  onUpdatePaymentStatus={updatePaymentStatus}
                  hkRequests={hkRequests}
                  onUpdateHKStatus={updateHKStatus}
                  frigobarConsumed={frigobarConsumed}
                />
              </Suspense>
            </motion.div>

          ) : (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
              <Navbar onWeddingClick={() => setPage('wedding')} onGuestClick={() => setPage('guest')} />
              <main>
                <Hero onWeddingClick={() => setPage('wedding')} />
                <Accommodations />
                <Experiences />
                <SensoryMap />
                <Gallery />
                <WeddingTeaser onWeddingClick={() => setPage('wedding')} />
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
                      <li className="hover:text-gold cursor-pointer transition-colors duration-300" onClick={() => setPage('wedding')}>Casamentos</li>
                      <li className="hover:text-gold cursor-pointer transition-colors duration-300">Reservas</li>
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
                  <button onClick={() => setPage('attendant')} className="text-brown/20 hover:text-brown/50 transition-colors duration-300">
                    Área da Equipe
                  </button>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SmoothScroll>
  );
}
