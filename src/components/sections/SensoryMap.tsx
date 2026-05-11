import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Compass, Waves, Mountain } from 'lucide-react';

const MAP_POINTS = [
  { id: '1', name: 'O Casarão', x: '45%', y: '40%', type: 'main', icon: Compass, description: 'Coração histórico e tecnológico do refúgio.' },
  { id: '2', name: 'Cachoeira Alta', x: '70%', y: '25%', type: 'natural', icon: Waves, description: 'Fluxo contínuo de energia e águas cristalinas.' },
  { id: '3', name: 'Cabanas Norte', x: '30%', y: '60%', type: 'stay', icon: Mountain, description: 'Imersão na floresta primária.' },
  { id: '4', name: 'Mirante Tech', x: '80%', y: '70%', type: 'tech', icon: MapPin, description: 'O ponto mais alto com conexão ultrarrápida.' },
];

export const SensoryMap: React.FC = () => {
  const [activePoint, setActivePoint] = useState<typeof MAP_POINTS[0] | null>(null);

  return (
    <section className="relative min-h-screen py-32 bg-beige overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 text-center mb-20">
        <span className="text-brown/60 uppercase tracking-[0.4em] text-[10px] font-bold mb-4 block">Cartografia Imersiva</span>
        <h2 className="font-serif text-5xl md:text-7xl mb-8 text-brown">O Mapa <span className="italic font-light opacity-60">Abstrato.</span></h2>
        <p className="text-brown/40 max-w-2xl mx-auto text-lg leading-relaxed font-light">
          Uma interface de exploração premium. Descubra os pontos vitais de energia e luxo em nosso território secreto nos Pinheiros.
        </p>
      </div>

      <div className="relative w-full max-w-6xl mx-auto aspect-[16/9] px-6">
        {/* Abstract Map Lines/SVG Background */}
        <div className="absolute inset-0 z-0">
          <svg viewBox="0 0 1000 600" className="w-full h-full opacity-30 fill-none stroke-brown/20 stroke-[0.5]">
             {/* Abstract paths representing topography */}
             <path d="M100,300 C250,150 400,450 600,250 C750,100 900,400 1000,300" />
             <path d="M0,450 C200,350 450,550 700,350 C850,250 1000,500 1200,450" />
             <path d="M200,100 C400,200 100,500 600,400 C800,300 900,100 1100,100" />
          </svg>
        </div>

        {/* Floating Particles over map */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
           {[...Array(15)].map((_, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0 }}
               animate={{ 
                 opacity: [0.1, 0.3, 0.1],
                 x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                 y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
               }}
               transition={{ duration: 10 + Math.random() * 10, repeat: Infinity }}
               className="absolute w-1 h-1 bg-brown/20 rounded-full"
             />
           ))}
        </div>

        {/* Interactive Points */}
        <div className="relative w-full h-full">
          {MAP_POINTS.map((point) => (
            <div 
              key={point.id}
              className="absolute"
              style={{ left: point.x, top: point.y }}
            >
              <button
                onMouseEnter={() => setActivePoint(point)}
                onMouseLeave={() => setActivePoint(null)}
                data-hover={point.name.toLowerCase()}
                className="relative group flex items-center justify-center"
              >
                {/* Pulse Animation */}
                <span className="absolute w-full h-full bg-brown/20 rounded-full animate-ping opacity-75" />
                <span className="relative w-4 h-4 bg-brown rounded-full shadow-lg" />
                
                {/* Popover */}
                <AnimatePresence>
                  {activePoint?.id === point.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full mb-4 w-64 glass p-6 rounded-xl text-left pointer-events-none z-50 transform -translate-x-1/2 border border-brown/10 bg-white/80"
                    >
                      <point.icon size={16} className="text-brown mb-3" />
                      <h4 className="text-brown font-bold uppercase tracking-widest text-[10px] mb-2">{point.name}</h4>
                      <p className="text-brown/60 text-[10px] leading-relaxed uppercase tracking-widest font-medium">
                        {point.description}
                      </p>
                      <div className="mt-4 flex items-center gap-2 overflow-hidden">
                        <div className="w-1/2 h-0.5 bg-brown/10 relative">
                           <motion.div 
                             initial={{ x: '-100%' }}
                             animate={{ x: '100%' }}
                             transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                             className="absolute inset-0 bg-brown/40"
                           />
                        </div>
                        <span className="text-[8px] text-brown/40 uppercase font-mono">Syncing...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-6 mt-32 text-center">
         <div className="flex flex-wrap justify-center gap-8 md:gap-20">
           {['Topografia', 'Energia', 'Conectividade', 'Privacidade'].map((item) => (
             <div key={item} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full border border-brown/20" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-brown/40">{item}</span>
             </div>
           ))}
         </div>
      </div>
    </section>
  );
};
