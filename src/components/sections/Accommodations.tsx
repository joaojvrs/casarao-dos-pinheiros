import React, { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Users, Moon, Bed, MapPin, Star, Sparkles } from 'lucide-react';

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
  highlight?: string;
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
    highlight: 'Vista exclusiva para cachoeira',
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
    highlight: 'Piscinas naturais privativas',
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
    highlight: 'Deck sobre o lago ao pôr do sol',
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
    highlight: 'Arquitetura histórica preservada',
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
    highlight: 'Espaço exclusivo para toda a família',
  },
];

const AccommodationModal: React.FC<{ cabin: Cabin; onClose: () => void; onBookingClick?: () => void }> = ({ cabin, onClose, onBookingClick }) => {
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
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 lg:p-8"
      style={{ background: 'rgba(8, 5, 3, 0.92)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 8 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-6xl rounded-2xl overflow-hidden flex flex-col lg:flex-row shadow-2xl"
        style={{ maxHeight: '92vh', background: '#faf7f2' }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <X size={14} className="text-white" />
        </button>

        {/* Gallery */}
        <div className="lg:w-[58%] flex flex-col bg-black min-h-0">
          <div className="relative flex-1 overflow-hidden" style={{ minHeight: '42vw', maxHeight: '60vh' }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={activeIdx}
                src={allImages[activeIdx].src}
                alt={`${cabin.title} — ${allImages[activeIdx].label}`}
                loading="eager"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest text-white/80 border border-white/10"
                style={{ background: 'rgba(0,0,0,0.38)' }}>
                {allImages[activeIdx].label}
              </span>
              <span className="text-white/40 text-[11px] font-mono">{activeIdx + 1} / {allImages.length}</span>
            </div>
            {allImages.length > 1 && (
              <>
                <button onClick={prev} aria-label="Imagem anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full border border-white/15 hover:bg-white/10 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.32)' }}>
                  <ChevronLeft size={16} className="text-white" />
                </button>
                <button onClick={next} aria-label="Próxima imagem"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full border border-white/15 hover:bg-white/10 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.32)' }}>
                  <ChevronRight size={16} className="text-white" />
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2 p-3 overflow-x-auto flex-shrink-0"
            data-lenis-prevent style={{ background: 'rgba(0,0,0,0.75)', scrollbarWidth: 'none' }}>
            {allImages.map((img, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className="flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200"
                style={{
                  width: 56, height: 40,
                  opacity: activeIdx === i ? 1 : 0.38,
                  outline: activeIdx === i ? '2px solid rgba(255,255,255,0.55)' : 'none',
                  outlineOffset: 2,
                  transform: activeIdx === i ? 'scale(1.06)' : 'scale(1)',
                }}>
                <img src={img.src} alt={img.label} loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="lg:w-[42%] flex flex-col overflow-y-auto px-6 py-7 lg:px-8"
          data-lenis-prevent style={{ maxHeight: '92vh' }}>
          <div className="mb-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-brown/30 mb-2 block">
              Acomodação #{cabin.id}
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl text-brown italic leading-snug mb-3">
              {cabin.title}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {cabin.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest text-brown/65 border border-brown/10"
                  style={{ background: 'rgba(195,163,122,0.08)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-0 mb-6 rounded-xl border border-brown/8 overflow-hidden">
            {[
              { Icon: Users, label: 'Capacidade', value: cabin.capacity },
              { Icon: Bed, label: 'Quartos', value: `${cabin.rooms} ${cabin.rooms === 1 ? 'quarto' : 'quartos'}` },
              { Icon: Moon, label: 'Mín. Noites', value: `${cabin.nights} noites` },
            ].map(({ Icon, label, value }, idx) => (
              <div key={label} className="flex flex-col items-center justify-center py-4 px-2 text-center"
                style={{ background: 'rgba(26,15,10,0.025)', borderRight: idx < 2 ? '1px solid rgba(26,15,10,0.06)' : 'none' }}>
                <Icon size={13} className="mb-1.5 text-brown/25" />
                <span className="text-[9px] uppercase tracking-widest text-brown/30 mb-1">{label}</span>
                <span className="text-brown font-semibold text-[13px]">{value}</span>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-[9px] uppercase tracking-[0.35em] text-brown/30 font-bold mb-3">Sobre a Acomodação</h3>
            <p className="text-brown/60 leading-relaxed text-sm">{cabin.fullDescription}</p>
          </div>

          <div className="mb-6 p-4 rounded-xl flex gap-3"
            style={{ background: 'rgba(26,15,10,0.03)', border: '1px solid rgba(26,15,10,0.06)' }}>
            <MapPin size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#c3a37a' }} />
            <div>
              <div className="text-[9px] uppercase tracking-[0.35em] text-brown/30 font-bold mb-1.5">Vista & Localização</div>
              <p className="text-brown/55 text-xs leading-relaxed">{cabin.view}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-[9px] uppercase tracking-[0.35em] text-brown/30 font-bold mb-4">Comodidades</h3>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              {cabin.amenities.map(a => (
                <div key={a} className="flex items-center gap-2 text-xs text-brown/55">
                  <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#c3a37a' }} />
                  {a}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-5 border-t border-brown/8 flex gap-3 sticky bottom-0 pb-1" style={{ background: '#faf7f2' }}>
            <button onClick={onClose}
              className="flex-1 py-3.5 border border-brown/10 hover:border-brown/25 transition-all text-[10px] uppercase tracking-[0.25em] text-brown rounded-lg"
              style={{ background: 'rgba(26,15,10,0.03)' }}>
              Voltar
            </button>
            <button onClick={onBookingClick} data-hover="reservar"
              className="flex-1 py-3.5 text-white transition-colors text-[10px] uppercase tracking-[0.25em] font-bold rounded-lg"
              style={{ background: '#1a0f0a' }}>
              Reservar Agora
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const Accommodations: React.FC<{ onBookingClick?: () => void }> = ({ onBookingClick }) => {
  const sectionRef = useRef<HTMLElement>(null!);
  const slider = useRef<HTMLDivElement>(null!);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [currentPanel, setCurrentPanel] = useState(0);
  const panelRef = useRef(0);
  const animatingRef = useRef(false);
  const lastWheelTimeFwd = useRef(0);
  const lastWheelTimeBack = useRef(0);

  const TRANSITION_MS = 1100;
  const BACK_COOLDOWN_MS = 400;

  const totalPanels = CABINS.length + 1;

  const goToPanel = useCallback((index: number) => {
    const duration = TRANSITION_MS / 1000;
    const clamped = Math.max(0, Math.min(totalPanels - 1, index));
    if (clamped === panelRef.current) return;

    panelRef.current = clamped;
    setCurrentPanel(clamped);
    animatingRef.current = true;

    gsap.killTweensOf(slider.current.querySelectorAll('.panel'));
    gsap.to(slider.current.querySelectorAll('.panel'), {
      xPercent: -100 * clamped,
      duration,
      ease: 'power3.inOut',
      onComplete: () => { animatingRef.current = false; },
    });
  }, [totalPanels]);

  // Wheel: always preventDefault and use window.scrollBy at boundaries.
  // Relying on event propagation through overflow:hidden doesn't work reliably.
  useEffect(() => {
    const section = sectionRef.current;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const px = e.deltaMode === 0 ? e.deltaY
        : e.deltaMode === 1 ? e.deltaY * 32
        : e.deltaY * window.innerHeight;

      const now = Date.now();

      if (e.deltaY < 0) {
        // Scrolling UP: navigate backward, or exit via window.scrollBy
        if (panelRef.current === 0) {
          window.scrollBy({ top: px, behavior: 'auto' });
          return;
        }
        if (now - lastWheelTimeBack.current < BACK_COOLDOWN_MS) return;
        lastWheelTimeBack.current = now;
        goToPanel(panelRef.current - 1);
      } else {
        // Scrolling DOWN: advance the showcase, or exit via window.scrollBy
        if (panelRef.current >= totalPanels - 1) {
          window.scrollBy({ top: px, behavior: 'auto' });
          return;
        }
        if (animatingRef.current || now - lastWheelTimeFwd.current < TRANSITION_MS) return;
        lastWheelTimeFwd.current = now;
        goToPanel(panelRef.current + 1);
      }
    };
    section.addEventListener('wheel', onWheel, { passive: false });
    return () => section.removeEventListener('wheel', onWheel);
  }, [goToPanel, totalPanels]);

  // Touch: horizontal swipe
  useEffect(() => {
    const section = sectionRef.current;
    let startX = 0;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 40) return;
      goToPanel(panelRef.current + (dx < 0 ? 1 : -1));
    };
    section.addEventListener('touchstart', onTouchStart, { passive: true });
    section.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      section.removeEventListener('touchstart', onTouchStart);
      section.removeEventListener('touchend', onTouchEnd);
    };
  }, [goToPanel]);

  // Reset to panel 0 when section scrolls entirely above the viewport
  useEffect(() => {
    const section = sectionRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && entry.boundingClientRect.bottom < 0) {
        panelRef.current = 0;
        setCurrentPanel(0);
        gsap.set(slider.current.querySelectorAll('.panel'), { xPercent: 0 });
      }
    }, { threshold: 0 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Resize: re-snap to current panel without animation
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        gsap.set(slider.current?.querySelectorAll('.panel'), { xPercent: -100 * panelRef.current });
      }, 200);
    };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(timer); window.removeEventListener('resize', onResize); };
  }, []);

  // Keyboard: arrows when section is in view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToPanel(panelRef.current + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPanel(panelRef.current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToPanel]);

  return (
    <>
      <section
        ref={sectionRef}
        style={{ background: '#0d0a08', overscrollBehavior: 'none' }}
        className="relative h-screen overflow-hidden"
      >
        <div
          ref={slider}
          className="relative flex h-full items-center"
          style={{ width: `${totalPanels * 100}vw` }}
        >
          {/* Intro slide */}
          <div className="panel w-screen h-screen flex items-center justify-center px-6 md:px-20 relative overflow-hidden" style={{ contain: 'layout paint' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(195,163,122,0.06) 0%, transparent 70%)' }} />
            <div className="max-w-4xl relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex items-center gap-3 mb-8"
              >
                <div className="h-px flex-1 max-w-[40px]" style={{ background: 'rgba(195,163,122,0.4)' }} />
                <span className="uppercase tracking-[0.45em] text-[10px] font-medium" style={{ color: '#c3a37a' }}>
                  Acomodações
                </span>
              </motion.div>
              <motion.h2
                className="font-serif text-5xl md:text-7xl lg:text-[86px] italic mb-8 leading-[1.05]"
                style={{ color: '#f5ede0' }}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
              >
                onde se volta ao <br />
                <span style={{ color: '#c3a37a' }}>princípio de tudo.</span>
              </motion.h2>
              <p className="max-w-md text-lg leading-relaxed mb-12" style={{ color: 'rgba(245,237,224,0.45)' }}>
                Cada espaço foi desenhado como um portal individual — unindo arquitetura sustentável ao luxo contemporâneo.
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="font-serif text-4xl italic mb-1" style={{ color: '#c3a37a' }}>5</div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(245,237,224,0.35)' }}>Acomodações</div>
                </div>
                <div className="w-px h-10" style={{ background: 'rgba(195,163,122,0.2)' }} />
                <div className="text-center">
                  <div className="font-serif text-4xl italic mb-1" style={{ color: '#c3a37a' }}>90m²</div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(245,237,224,0.35)' }}>Cada Cabana</div>
                </div>
                <div className="w-px h-10" style={{ background: 'rgba(195,163,122,0.2)' }} />
                <div className="text-center">
                  <div className="font-serif text-4xl italic mb-1" style={{ color: '#c3a37a' }}>∞</div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(245,237,224,0.35)' }}>Memórias</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cabin slides */}
          {CABINS.map((cabin, index) => (
            <div
              key={cabin.id}
              className="panel w-screen h-screen flex items-center justify-center relative overflow-hidden"
              style={{ contain: 'layout paint style' }}
            >
              {/* Full-bleed background */}
              <div className="absolute inset-0 z-0">
                <img
                  src={cabin.mainImage}
                  alt=""
                  aria-hidden="true"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding={index === 0 ? 'sync' : 'async'}
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.22) saturate(0.8)' }}
                />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(8,5,3,0.85) 0%, rgba(8,5,3,0.4) 50%, rgba(8,5,3,0.75) 100%)' }} />
              </div>

              {/* Content */}
              <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-16 xl:px-20 grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-16 items-center">
                {/* Left — image card */}
                <div
                  className="relative group overflow-hidden rounded-2xl cursor-pointer"
                  style={{ aspectRatio: '4/3', maxHeight: '62vh' }}
                  onClick={() => setSelectedCabin(cabin)}
                >
                  <img
                    src={cabin.mainImage}
                    alt={cabin.title}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding={index === 0 ? 'sync' : 'async'}
                    className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
                  <div className="absolute top-5 left-5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-full border"
                      style={{ color: '#c3a37a', borderColor: 'rgba(195,163,122,0.35)', background: 'rgba(0,0,0,0.45)' }}>
                      #{cabin.id}
                    </span>
                  </div>
                  <div className="absolute top-5 right-5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-widest border"
                    style={{ color: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.35)' }}>
                    {cabin.gallery.length + 1} fotos
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill="#c3a37a" style={{ color: '#c3a37a' }} />
                      ))}
                    </div>
                    <p className="text-white/90 text-xs font-medium">Ver galeria completa →</p>
                  </div>
                </div>

                {/* Right — info */}
                <div className="space-y-5 lg:space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {cabin.tags.map(tag => (
                      <span key={tag}
                        className="px-3 py-1 rounded-full text-[9px] uppercase tracking-widest border"
                        style={{ color: 'rgba(195,163,122,0.85)', borderColor: 'rgba(195,163,122,0.22)', background: 'rgba(195,163,122,0.06)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-serif text-4xl md:text-5xl xl:text-6xl leading-tight mb-2" style={{ color: '#f5ede0' }}>
                      {cabin.title}
                    </h3>
                    {cabin.highlight && (
                      <div className="flex items-center gap-2">
                        <Sparkles size={11} style={{ color: '#c3a37a' }} />
                        <span className="text-[11px] italic" style={{ color: 'rgba(195,163,122,0.8)' }}>
                          {cabin.highlight}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-6 py-4 border-y text-[10px] uppercase tracking-[0.2em] font-medium"
                    style={{ borderColor: 'rgba(195,163,122,0.12)', color: 'rgba(195,163,122,0.45)' }}>
                    <div>Capacidade&ensp;<span style={{ color: '#f5ede0' }}>{cabin.capacity}</span></div>
                    <div>Quartos&ensp;<span style={{ color: '#f5ede0' }}>{cabin.rooms}</span></div>
                    <div>Mín.&ensp;<span style={{ color: '#f5ede0' }}>{cabin.nights} noites</span></div>
                  </div>
                  <p className="text-base leading-relaxed max-w-md" style={{ color: 'rgba(245,237,224,0.55)' }}>
                    {cabin.shortDescription}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {cabin.amenities.slice(0, 6).map(a => (
                      <div key={a} className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(245,237,224,0.45)' }}>
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#c3a37a' }} />
                        {a}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={onBookingClick}
                      data-hover="reservar"
                      className="flex-1 py-4 text-[10px] uppercase tracking-[0.3em] font-bold rounded-xl transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                      style={{ background: '#c3a37a', color: '#0d0a08' }}
                    >
                      Reservar Agora
                    </button>
                    <button
                      data-hover="detalhes"
                      onClick={() => setSelectedCabin(cabin)}
                      className="flex-1 py-4 text-[10px] uppercase tracking-[0.3em] font-medium rounded-xl border transition-all duration-300 hover:border-opacity-60"
                      style={{ color: '#f5ede0', borderColor: 'rgba(245,237,224,0.18)', background: 'rgba(245,237,224,0.04)' }}
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>

              {/* Slide indicators */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {CABINS.map((c) => (
                  <div key={c.id}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: c.id === cabin.id ? 20 : 6,
                      height: 4,
                      background: c.id === cabin.id ? '#c3a37a' : 'rgba(195,163,122,0.25)',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Prev arrow */}
        {currentPanel > 0 && (
          <button
            onClick={() => goToPanel(currentPanel - 1)}
            aria-label="Painel anterior"
            className="absolute left-5 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full flex items-center justify-center border border-white/15 hover:bg-white/10 transition-colors"
            style={{ background: 'rgba(0,0,0,0.35)' }}
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
        )}

        {/* Next arrow */}
        {currentPanel < totalPanels - 1 && (
          <button
            onClick={() => goToPanel(currentPanel + 1)}
            aria-label="Próximo painel"
            className="absolute right-5 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full flex items-center justify-center border border-white/15 hover:bg-white/10 transition-colors"
            style={{ background: 'rgba(0,0,0,0.35)' }}
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        )}
      </section>

      <AnimatePresence>
        {selectedCabin && (
          <AccommodationModal
            cabin={selectedCabin}
            onClose={() => setSelectedCabin(null)}
            onBookingClick={onBookingClick}
          />
        )}
      </AnimatePresence>
    </>
  );
};
