import { LoadingBar } from '@ks/app/components/feedback/LoadingBar';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/feedback/LoadingField.module.css';

/**
 * A field that is still loading: its label over one bar, or over two bars for a text area. The
 * height matches the field that replaces it, so the form does not jump. The form that holds it sets
 * `aria-busy`, so a screen reader skips the bars.
 */
export const LoadingField = ({
  label,
  widths,
}: {
  label: string;
  /** The width of each bar, top to bottom. One bar stands for an input, two for a text area. */
  widths: readonly [number, number] | readonly [number];
}) => (
  <div className={styles.field} data-field=''>
    <Text variant='label'>{label}</Text>
    <div className={styles.bars} data-rows={widths.length}>
      {widths.map((width, index) => (
        <LoadingBar key={index} width={width} />
      ))}
    </div>
  </div>
);
