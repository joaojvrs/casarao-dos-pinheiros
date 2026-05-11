import React from 'react';
import { motion } from 'motion/react';
import { Coffee, Cloud, Sunrise, Waves, Moon, Star } from 'lucide-react';

const STEPS = [
  { id: 1, time: '07:00', title: 'O Despertar da Névoa', icon: Sunrise, color: 'from-blue-400/20' },
  { id: 2, time: '09:00', title: 'Banquet de Ouro', icon: Coffee, color: 'from-gold/20' },
  { id: 3, time: '14:00', title: 'Fluxo Vital', icon: Waves, color: 'from-green-400/20' },
  { id: 4, time: '17:00', title: 'O Toque das Nuvens', icon: Cloud, color: 'from-mist/20' },
  { id: 5, time: '21:00', title: 'Exclusividade Estelar', icon: Star, color: 'from-indigo-400/20' },
  { id: 6, time: '00:00', title: 'Silêncio Profundo', icon: Moon, color: 'from-black' },
];

export const Timeline: React.FC = () => {
  return (
    <section className="py-40 bg-beige relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mb-24">
          <span className="text-brown uppercase tracking-[0.4em] text-[10px] font-bold mb-4 block">A Jornada</span>
          <h2 className="font-serif text-5xl md:text-7xl mb-8 font-light text-brown">Sua vida em <br /><span className="italic font-bold">fluxo constante.</span></h2>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-brown/10 md:-translate-x-1/2" />

          <div className="space-y-24">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, margin: '-100px' }}
                className={`relative flex flex-col md:flex-row items-center gap-12 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Marker */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-10">
                   <div className="w-4 h-4 bg-brown rounded-full shadow-lg" />
                   <div className="absolute w-8 h-8 border border-brown/20 rounded-full animate-ping" />
                </div>

                {/* Content Card */}
                <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <div className={`glass inline-block p-8 rounded-2xl border border-brown/5 relative overflow-hidden group hover:glass-gold transition-colors bg-white/40`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} to-transparent opacity-0 group-hover:opacity-40 transition-opacity`} />
                    <div className="relative z-10">
                      <span className="font-mono text-brown/40 text-xs mb-2 block">{step.time}</span>
                      <step.icon size={24} className="text-brown mb-4 mx-0 group-hover:scale-110 transition-transform origin-left md:origin-inherit" />
                      <h3 className="text-2xl font-serif mb-2 text-brown">{step.title}</h3>
                      <div className="w-12 h-px bg-brown/20 mb-4 inline-block" />
                      <p className="text-sm text-brown/40 max-w-xs block mx-0 group-hover:text-brown/80 transition-colors">
                        Uma experiência meticulosamente desenhada para ressoar com seus sentidos.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Dummy space for the other side */}
                <div className="hidden md:block w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
