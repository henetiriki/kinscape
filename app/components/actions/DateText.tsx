import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/actions/DateText.module.css';

/** A line of dates in Mono. A screen reader hears `words` and skips `line`. */
export const DateText = ({ line, words }: { line: string; words: string }) => (
  <span className={styles.date}>
    <span className={styles.hidden}>{words}</span>
    <Text aria-hidden='true' variant='mono'>
      {line}
    </Text>
  </span>
);
