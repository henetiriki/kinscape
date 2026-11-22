import type { CSSProperties, ReactNode } from 'react';

import styles from '@ks/app/components/overlays/PlacedAt.module.css';

/**
 * A popup at a map point, in pixels from the corner of the overlay area: left of the point,
 * `gap` away, with the point `popup-point-y` down its right edge. Near the top of the map the
 * popup stops at the free area, and its pointer keeps pointing at the point.
 */
export const PlacedAt = ({
  children,
  gap,
  x,
  y,
}: {
  children: ReactNode;
  /** The layout token for the space between the popup and the point. */
  gap: 'pin-popup-gap' | 'popup-gap';
  x: number;
  y: number;
}) => (
  <div
    className={styles.placed}
    data-testid='placed-at'
    style={
      {
        '--gap': `var(--layout-${gap})`,
        '--x': `${x}px`,
        '--y': `${y}px`,
      } as CSSProperties
    }>
    {children}
  </div>
);
