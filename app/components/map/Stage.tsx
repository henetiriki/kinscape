import type { ReactNode } from 'react';

import styles from './Stage.module.css';

/** The slots, in the order they stack; a phone shows `layers` and hides `account`, `zoom` and `credits`. */
const SLOTS = [
  'search',
  'account',
  'zoom',
  'layers',
  'panel',
  'dock',
  'credits',
  'overlay',
] as const;

type Slot = (typeof SLOTS)[number];

/**
 * The map screen's frame: the map is `children`, and each slot is a placed box over it.
 * Desktop and phone forms switch at `breakpoint`; every edge is a `layout` token.
 */
export const Stage = ({
  children,
  ...slots
}: { children?: ReactNode } & Partial<Record<Slot, ReactNode>>) => (
  <div className={styles.stage}>
    {children}
    {SLOTS.map(
      slot =>
        slots[slot] && (
          <div className={styles[slot]} data-slot={slot} key={slot}>
            {slots[slot]}
          </div>
        )
    )}
  </div>
);
