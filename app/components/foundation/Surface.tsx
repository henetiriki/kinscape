import type { ReactNode } from 'react';

import type { SurfaceLevel } from './types';

import styles from './Surface.module.css';

/** A white surface above the map; the higher the level, the more it interrupts. */
export const Surface = ({
  children,
  className,
  level,
}: {
  children: ReactNode;
  className?: string;
  level: SurfaceLevel;
}) => (
  <div className={className ? `${styles[level]} ${className}` : styles[level]}>
    {children}
  </div>
);
