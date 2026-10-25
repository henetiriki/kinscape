'use client';

import type { ReactNode } from 'react';

import styles from './BottomSheet.module.css';

/** The phone's non-modal date sheet: the map stays usable behind it. Collapsed or expanded; the grabber toggles it. */
export const BottomSheet = ({
  children,
  expanded,
  onExpandedChange,
}: {
  children: ReactNode;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) => (
  <section
    aria-label='Map date'
    className={styles.sheet}
    data-expanded={expanded || undefined}>
    <button
      aria-expanded={expanded}
      aria-label='Expand the sheet'
      className={styles.grabber}
      onClick={() => onExpandedChange(!expanded)}
      type='button'>
      <span className={styles.handle} />
    </button>
    {children}
  </section>
);
