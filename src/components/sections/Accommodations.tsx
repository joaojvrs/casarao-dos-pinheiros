import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const CABINS = [
  {
    id: '01',
    title: 'Cabana Suíça',
    description: 'Cabana aconchegante com 90 m² divididos em duas suítes, sala, cozinha e um deck com ofurô. Vista direta para uma linda cachoeira.',
    image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=1200&auto=format&fit=crop',
    tags: ['Cachoeira', 'Ofurô', 'Cafe Incluso'],
    capacity: '2-2',
    nights: '2'
  },
  {
    id: '02',
    title: 'Cabana da Mata',
    description: 'Cabana aconchegante com 90 m² divididos em duas suítes, sala, cozinha e um deck com ofurô. Vista direta para as piscinas naturais.',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1200&auto=format&fit=crop',
    tags: ['Piscinas Naturais', 'Ofurô', '2-4 Pessoas'],
    capacity: '2-4',
    nights: '2'
  },
  {
    id: '03',
    title: 'Cabana do Lago',
    description: 'Cabana aconchegante com 90 m² divididos em duas suítes, sala, cozinha e um deck com ofurô. Vista direta para o lago.',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
    tags: ['Vista Lago', 'Ofurô', 'Cafe Incluso'],
    capacity: '2-2',
    nights: '2'
  },
  {
    id: '04',
    title: 'Quarto Casarão',
    description: 'Quartos amplos e confortáveis no Casarão com uma cama queen e uma cama de solteiro. Possibilidade de adicionar mais um colchão.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop',
    tags: ['Queen Size', 'Casarão', '3 Pessoas'],
    capacity: '3-3',
    nights: '2'
  },
  {
    id: '05',
    title: 'Quarto Família Casarão',
    description: 'Três quartos, sala de estar e banheiro. Dois quartos com cama de casal e solteiro + ar condicionado. Um quarto com cama de casal + ventilador.',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop',
    tags: ['8 Pessoas', 'Família', 'Ar Condicionado'],
    capacity: '8-8',
    nights: '2'
  }
];

export const Accommodations: React.FC = () => {
  const component = useRef<HTMLDivElement>(null!);
  const slider = useRef<HTMLDivElement>(null!);

  useGSAP(() => {
    const panels = gsap.utils.toArray('.panel');
    
    gsap.to(panels, {
      xPercent: -100 * (panels.length - 1),
      ease: "none",
      scrollTrigger: {
        trigger: slider.current,
        pin: true,
        scrub: 1,
        snap: 1 / (panels.length - 1),
        end: () => "+=" + slider.current.offsetWidth,
      }
    });

    // Reveal entrance
    gsap.from('.accomm-title', {
      y: 50,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: slider.current,
        start: 'top 80%',
      }
    });

  }, { scope: component });

  return (
    <section ref={component} className="bg-beige overflow-hidden">
      <div ref={slider} className="relative flex w-[400vw] h-screen items-center">
        {/* Intro Slide */}
        <div className="panel w-screen h-screen flex items-center justify-center px-6 md:px-20">
          <div className="max-w-4xl">
            <span className="text-brown uppercase tracking-[0.4em] text-[10px] font-bold mb-6 block">Acomodações</span>
            <h2 className="accomm-title font-serif text-5xl md:text-7xl lg:text-8xl italic mb-8 text-brown">
              Estações de <br /> Reconexão.
            </h2>
            <p className="text-brown/40 max-w-lg text-lg leading-relaxed">
              Cada espaço foi desenhado como um portal individual, unindo engenharia sustentável com o conforto impecável do luxo contemporâneo.
            </p>
          </div>
        </div>

        {/* Cabin Slides */}
        {CABINS.map((cabin) => (
          <div key={cabin.id} className="panel w-screen h-screen flex items-center justify-center px-6 md:px-20 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full max-w-7xl">
              <div className="relative group overflow-hidden rounded-2xl aspect-[4/5] lg:aspect-auto lg:h-[70vh]">
                <img 
                  src={cabin.image} 
                  alt={cabin.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-beige/80 to-transparent" />
                <div className="absolute bottom-10 left-10">
                  <span className="font-mono text-brown text-4xl opacity-50 mb-4 block">#{cabin.id}</span>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="flex gap-2">
                  {cabin.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 glass rounded-full text-[9px] uppercase tracking-widest text-brown/80 border border-brown/10">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="font-serif text-4xl md:text-6xl text-brown">{cabin.title}</h3>
                <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em] text-brown/40 font-bold border-y border-brown/5 py-4">
                  <div>Capacidade: <span className="text-brown">{cabin.capacity}</span></div>
                  <div>Mín. Noites: <span className="text-brown">{cabin.nights}</span></div>
                </div>
                <p className="text-brown/60 text-lg leading-relaxed max-w-md">
                  {cabin.description}
                </p>
                <div className="flex gap-4">
                  <button 
                    data-hover="reservar"
                    className="flex-1 px-8 py-4 bg-brown text-white transition-all text-xs uppercase tracking-[0.3em] font-bold"
                  >
                    Reservar Agora
                  </button>
                  <button 
                    data-hover="detalhes"
                    className="flex-1 px-8 py-4 glass hover:glass-gold transition-all text-xs uppercase tracking-[0.3em] text-brown border border-brown/10"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
