import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Users, Moon, Bed, MapPin } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface CabinImage {
  src: string;
  label: string;
}

interface Cabin {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  mainImage: string;
  gallery: CabinImage[];
  tags: string[];
  capacity: string;
  rooms: number;
  nights: number;
  amenities: string[];
  view: string;
}

const CABINS: Cabin[] = [
  {
    id: '01',
    title: 'Cabana Suíça',
    shortDescription: 'Cabana com 90 m² divididos em duas suítes, sala, cozinha e deck com ofurô. Vista para cachoeira.',
    fullDescription:
      'A Cabana Suíça é um refúgio encantador de 90 m², meticulosamente projetada para proporcionar o equilíbrio perfeito entre conforto e natureza. Com duas suítes elegantemente decoradas, sala de estar integrada à cozinha gourmet e um deck privativo com ofurô, este espaço foi concebido para criar memórias inesquecíveis. A cachoeira que compõe sua vista é o elemento central da experiência — sua música constante serve de trilha sonora para momentos de profunda reconexão.',
    mainImage: '/1761695050182-Cabana_Suica_frontal_1.jpg',
    gallery: [
      { src: '/1761997463599-CabanaSuica1.jpg', label: 'Fachada' },
      { src: '/1761997379488-CabanaSuicaSala.jpg', label: 'Sala de Estar' },
      { src: '/1761997380084-CabanaSuica_Sala.jpg', label: 'Sala' },
      { src: '/1761997379799-CabanaSuica_Cozinha.jpg', label: 'Cozinha' },
      { src: '/1761997439866-Cabana_Banheiro.jpg', label: 'Banheiro' },
      { src: '/1761997461000-DSC02126-2.jpg', label: 'Interior' },
      { src: '/1761997461972-DSC02122-2.jpg', label: 'Detalhe' },
      { src: '/1761997462708-DSC02124-2.jpg', label: 'Ambiente' },
      { src: '/1761997463193-CabanaSuica_Vista.jpg', label: 'Vista da Cachoeira' },
    ],
    tags: ['Cachoeira', 'Ofurô', 'Café Incluso'],
    capacity: '2–4 pessoas',
    rooms: 2,
    nights: 2,
    amenities: [
      'Ofurô privativo',
      'Wi-Fi de alta velocidade',
      'Cozinha equipada',
      'Café da manhã incluso',
      'Deck privativo',
      'Smart TV',
      'Ar-condicionado',
      'Frigobar',
      'Chuveiro de chuva',
      'Roupões e amenidades',
    ],
    view: 'Vista direta para a cachoeira — o som das águas é constante companhia. Deck com ofurô voltado para a natureza intocada.',
  },
  {
    id: '02',
    title: 'Cabana da Mata',
    shortDescription: 'Cabana com 90 m², duas suítes, sala, cozinha e deck com ofurô. Vista para piscinas naturais.',
    fullDescription:
      'Imersão total na mata nativa: a Cabana da Mata foi projetada para quem busca se perder na natureza sem abrir mão do conforto. Com 90 m² de espaço cuidadosamente curado, duas suítes, sala integrada, cozinha e deck com ofurô, cada detalhe convida à contemplação. O deck se abre para uma vista privilegiada das piscinas naturais — um convite irresistível ao mergulho e à desaceleração genuína.',
    mainImage: '/1761873782563-CabanaMata_Frente_2.jpg',
    gallery: [
      { src: '/1761873810699-CabanaMata_Quarto1.jpg', label: 'Quarto Principal' },
      { src: '/1761873810367-CabanaMata_Quarto2.jpg', label: 'Quarto 2' },
      { src: '/1761873823069-Cabanamata_Quato3.jpg', label: 'Quarto 3' },
      { src: '/1761873830101-Cabana_Banheiro.jpg', label: 'Banheiro' },
      { src: '/1761873840797-CabanaMata_Deck1.jpg', label: 'Deck' },
      { src: '/1761873840345-CabanaMata_Deck2.jpg', label: 'Deck 2' },
      { src: '/1761873847903-CabanaMata_Vista.jpg', label: 'Vista da Mata' },
    ],
    tags: ['Piscinas Naturais', 'Ofurô', '2–4 Pessoas'],
    capacity: '2–4 pessoas',
    rooms: 2,
    nights: 2,
    amenities: [
      'Ofurô privativo',
      'Wi-Fi de alta velocidade',
      'Cozinha equipada',
      'Café da manhã incluso',
      'Deck privativo',
      'Smart TV',
      'Ar-condicionado',
      'Frigobar',
      'Chuveiro de chuva',
      'Trilhas exclusivas',
    ],
    view: 'Vista para as piscinas naturais e mata nativa. Deck com ofurô integrado à paisagem verde e tranquila da reserva.',
  },
  {
    id: '03',
    title: 'Cabana do Lago',
    shortDescription: 'Cabana de 90 m² com duas suítes, sala, cozinha e deck com ofurô. Vista panorâmica para o lago.',
    fullDescription:
      'A Cabana do Lago é a experiência definitiva de serenidade. Posicionada às margens do lago da propriedade, oferece uma vista panorâmica única que muda de tonalidade ao longo do dia. Seus 90 m² contemplam duas suítes requintadas, sala integrada à cozinha e um deck amplo com ofurô — um convite ao silêncio e à contemplação das águas calmas que refletem o céu e a floresta.',
    mainImage: '/1761695693727-frentecabanalado.jpg',
    gallery: [
      { src: '/1761870889565-IMG_3946.jpg', label: 'Ambiente' },
      { src: '/1761870901296-CadanaLago_Sala.jpg', label: 'Sala de Estar' },
      { src: '/1761870901108-Cabanalago_Cozinha.jpg', label: 'Cozinha' },
      { src: '/1761870913281-CabanaLago_Quarto.jpg', label: 'Quarto Principal' },
      { src: '/1761870912599-CabanaLago_Quarto2.jpg', label: 'Quarto 2' },
      { src: '/1761870913442-Cabana_Quartos.jpg', label: 'Quartos' },
      { src: '/1761870919393-Cabana_Banheiro.jpg', label: 'Banheiro' },
      { src: '/1761870929332-CabanaLago_Deck1.jpg', label: 'Deck' },
      { src: '/1761870929992-Vista_CabanaLago.jpg', label: 'Vista do Lago' },
    ],
    tags: ['Vista Lago', 'Ofurô', 'Café Incluso'],
    capacity: '2–4 pessoas',
    rooms: 2,
    nights: 2,
    amenities: [
      'Ofurô privativo',
      'Wi-Fi de alta velocidade',
      'Cozinha equipada',
      'Café da manhã incluso',
      'Deck à beira do lago',
      'Smart TV',
      'Ar-condicionado',
      'Frigobar',
      'Chuveiro de chuva',
      'Caiaque disponível',
    ],
    view: 'Vista panorâmica para o lago da propriedade. O deck com ofurô está posicionado diretamente sobre a beira d\'água — perfeito para o pôr do sol.',
  },
  {
    id: '04',
    title: 'Quarto Casarão',
    shortDescription: 'Quarto amplo no Casarão histórico com cama queen, cama de solteiro e banheiro privativo. Até 3 pessoas.',
    fullDescription:
      'Os Quartos do Casarão combinam o charme histórico da arquitetura original com o conforto contemporâneo. Cada quarto oferece uma cama queen confortável, cama de solteiro e banheiro privativo. Hospedados no Casarão, os hóspedes têm acesso completo às áreas comuns da propriedade: piscina, área de lazer, trilhas e o cuidado da nossa equipe. Uma experiência de hospedagem intimista, perfeita para quem valoriza autenticidade e aconchego.',
    mainImage: '/1761696163462-IMG_3909.jpg',
    gallery: [
      { src: '/1761696175128-IMG_3914.jpg', label: 'Quarto' },
      { src: '/1761696181476-IMG_3911.jpg', label: 'Detalhe' },
      { src: '/1761696197303-Entrada_Casarao.jpg', label: 'Entrada do Casarão' },
      { src: '/1761696205010-Vista_Casarao2.jpg', label: 'Vista do Casarão' },
      { src: '/1761696224763-Piscina6.jpg', label: 'Piscina' },
      { src: '/1761696241390-Lazer1.jpg', label: 'Área de Lazer' },
      { src: '/1761696241906-Lazer2.jpg', label: 'Lazer' },
    ],
    tags: ['Queen Size', 'Casarão Histórico', 'Até 3 Pessoas'],
    capacity: 'Até 3 pessoas',
    rooms: 1,
    nights: 2,
    amenities: [
      'Cama queen size',
      'Cama de solteiro extra',
      'Banheiro privativo',
      'Wi-Fi de alta velocidade',
      'Café da manhã incluso',
      'Smart TV',
      'Ar-condicionado',
      'Frigobar',
      'Acesso à piscina',
      'Área de lazer',
    ],
    view: 'Integrado ao Casarão histórico com acesso às áreas comuns da propriedade. Vista para os jardins e piscina.',
  },
  {
    id: '05',
    title: 'Quarto Família Casarão',
    shortDescription: 'Suite familiar com 3 quartos, sala de estar e banheiro. Perfeito para grupos de até 8 pessoas.',
    fullDescription:
      'O Quarto Família Casarão foi criado especialmente para quem valoriza estar junto. Este espaço generoso reúne três quartos — dois com cama de casal e solteiro com ar-condicionado e um com cama de casal e ventilador — além de uma sala de estar privativa e banheiro. Ideal para famílias e grupos de amigos que desejam compartilhar uma experiência única na natureza, com conforto e privacidade no coração do Casarão.',
    mainImage: '/1761696848242-Quarto_familia_2a.jpg',
    gallery: [
      { src: '/1761696848427-Quarto_familia_2b.jpg', label: 'Quarto Família' },
      { src: '/1761696848662-Quarto_familia_3a.jpg', label: 'Terceiro Quarto' },
      { src: '/1761696862586-IMG_4117.jpg', label: 'Detalhe' },
      { src: '/1761696885683-Entrada_Casarao.jpg', label: 'Entrada do Casarão' },
      { src: '/1761696885942-Vista_Casarao2.jpg', label: 'Vista do Casarão' },
      { src: '/1761696900246-Piscina6.jpg', label: 'Piscina' },
      { src: '/1761696916908-Lazer1.jpg', label: 'Área de Lazer' },
      { src: '/1761696917421-Lazer2.jpg', label: 'Lazer' },
      { src: '/1761696917681-Piscian2.jpg', label: 'Piscina 2' },
    ],
    tags: ['Família', 'Até 8 Pessoas', 'Ar-Condicionado'],
    capacity: 'Até 8 pessoas',
    rooms: 3,
    nights: 2,
    amenities: [
      '3 quartos',
      'Sala de estar privativa',
      'Banheiro compartilhado',
      'Wi-Fi de alta velocidade',
      'Café da manhã incluso',
      'Smart TV',
      'Ar-condicionado (2 quartos)',
      'Frigobar',
      'Acesso à piscina',
      'Área de lazer',
    ],
    view: 'Localizado no coração do Casarão histórico com acesso às áreas comuns. Vista para jardins, piscina e paisagem da propriedade.',
  },
];

const AccommodationModal: React.FC<{ cabin: Cabin; onClose: () => void }> = ({ cabin, onClose }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const allImages: CabinImage[] = [{ src: cabin.mainImage, label: 'Principal' }, ...cabin.gallery];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setActiveIdx(i => (i + 1) % allImages.length);
      if (e.key === 'ArrowLeft') setActiveIdx(i => (i - 1 + allImages.length) % allImages.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [allImages.length, onClose]);

  const prev = () => setActiveIdx(i => (i - 1 + allImages.length) % allImages.length);
  const next = () => setActiveIdx(i => (i + 1) % allImages.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 lg:p-8"
      style={{ backdropFilter: 'blur(10px)', background: 'rgba(10, 6, 4, 0.88)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 12 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative w-full max-w-6xl bg-beige rounded-2xl overflow-hidden flex flex-col lg:flex-row shadow-2xl"
        style={{ maxHeight: '92vh' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
        >
          <X size={15} className="text-white" />
        </button>

        {/* ── Gallery col ── */}
        <div className="lg:w-[58%] flex flex-col bg-black min-h-0">
          {/* Main image */}
          <div className="relative flex-1 overflow-hidden" style={{ minHeight: '42vw', maxHeight: '60vh' }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={activeIdx}
                src={allImages[activeIdx].src}
                alt={`${cabin.title} — ${allImages[activeIdx].label}`}
                loading="eager"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Gradient overlay bottom */}
            <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />

            {/* Label + counter */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <span
                className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest text-white/80 border border-white/10"
                style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(6px)' }}
              >
                {allImages[activeIdx].label}
              </span>
              <span className="text-white/40 text-[11px] font-mono">
                {activeIdx + 1} / {allImages.length}
              </span>
            </div>

            {/* Arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Imagem anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full border border-white/15 hover:bg-white/10 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(4px)' }}
                >
                  <ChevronLeft size={16} className="text-white" />
                </button>
                <button
                  onClick={next}
                  aria-label="Próxima imagem"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full border border-white/15 hover:bg-white/10 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(4px)' }}
                >
                  <ChevronRight size={16} className="text-white" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          <div
            className="flex gap-2 p-3 overflow-x-auto flex-shrink-0"
            data-lenis-prevent
            style={{ background: 'rgba(0,0,0,0.75)', scrollbarWidth: 'none' }}
          >
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className="flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200"
                style={{
                  width: 56,
                  height: 40,
                  opacity: activeIdx === i ? 1 : 0.38,
                  outline: activeIdx === i ? '2px solid rgba(255,255,255,0.55)' : 'none',
                  outlineOffset: 2,
                  transform: activeIdx === i ? 'scale(1.07)' : 'scale(1)',
                }}
              >
                <img src={img.src} alt={img.label} loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Info col ── */}
        <div
          className="lg:w-[42%] flex flex-col overflow-y-auto px-6 py-7 lg:px-8"
          data-lenis-prevent
          style={{ maxHeight: '92vh' }}
        >
          {/* Header */}
          <div className="mb-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-brown/30 mb-2 block">
              Acomodação #{cabin.id}
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl text-brown italic leading-snug mb-3">
              {cabin.title}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {cabin.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-1 glass rounded-full text-[9px] uppercase tracking-widest text-brown/65 border border-brown/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-0 mb-6 rounded-xl border border-brown/8 overflow-hidden">
            {[
              { Icon: Users, label: 'Capacidade', value: cabin.capacity },
              { Icon: Bed, label: 'Quartos', value: `${cabin.rooms} ${cabin.rooms === 1 ? 'quarto' : 'quartos'}` },
              { Icon: Moon, label: 'Mín. Noites', value: `${cabin.nights} noites` },
            ].map(({ Icon, label, value }, idx) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center py-4 px-2 text-center"
                style={{
                  background: 'rgba(26,15,10,0.025)',
                  borderRight: idx < 2 ? '1px solid rgba(26,15,10,0.06)' : 'none',
                }}
              >
                <Icon size={13} className="mb-1.5 text-brown/25" />
                <span className="text-[9px] uppercase tracking-widest text-brown/30 mb-1">{label}</span>
                <span className="text-brown font-semibold text-[13px]">{value}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-[9px] uppercase tracking-[0.35em] text-brown/30 font-bold mb-3">
              Sobre a Acomodação
            </h3>
            <p className="text-brown/60 leading-relaxed text-sm">{cabin.fullDescription}</p>
          </div>

          {/* View */}
          <div
            className="mb-6 p-4 rounded-xl flex gap-3"
            style={{ background: 'rgba(26,15,10,0.03)', border: '1px solid rgba(26,15,10,0.06)' }}
          >
            <MapPin size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#c3a37a' }} />
            <div>
              <div className="text-[9px] uppercase tracking-[0.35em] text-brown/30 font-bold mb-1.5">
                Vista & Localização
              </div>
              <p className="text-brown/55 text-xs leading-relaxed">{cabin.view}</p>
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-8">
            <h3 className="text-[9px] uppercase tracking-[0.35em] text-brown/30 font-bold mb-4">
              Comodidades
            </h3>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              {cabin.amenities.map(a => (
                <div key={a} className="flex items-center gap-2 text-xs text-brown/55">
                  <span
                    className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: '#c3a37a' }}
                  />
                  {a}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-auto pt-5 border-t border-brown/8 flex gap-3 sticky bottom-0 bg-beige pb-1">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 glass hover:glass-gold border border-brown/10 transition-all text-[10px] uppercase tracking-[0.25em] text-brown rounded-lg"
            >
              Voltar
            </button>
            <button
              data-hover="reservar"
              className="flex-1 py-3.5 bg-brown text-white transition-colors text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-brown/85 rounded-lg"
            >
              Reservar Agora
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const Accommodations: React.FC = () => {
  const component = useRef<HTMLDivElement>(null!);
  const slider = useRef<HTMLDivElement>(null!);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);

  const totalPanels = CABINS.length + 1;

  useGSAP(() => {
    const panels = gsap.utils.toArray<HTMLElement>('.panel');

    gsap.to(panels, {
      xPercent: -100 * (panels.length - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: slider.current,
        pin: true,
        scrub: 1,
        snap: 1 / (panels.length - 1),
        end: () => '+=' + slider.current.offsetWidth,
      },
    });

    gsap.from('.accomm-title', {
      y: 50,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: slider.current,
        start: 'top 80%',
      },
    });
  }, { scope: component });

  return (
    <>
      <section ref={component} className="bg-beige overflow-hidden">
        <div
          ref={slider}
          className="relative flex h-screen items-center"
          style={{ width: `${totalPanels * 100}vw` }}
        >
          {/* ── Intro slide ── */}
          <div className="panel w-screen h-screen flex items-center justify-center px-6 md:px-20">
            <div className="max-w-4xl">
              <span className="text-forest uppercase tracking-[0.4em] text-[10px] font-bold mb-6 block">
                Origem
              </span>
              <h2 className="accomm-title font-serif text-5xl md:text-7xl lg:text-8xl italic mb-8 text-brown">
                onde se volta ao <br /> princípio de tudo.
              </h2>
              <p className="text-brown/40 max-w-lg text-lg leading-relaxed">
                Cada espaço foi desenhado como um portal individual, unindo engenharia sustentável com o
                conforto impecável do luxo contemporâneo.
              </p>
            </div>
          </div>

          {/* ── Cabin slides ── */}
          {CABINS.map(cabin => (
            <div
              key={cabin.id}
              className="panel w-screen h-screen flex items-center justify-center px-6 md:px-16 xl:px-20 relative"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-center w-full max-w-7xl">

                {/* Image */}
                <div className="relative group overflow-hidden rounded-2xl aspect-[4/3] lg:aspect-auto lg:h-[68vh]">
                  <img
                    src={cabin.mainImage}
                    alt={cabin.title}
                    loading="eager"
                    className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                  />
                  {/* Subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {/* Number badge */}
                  <div className="absolute bottom-6 left-6">
                    <span className="font-mono text-white/30 text-5xl font-bold leading-none">
                      #{cabin.id}
                    </span>
                  </div>
                  {/* Gallery count hint */}
                  <div
                    className="absolute top-5 right-5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-widest text-white/70 border border-white/10"
                    style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(6px)' }}
                  >
                    {cabin.gallery.length + 1} fotos
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-6 lg:space-y-7">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {cabin.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 glass rounded-full text-[9px] uppercase tracking-widest text-brown/70 border border-brown/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-4xl md:text-5xl xl:text-6xl text-brown leading-tight">
                    {cabin.title}
                  </h3>

                  {/* Stats row */}
                  <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em] text-brown/35 font-bold border-y border-brown/8 py-4">
                    <div>
                      Capacidade&ensp;
                      <span className="text-brown">{cabin.capacity}</span>
                    </div>
                    <div>
                      Quartos&ensp;
                      <span className="text-brown">{cabin.rooms}</span>
                    </div>
                    <div>
                      Mín.&ensp;
                      <span className="text-brown">{cabin.nights} noites</span>
                    </div>
                  </div>

                  {/* Short description */}
                  <p className="text-brown/55 text-base leading-relaxed max-w-md">
                    {cabin.shortDescription}
                  </p>

                  {/* Top amenities preview */}
                  <div className="flex flex-wrap gap-2">
                    {cabin.amenities.slice(0, 4).map(a => (
                      <span key={a} className="flex items-center gap-1.5 text-[10px] text-brown/45">
                        <span
                          className="w-1 h-1 rounded-full flex-shrink-0"
                          style={{ background: '#c3a37a' }}
                        />
                        {a}
                      </span>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      data-hover="reservar"
                      className="flex-1 px-6 py-4 bg-brown text-white transition-colors text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-brown/85"
                    >
                      Reservar Agora
                    </button>
                    <button
                      data-hover="detalhes"
                      onClick={() => setSelectedCabin(cabin)}
                      className="flex-1 px-6 py-4 glass hover:glass-gold transition-all text-[10px] uppercase tracking-[0.3em] text-brown border border-brown/10"
                    >
                      Ver Detalhes Completos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modal ── */}
      <AnimatePresence>
        {selectedCabin && (
          <AccommodationModal
            cabin={selectedCabin}
            onClose={() => setSelectedCabin(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
