import React from 'react';
import { motion } from 'motion/react';

const IMAGES = [
  { url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=800', size: 'large', delay: 0 },
  { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800', size: 'small', delay: 0.2 },
  { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800', size: 'small', delay: 0.1 },
  { url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=800', size: 'medium', delay: 0.3 },
  { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800', size: 'large', delay: 0.4 },
  { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800', size: 'small', delay: 0.5 },
];

export const Gallery: React.FC = () => {
  return (
    <section className="py-32 bg-white overflow-hidden relative">
      <div className="container mx-auto px-6 mb-20 text-center md:text-left">
        <span className="text-brown/40 uppercase tracking-[0.4em] text-[10px] font-bold mb-4 block">Memória Visual</span>
        <h2 className="font-serif text-5xl md:text-7xl mb-4 italic text-brown">Fragmentos <span className="not-italic opacity-40">do Tempo.</span></h2>
      </div>

      <div className="container mx-auto px-6">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {IMAGES.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: img.delay, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              data-hover="ampliar"
              className="relative group overflow-hidden rounded-xl bg-beige"
            >
              <img 
                src={img.url} 
                alt="Nature view"
                className="w-full h-auto object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-105 transition-all duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-brown/0 group-hover:bg-brown/5 transition-colors pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Elements Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-10 w-96 h-96 bg-brown/5 blur-[120px]" />
          <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-brown/5 blur-[120px]" />
      </div>
    </section>
  );
};
