import type { ComponentProps } from 'react';

import type { PersonDates } from '@ks/app/components/actions/types';
import type { ControlState } from '@ks/app/components/foundation/types';

import { personNote } from '@ks/app/components/actions/dates';
import { DateText } from '@ks/app/components/actions/DateText';
import { TextLink } from '@ks/app/components/actions/TextLink';
import { Icon } from '@ks/app/components/foundation/Icon';
import { KitLink } from '@ks/app/components/foundation/link';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/actions/PersonRow.module.css';

/**
 * One row of the people list, and one link to edit the Person. The page gives each date as short
 * text and as a reading (see `PersonDates`). With `relationshipsHref` the row also has a
 * "Relationships" link, so it is a `div` with two links. With `form='phone'` the row is a
 * read-only `div`: the name, then the line of dates and the note.
 */
export const PersonRow = ({
  born,
  bornReading,
  deceased,
  died,
  diedReading,
  form,
  givenNames,
  href,
  maidenName,
  matchedVariant,
  relationshipsHref,
  state,
  surname,
  ...rest
}: {
  /** `phone`: a row that is no link. */
  form?: 'phone';
  givenNames: string;
  href: string;
  maidenName?: string;
  /** A spelling variant that matched the filter when the name did not. */
  matchedVariant?: string;
  /** Adds a "Relationships" link beside the edit link. */
  relationshipsHref?: string;
  state?: ControlState;
  surname: string;
} & Omit<ComponentProps<'a'>, 'children' | 'className' | 'href'> &
  PersonDates) => {
  const note = personNote(maidenName, matchedVariant);
  const dates = (
    <DateText dates={{ born, bornReading, deceased, died, diedReading }} />
  );
  const name = (
    <Text as='span' variant='title'>
      {surname}, {givenNames}
    </Text>
  );

  if (form === 'phone') {
    return (
      <div className={styles.phone}>
        {name}
        <span className={styles.line}>
          {dates}
          {note && <Text variant='small'>{note}</Text>}
        </span>
      </div>
    );
  }

  const row = (
    <KitLink className={styles.row} data-state={state} href={href} {...rest}>
      <span className={styles.name}>
        {name}
        {note && <Text variant='small'>{note}</Text>}
      </span>
      {dates}
      <span className={styles.edit}>
        Edit
        <Icon name='forward' size={16} />
      </span>
    </KitLink>
  );

  if (!relationshipsHref) return row;

  return (
    <div className={styles.withLink}>
      {row}
      <TextLink href={relationshipsHref}>
        Relationships
        <span className={styles.hidden}>
          , {surname}, {givenNames}
        </span>
      </TextLink>
    </div>
  );
};
