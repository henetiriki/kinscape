import type { ComponentProps } from 'react';

import type { PersonDates } from '@ks/app/components/actions/types';
import type { ControlState } from '@ks/app/components/foundation/types';

import {
  dateLine,
  dateWords,
  personNote,
} from '@ks/app/components/actions/dates';
import { DateText } from '@ks/app/components/actions/DateText';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/actions/PickerRow.module.css';

/**
 * One Person in a picker: the name, the line of dates and the note of `PersonRow`. The whole row
 * is one button that picks the Person. It has no phone form.
 */
export const PickerRow = ({
  born,
  bornReading,
  deceased,
  died,
  diedReading,
  givenNames,
  maidenName,
  matchedVariant,
  state,
  surname,
  ...rest
}: {
  givenNames: string;
  maidenName?: string;
  /** A spelling variant that matched the filter. */
  matchedVariant?: string;
  state?: ControlState;
  surname: string;
} & Omit<ComponentProps<'button'>, 'children' | 'className' | 'type'> &
  PersonDates) => {
  const note = personNote(maidenName, matchedVariant);

  return (
    <button className={styles.row} data-state={state} type='button' {...rest}>
      <span className={styles.name}>
        <Text as='span' variant='title'>
          {surname}, {givenNames}
        </Text>
        {note && <Text variant='small'>{note}</Text>}
      </span>
      <DateText
        line={dateLine({ born, deceased, died })}
        words={dateWords({ born, bornReading, deceased, died, diedReading })}
      />
    </button>
  );
};
