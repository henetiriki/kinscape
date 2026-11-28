import { LoadingBar } from '@ks/app/components/feedback/LoadingBar';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/feedback/LoadingField.module.css';

/**
 * A field that is still loading: its label over one bar, or over two bars for a text area. Two bars
 * are as high as a text area of two rows (66px), and one bar is as high as a field (42px), so the form
 * does not move when the field replaces them. The form that holds it sets `aria-busy`, so a screen
 * reader skips the bars.
 */
export const LoadingField = ({
  label,
  widths,
}: {
  label: string;
  /** The width of each bar, top to bottom. One bar stands for an input, two for a text area. */
  widths: readonly [number, number] | readonly [number];
}) => (
  <div className={styles.field}>
    <Text variant='label'>{label}</Text>
    <div
      className={styles.bars}
      data-rows={widths.length}
      data-testid='loading-bars'>
      {widths.map((width, index) => (
        <LoadingBar key={index} width={width} />
      ))}
    </div>
  </div>
);
