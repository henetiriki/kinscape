import type { ReactNode } from 'react';

import styles from './Surface.module.css';

export type SurfaceLevel = 'floating' | 'modal' | 'raised' | 'sheet';

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
