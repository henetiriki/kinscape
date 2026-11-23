import type { ComponentProps, ReactNode } from 'react';

import type { PersonDates } from '@ks/app/components/actions/types';
import type { ControlState } from '@ks/app/components/foundation/types';

import { ArrowLink } from '@ks/app/components/actions/ArrowLink';
import { personNote } from '@ks/app/components/actions/dates';
import { DateText } from '@ks/app/components/actions/DateText';
import { TextLink } from '@ks/app/components/actions/TextLink';
import { KitLink } from '@ks/app/components/foundation/link';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/actions/PersonRow.module.css';

const PhoneRow = ({
  dates,
  name,
  note,
}: {
  dates: ReactNode;
  name: ReactNode;
  note: ReactNode;
}) => (
  <div className={styles.phone}>
    {name}
    <span className={styles.line}>
      {dates}
      {note}
    </span>
  </div>
);

const WithLink = ({
  children,
  href,
  owner,
}: {
  children: ReactNode;
  href: string;
  owner: string;
}) => (
  <div className={styles.withLink}>
    {children}
    <TextLink href={href}>
      Relationships
      <span className={styles.hidden}>, {owner}</span>
    </TextLink>
  </div>
);

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
  const noteLine = note && <Text variant='small'>{note}</Text>;

  if (form === 'phone') {
    return <PhoneRow dates={dates} name={name} note={noteLine} />;
  }

  const row = (
    <KitLink className={styles.row} data-state={state} href={href} {...rest}>
      <span className={styles.name}>
        {name}
        {noteLine}
      </span>
      {dates}
      <ArrowLink>Edit</ArrowLink>
    </KitLink>
  );

  if (!relationshipsHref) return row;

  return (
    <WithLink href={relationshipsHref} owner={`${surname}, ${givenNames}`}>
      {row}
    </WithLink>
  );
};
