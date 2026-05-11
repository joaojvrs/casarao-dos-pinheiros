import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export const CustomCursor: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverText, setHoverText] = useState('');
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleHoverStart = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const hoverData = target.closest('[data-hover]');
      if (hoverData) {
        setIsHovering(true);
        setHoverText(hoverData.getAttribute('data-hover') || '');
      }
    };

    const handleHoverEnd = () => {
      setIsHovering(false);
      setHoverText('');
    };

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseover', handleHoverStart);
    document.addEventListener('mouseout', handleHoverEnd);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleHoverStart);
      document.removeEventListener('mouseout', handleHoverEnd);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-gold rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
      <motion.div
        className="fixed top-0 left-0 flex items-center justify-center border border-gold/30 rounded-full pointer-events-none z-[9998]"
        animate={{
          width: isHovering ? 100 : 40,
          height: isHovering ? 100 : 40,
          backgroundColor: isHovering ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
        }}
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        {isHovering && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[10px] uppercase tracking-[0.2em] font-medium text-gold"
          >
            {hoverText}
          </motion.span>
        )}
      </motion.div>
      
      {/* Particle trail (simplified for performance) */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-gold/20 rounded-full blur-sm pointer-events-none z-[9997]"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: [1, 2, 0],
          opacity: [0.5, 0],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
        }}
      />
    </>
  );
};
