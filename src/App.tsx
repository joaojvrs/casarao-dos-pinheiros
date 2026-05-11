/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SmoothScroll } from './components/layout/SmoothScroll';
import { CustomCursor } from './components/ui/CustomCursor';
import { PortalLoader } from './components/ui/PortalLoader';
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
import { WeddingModule } from './pages/WeddingModule';

export default function App() {
  const [page, setPage] = useState<'home' | 'wedding'>('home');

  return (
    <SmoothScroll>
      <div className="bg-beige text-brown min-h-screen selection:bg-brown selection:text-white">
        <PortalLoader />
        <CustomCursor />

        <AnimatePresence mode="wait">
          {page === 'wedding' ? (
            <motion.div
              key="wedding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
            >
              <WeddingModule onBack={() => setPage('home')} />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Navbar onWeddingClick={() => setPage('wedding')} />

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

              <footer className="py-20 px-6 border-t border-white/5 bg-black">
                <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
                  <div className="md:col-span-2">
                    <h2 className="font-serif text-4xl text-brown mb-6 italic">Vale do Eden.</h2>
                    <p className="text-brown/60 max-w-sm text-sm">
                      Uma fusão entre a tecnologia de ponta e a harmonia do Vale do Eden.
                      Sua jornada de luxo e reconexão começa aqui.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-gold uppercase tracking-widest text-[10px] font-bold mb-6">Explorar</h3>
                    <ul className="space-y-4 text-sm text-mist/60">
                      <li className="hover:text-gold cursor-pointer transition-colors">Acomodações</li>
                      <li className="hover:text-gold cursor-pointer transition-colors">Gastronomia</li>
                      <li
                        className="hover:text-gold cursor-pointer transition-colors"
                        onClick={() => setPage('wedding')}
                      >
                        Casamentos
                      </li>
                      <li className="hover:text-gold cursor-pointer transition-colors">Reservas</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-gold uppercase tracking-widest text-[10px] font-bold mb-6">Contato</h3>
                    <ul className="space-y-4 text-sm text-mist/60">
                      <li className="hover:text-gold cursor-pointer transition-colors">Instagram</li>
                      <li className="hover:text-gold cursor-pointer transition-colors">WhatsApp</li>
                      <li className="hover:text-gold cursor-pointer transition-colors">Privacidade</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-mist/20">
                  <span>© 2026 Casarão Vale do Eden Reserva. All rights Reserved.</span>
                  <span>Made with Visionary Excellence</span>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SmoothScroll>
  );
}
