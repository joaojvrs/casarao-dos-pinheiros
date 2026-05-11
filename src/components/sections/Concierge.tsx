import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, Coffee, Waves } from 'lucide-react';

export const Concierge: React.FC = () => {
  return (
    <section className="py-40 bg-white relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brown/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-brown/60 uppercase tracking-[0.4em] text-[10px] font-bold mb-6 block">Concierge Digital</span>
            <h2 className="font-serif text-5xl md:text-7xl mb-8 leading-tight italic text-brown">
              Desenhe seu <br /> <span className="not-italic opacity-40 text-brown">Legado.</span>
            </h2>
            <p className="text-brown/50 text-lg leading-relaxed font-light mb-12 max-w-md">
              Nossa interface inteligente processa seus desejos para criar uma estadia sob medida no Casarão dos Pinheiros.
            </p>

            <div className="space-y-8">
              {[
                { icon: Coffee, title: 'Inclusividade Orgânica', desc: 'Gastronomia regenerativa de alta performance.' },
                { icon: Waves, title: 'Spa Molecular', desc: 'Protocolos de relaxamento tecnológico avançado.' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex gap-6 items-start"
                >
                  <div className="p-3 glass rounded-lg text-brown border border-brown/10">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-brown mb-1 font-bold">{item.title}</h4>
                    <p className="text-[10px] text-brown/40 uppercase tracking-widest leading-loose">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-gold p-8 md:p-12 rounded-3xl border border-brown/10 shadow-xl relative bg-beige/30">
             {/* Micro-sparkles */}
             <div className="absolute top-4 right-4 animate-pulse">
                <div className="w-2 h-2 bg-brown/20 rounded-full blur-[2px]" />
             </div>

             <h3 className="text-brown uppercase tracking-[0.4rem] text-[10px] font-bold mb-10 text-center">Formulário de Intenção</h3>
             
             <form className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                   <label className="text-[10px] uppercase tracking-widest text-brown/40 ml-4">Check-in</label>
                   <div className="relative group">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brown/20 group-hover:text-brown transition-colors" size={16} />
                     <input 
                       type="text" 
                       placeholder="Selecione data"
                       className="w-full pl-12 pr-6 py-4 glass rounded-full text-xs uppercase tracking-widest focus:outline-none focus:glass-gold transition-all text-brown"
                     />
                   </div>
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] uppercase tracking-widest text-brown/40 ml-4">Check-out</label>
                   <div className="relative group">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brown/20 group-hover:text-brown transition-colors" size={16} />
                     <input 
                       type="text" 
                       placeholder="Selecione data"
                       className="w-full pl-12 pr-6 py-4 glass rounded-full text-xs uppercase tracking-widest focus:outline-none focus:glass-gold transition-all text-brown"
                     />
                   </div>
                 </div>
               </div>

               <div className="space-y-3">
                 <label className="text-[10px] uppercase tracking-widest text-brown/40 ml-4">Hóspedes</label>
                 <div className="relative group">
                   <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-brown/20 group-hover:text-brown transition-colors" size={16} />
                   <select className="w-full pl-12 pr-6 py-4 glass rounded-full text-xs uppercase tracking-widest focus:outline-none focus:glass-gold transition-all appearance-none cursor-none text-brown bg-transparent">
                      <option>01 Hóspede</option>
                      <option>02 Hóspedes</option>
                      <option>04 Hóspedes (Master)</option>
                   </select>
                 </div>
               </div>

               <button 
                 data-hover="confirmar"
                 className="w-full py-6 bg-brown text-white rounded-full text-xs uppercase tracking-[0.4em] font-bold hover:scale-[1.02] active:scale-95 transition-all mt-10 shadow-lg"
               >
                 Buscar Disponibilidade
               </button>
               
               <p className="text-[8px] uppercase tracking-[0.2em] text-brown/30 text-center mt-6">
                 Processamento via rede segura Pinheiros Cloud
               </p>
             </form>
          </div>
        </div>
      </div>
    </section>
  );
};
