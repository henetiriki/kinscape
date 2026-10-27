import type { Precision } from '@/lib/map/types';

import { KeyHint } from '@/app/components/actions/KeyHint';

import styles from '@ks/app/components/map/DateKeyHints.module.css';

/** What the arrow keys do on the slider. */
export const DateKeyHints = ({ precision }: { precision: Precision }) => (
  <span className={styles.hints}>
    <KeyHint>←</KeyHint>
    <KeyHint>→</KeyHint>1 {precision} · with <KeyHint>Shift</KeyHint>×10
  </span>
);
