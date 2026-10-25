import type { Precision } from '@/lib/map/map-date';

import styles from './DateKeyHints.module.css';
import { KeyHint } from '@/app/components/actions/KeyHint';

/** What the arrow keys do on the slider. */
export const DateKeyHints = ({ precision }: { precision: Precision }) => (
  <span className={styles.hints}>
    <KeyHint>←</KeyHint>
    <KeyHint>→</KeyHint>1 {precision} · with <KeyHint>Shift</KeyHint>×10
  </span>
);
