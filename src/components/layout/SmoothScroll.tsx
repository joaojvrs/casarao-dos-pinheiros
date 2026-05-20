import React, { ReactNode } from 'react';

interface SmoothScrollProps {
  children: ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  return <>{children}</>;
};
