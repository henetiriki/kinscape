'use client';

import type { Epoch } from '@ks/lib/ui/types';

import styles from '@ks/features/map/components/JumpTo.module.css';

/** A row of epochs to jump to. The epoch the Map date is in is outlined and marked current. */
export const JumpTo = ({
  current,
  epochs,
  onJump,
}: {
  current?: number;
  epochs: Epoch[];
  onJump: (year: number) => void;
}) => (
  <div className={styles.jump}>
    <span className={styles.caption}>Jump to</span>
    {epochs.map(({ label, year }) => (
      <button
        aria-current={year === current || undefined}
        className={styles.epoch}
        key={year}
        onClick={() => onJump(year)}
        type='button'>
        {label ?? year}
      </button>
    ))}
  </div>
);
