import type {
  PersonDates,
  SpouseDates,
} from '@ks/app/components/actions/types';

import {
  dateLine,
  dateWords,
  spouseLine,
  spouseWords,
} from '@ks/app/components/actions/dates';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/actions/DateText.module.css';

/**
 * A line of dates in Mono. Give it the dates of a Person or the dates of a spouse link. A screen
 * reader hears the dates in words and skips the line.
 */
export const DateText = (
  props: { dates: PersonDates } | { spouse: SpouseDates }
) => {
  const [line, words] =
    'dates' in props
      ? [dateLine(props.dates), dateWords(props.dates)]
      : [spouseLine(props.spouse), spouseWords(props.spouse)];

  return (
    <span className={styles.date}>
      <span className={styles.hidden}>{words}</span>
      <Text aria-hidden='true' variant='monoCaption'>
        {line}
      </Text>
    </span>
  );
};
