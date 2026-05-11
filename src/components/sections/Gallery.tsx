import React from 'react';
import { motion } from 'motion/react';

const IMAGES = [
  {
    url: '/geral_hotel/foto1.jpeg',
    delay: 0,
    aspect: 'aspect-[3/4]',
    description: 'Vista privilegiada das cabanas em meio à mata preservada',
  },
  {
    url: '/geral_hotel/foto6.jpeg',
    delay: 0.1,
    aspect: 'aspect-[3/4]',
    description: 'Lagos cristalinos e cachoeiras da reserva',
  },
  {
    url: '/geral_hotel/foto2.jpeg',
    delay: 0.2,
    aspect: 'aspect-[4/3]',
    description: 'Área de lazer e relaxamento da propriedade',
  },
  {
    url: '/geral_hotel/foto5.jpeg',
    delay: 0.15,
    aspect: 'aspect-[4/3]',
    description: 'Ambientes e acomodações de alto padrão',
  },
  {
    url: '/geral_hotel/foto3.jpeg',
    delay: 0.25,
    aspect: 'aspect-square',
    description: 'Natureza intocada do Vale do Eden Reserva',
  },
  {
    url: '/geral_hotel/foto4.jpeg',
    delay: 0.3,
    aspect: 'aspect-square',
    description: "Piscinas e espelhos d'água cercados de verde",
  },
];

export const Gallery: React.FC = () => {
  return (
    <section className="py-32 bg-white overflow-hidden relative">
      <div className="container mx-auto px-6 mb-16 text-center">
        <span className="text-forest uppercase tracking-[0.4em] text-[10px] font-bold mb-4 block">
          Memória Visual
        </span>
        <h2 className="font-serif text-5xl md:text-7xl mb-4 italic text-brown">
          Fragmentos <span className="not-italic opacity-40">do Tempo.</span>
        </h2>
      </div>

      <div className="container mx-auto px-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {IMAGES.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.9,
                delay: img.delay,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              }}
              viewport={{ once: true }}
              className={`relative group overflow-hidden rounded-2xl bg-beige ${img.aspect}`}
            >
              <img
                src={img.url}
                alt="Casarão Vale do Eden Reserva"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 p-5 pointer-events-none">
                <p className="text-white text-sm font-light leading-snug drop-shadow-sm translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  {img.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-brown/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-brown/5 blur-[120px]" />
      </div>
    </section>
  );
};
