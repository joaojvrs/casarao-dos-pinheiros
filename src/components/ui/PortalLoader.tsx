import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const PortalLoader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] }
          }}
          className="fixed inset-0 z-[1000] bg-beige flex items-center justify-center overflow-hidden"
        >
          {/* Background Fog */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute inset-0 bg-brown/5 blur-[100px] rounded-full"
          />

          <div className="relative flex flex-col items-center">
            {/* Luminous Lines / Circle */}
            <svg width="300" height="300" viewBox="0 0 100 100" className="absolute">
              <motion.circle
                cx="50"
                cy="50"
                r="48"
                stroke="#3d2b1f"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0, rotate: -90, opacity: 0 }}
                animate={{ pathLength: 1, rotate: 270, opacity: [0, 1, 0.5] }}
                transition={{ duration: 3, ease: 'easeInOut' }}
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="#3d2b1f"
                strokeWidth="0.2"
                fill="none"
                initial={{ pathLength: 0, rotate: 90, opacity: 0 }}
                animate={{ pathLength: 1, rotate: -270, opacity: [0, 0.5, 0.2] }}
                transition={{ duration: 2.5, ease: 'easeInOut', delay: 0.5 }}
              />
            </svg>

            {/* Logo/Text Reveal */}
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 2, delay: 1 }}
              className="text-center z-10"
            >
              <h1 className="font-serif text-3xl md:text-4xl text-brown tracking-[0.5em] uppercase mb-1">
                Casarão
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-brown/60 mb-4">
                dos Pinheiros
              </p>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, delay: 1.5 }}
                className="h-px bg-brown/10 w-full"
              />
              <p className="text-[8px] uppercase tracking-[0.3em] text-brown/30 mt-4">
                Iniciando Interface Sensorial
              </p>
            </motion.div>

            {/* Particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2,
                  delay: 1 + Math.random(),
                  repeat: Infinity
                }}
                className="absolute w-1 h-1 bg-brown/20 rounded-full blur-[1px]"
              />
            ))}
          </div>

          {/* Flash Effect on Exit */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={!isLoading ? { opacity: 1 } : { opacity: 0 }}
            className="absolute inset-0 bg-white pointer-events-none z-[1001]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
