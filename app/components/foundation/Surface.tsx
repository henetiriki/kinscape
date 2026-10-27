import type { ReactNode } from 'react';

import type { SurfaceLevel } from '@ks/app/components/foundation/types';

import styles from '@ks/app/components/foundation/Surface.module.css';

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
