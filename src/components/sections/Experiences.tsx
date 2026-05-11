import React, { useRef } from 'react';
import { motion } from 'motion/react';
import {
  Church,
  Waves,
  Sparkles,
  Users,
  Zap,
  Mountain,
  Anchor,
  Fish,
  Droplets,
} from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  tagline: string;
  description: string;
  Icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

const EXPERIENCES: Experience[] = [
  {
    id: '01',
    title: 'Capela de Pedras',
    tagline: 'Espiritualidade & Contemplação',
    description:
      'Uma linda Capela construída com pedras rústicas — um espaço de recolhimento e paz, inserido harmoniosamente na natureza preservada da propriedade.',
    Icon: Church,
  },
  {
    id: '02',
    title: 'Piscinas Aquecidas',
    tagline: 'Relaxamento em todas as estações',
    description:
      'Desfrute de momentos de descanso em nossas piscinas aquecidas, cercadas pela natureza e perfeitas para qualquer clima durante todo o ano.',
    Icon: Waves,
  },
  {
    id: '03',
    title: 'Massagem',
    tagline: 'Equilíbrio para corpo e mente',
    description:
      'Um momento de paz e cuidado com técnicas que aliviam tensões e renovam suas energias. Bem-estar em plena conexão com a natureza.',
    Icon: Sparkles,
  },
  {
    id: '04',
    title: 'Quadra de Areia',
    tagline: 'Diversão & Energia ao ar livre',
    description:
      'Um espaço perfeito para se divertir com amigos e praticar esportes ao ar livre, cercado por natureza, ar fresco e boas vibrações.',
    Icon: Users,
  },
  {
    id: '05',
    title: 'Passeio de Quadriciclo',
    tagline: 'Aventura em meio à natureza',
    description:
      'Sinta a emoção de explorar trilhas e paisagens incríveis em um passeio cheio de adrenalina, liberdade e contato direto com a mata.',
    Icon: Zap,
  },
  {
    id: '06',
    title: 'Lagos e Cachoeiras',
    tagline: 'Beleza e frescor natural',
    description:
      'Lagos tranquilos e cachoeiras cristalinas esperam por você. Um convite irresistível para se refrescar e contemplar paisagens encantadoras.',
    Icon: Mountain,
  },
  {
    id: '07',
    title: 'Stand-Up Paddle',
    tagline: 'Liberdade sobre as águas',
    description:
      'Viva a sensação de deslizar pelas águas em meio à natureza. Uma atividade leve, divertida e perfeita para hóspedes de todas as idades.',
    Icon: Anchor,
  },
  {
    id: '08',
    title: 'Pesca Esportiva',
    tagline: 'Conecte-se com a natureza',
    description:
      'Um momento de lazer e tranquilidade à beira do lago, onde a paciência se transforma em prazer e cada captura é uma nova emoção.',
    Icon: Fish,
  },
  {
    id: '09',
    title: 'Lago e Piscinas Naturais',
    tagline: 'Refúgio de águas cristalinas',
    description:
      'Desfrute de águas tranquilas cercadas por verde e paisagens que renovam corpo e mente. A natureza em seu estado mais puro e intocado.',
    Icon: Droplets,
  },
];


export const Experiences: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={sectionRef}
      className="bg-beige py-32 md:py-40 px-6 md:px-16 xl:px-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-end mb-20 md:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: '-80px' }}
          >
            <span className="text-forest uppercase tracking-[0.4em] text-[10px] font-bold mb-6 block">
              Experiências
            </span>
            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl italic text-brown leading-tight">
              Experiências <br /> Inesquecíveis.
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-brown/45 text-lg leading-relaxed lg:max-w-md"
          >
            Descubra momentos únicos em meio à natureza preservada, onde cada experiência é
            cuidadosamente pensada para a sua plena satisfação.
          </motion.p>
        </div>

        {/* ── Grid ── */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{ background: 'rgba(26,15,10,0.07)' }}
        >
          {EXPERIENCES.map(({ id, title, tagline, description, Icon }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.75,
                delay: (i % 3) * 0.12,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              }}
              viewport={{ once: true, margin: '-60px' }}
              className="group bg-beige flex flex-col gap-7 p-10 xl:p-12 hover:bg-brown/[0.025] transition-colors duration-500 cursor-default"
            >
              {/* Top row: number + icon */}
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] text-brown/22 tracking-widest select-none">
                  {id}
                </span>
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: 'rgba(195,163,122,0.12)' }}
                >
                  <Icon size={18} style={{ color: '#c3a37a' }} />
                </div>
              </div>

              {/* Gold accent line */}
              <motion.div
                className="h-px w-8"
                style={{ background: '#c3a37a' }}
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.3 + (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
              />

              {/* Text block */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] uppercase tracking-[0.38em] text-brown/30 font-bold">
                  {tagline}
                </span>
                <h3 className="font-serif text-2xl text-brown leading-snug group-hover:text-brown/85 transition-colors">
                  {title}
                </h3>
              </div>

              <p className="text-brown/50 text-sm leading-relaxed flex-1 group-hover:text-brown/65 transition-colors">
                {description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: '-60px' }}
          className="mt-16 md:mt-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-brown/8 pt-12"
        >
          <p className="text-brown/35 text-sm max-w-sm leading-relaxed">
            Todas as experiências podem ser agendadas com antecedência através do nosso concierge.
          </p>
          <button
            data-hover="reservar"
            className="px-8 py-4 bg-brown text-white text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-brown/85 transition-colors flex-shrink-0"
          >
            Planejar Estadia
          </button>
        </motion.div>
      </div>
    </section>
  );
};
