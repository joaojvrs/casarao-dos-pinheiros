import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const HeroParticles = lazy(() => import('./HeroParticles').then(m => ({ default: m.HeroParticles })));

interface HeroProps {
  onWeddingClick?: () => void;
  onBookingClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onWeddingClick, onBookingClick }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const [allowEnhancedMotion, setAllowEnhancedMotion] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.18 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setAllowEnhancedMotion(false);
      return;
    }

    const query = window.matchMedia('(min-width: 768px) and (pointer: fine)');
    const update = () => setAllowEnhancedMotion(query.matches);

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [reduceMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isVisible || reduceMotion) {
      video.pause();
      return;
    }

    const playPromise = video.play();
    if (playPromise) playPromise.catch(() => undefined);
  }, [isVisible, reduceMotion]);

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-beige">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover brightness-[0.7] grayscale-[0.2]"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
      </div>

      {/* 3D Background Overlay */}
      <div className="absolute inset-0 z-10 opacity-30 pointer-events-none">
        {allowEnhancedMotion && isVisible && (
          <Suspense fallback={null}>
            <HeroParticles />
          </Suspense>
        )}
      </div>

      {/* Fog Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-transparent to-beige pointer-events-none" />
      
      {/* Main Content */}
      <div className="relative z-20 container mx-auto px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <span className="text-white uppercase tracking-[0.4em] text-xs font-medium drop-shadow-md">
            Bem-vindo ao Casarão Vale do Eden Reserva
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-6xl md:text-8xl lg:text-9xl mb-8 leading-tight text-white drop-shadow-2xl"
        >
          Casarão <br />
          <span className="italic font-light opacity-80">Vale do Eden Reserva</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1 }}
          className="max-w-xl text-white/80 text-sm md:text-base leading-relaxed tracking-wide font-light mb-12 drop-shadow-lg"
        >
          Onde o luxo da exclusividade encontra a inteligência da natureza. 
          Uma jornada digital imersiva sob a sombra dos pinheiros.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="flex flex-col items-center gap-5"
        >
          {/* Botão primário — Iniciar Experiência */}
          <button
            onClick={onBookingClick}
            data-hover="reservar"
            className="group relative px-12 py-4 overflow-hidden rounded-full transition-all duration-300 hover:shadow-[0_0_32px_rgba(255,255,255,0.25)]"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.7)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="relative z-10 text-xs uppercase tracking-[0.25em] font-semibold text-white group-hover:text-black transition-colors duration-300 drop-shadow-sm">
              Gerar Reserva
            </span>
            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0 rounded-full" />
          </button>

          {/* Botão secundário — Casamentos */}
          {onWeddingClick && (
            <motion.button
              onClick={onWeddingClick}
              data-hover="casamento"
              className="group relative px-12 py-4 overflow-hidden rounded-full transition-all duration-300 hover:shadow-[0_0_32px_rgba(195,163,122,0.35)]"
              style={{
                background: 'rgba(195,163,122,0.12)',
                border: '1.5px solid rgba(195,163,122,0.85)',
                backdropFilter: 'blur(8px)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.8 }}
            >
              <span
                className="relative z-10 text-xs uppercase tracking-[0.25em] font-semibold transition-colors duration-300 group-hover:text-black drop-shadow-sm"
                style={{ color: '#e8d4b8' }}
              >
                ✦ Casamentos na Chapel
              </span>
              <motion.div
                className="absolute inset-0 origin-bottom rounded-full"
                style={{ background: 'rgba(195,163,122,0.95)' }}
                initial={{ scaleY: 0 }}
                whileHover={{ scaleY: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.button>
          )}
          
          <div className="mt-20 animate-bounce text-white/30">
            <div className="w-[1px] h-12 bg-gradient-to-b from-white/0 to-white mx-auto" />
          </div>
        </motion.div>
      </div>

      {/* Interactive Bottom Mask */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-beige to-transparent z-30" />
    </section>
  );
};
