import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';

function ParticleField() {
  const ref = useRef<THREE.Points>(null!);
  const [sphere] = React.useState(() => {
    const positions = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const r = 2 + Math.random() * 3;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  });

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#d4af37"
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export const Hero: React.FC = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-beige">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover brightness-[0.7] grayscale-[0.2]"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
      </div>

      {/* 3D Background Overlay */}
      <div className="absolute inset-0 z-10 opacity-30 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <ParticleField />
        </Canvas>
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
            Bem-vindo ao Casarão dos Pinheiros
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-6xl md:text-8xl lg:text-9xl mb-8 leading-tight text-white drop-shadow-2xl"
        >
          Casarão <br />
          <span className="italic font-light opacity-80">dos Pinheiros</span>
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
          className="flex flex-col items-center gap-4"
        >
          <button 
            data-hover="reservar"
            className="group relative px-10 py-4 overflow-hidden border border-white/30 rounded-full transition-all hover:border-white"
          >
            <span className="relative z-10 text-xs uppercase tracking-[0.2em] font-medium group-hover:text-black transition-colors text-white">
              Iniciar Experiência
            </span>
            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
          </button>
          
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
