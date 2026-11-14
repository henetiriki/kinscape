import type { ComponentProps } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { Icon } from '@ks/app/components/foundation/Icon';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/actions/PersonRow.module.css';

/** The phone line: a range, a range that ends in "deceased", or "Born" and the date. */
const phoneLine = (born: string, died?: string, deceased?: boolean) => {
  if (died) {
    return `${born} – ${died}`;
  }

  return deceased ? `${born} – deceased` : `Born ${born}`;
};

/**
 * One row of the people list, and one link to edit the Person. The page gives the dates as text.
 * Died reads `died`, then "Deceased" when `deceased`, then "—". With `form='phone'` the row is a
 * read-only `div`: the name, then one line of dates and the note.
 */
export const PersonRow = ({
  born,
  deceased,
  died,
  form,
  givenNames,
  maidenName,
  matchedVariant,
  state,
  surname,
  ...rest
}: {
  born: string;
  /** Marked deceased with no date. */
  deceased?: boolean;
  died?: string;
  /** `phone`: a row that is no link. */
  form?: 'phone';
  givenNames: string;
  href: string;
  maidenName?: string;
  /** A spelling variant that matched the filter when the name did not. */
  matchedVariant?: string;
  state?: ControlState;
  surname: string;
} & Omit<ComponentProps<'a'>, 'children' | 'className' | 'href'>) => {
  const note = [
    maidenName && `née ${maidenName}`,
    matchedVariant && `Matches the spelling “${matchedVariant}”`,
  ]
    .filter(Boolean)
    .join(' · ');

  if (form === 'phone') {
    return (
      <div className={styles.phone}>
        <Text as='span' variant='title'>
          {surname}, {givenNames}
        </Text>
        <span className={styles.line}>
          <Text variant='mono'>{phoneLine(born, died, deceased)}</Text>
          {note && <Text variant='small'>{note}</Text>}
        </span>
      </div>
    );
  }

  return (
    <a className={styles.row} data-state={state} {...rest}>
      <span className={styles.name}>
        <Text as='span' variant='title'>
          {surname}, {givenNames}
        </Text>
        {note && <Text variant='small'>{note}</Text>}
      </span>
      <span className={styles.date}>
        <span className={styles.hidden}>Born </span>
        <Text variant='mono'>{born}</Text>
      </span>
      <span className={styles.date}>
        <span className={styles.hidden}>Died </span>
        <Text variant='mono'>{died || (deceased ? 'Deceased' : '—')}</Text>
      </span>
      <span className={styles.edit}>
        Edit
        <Icon name='forward' size={16} />
      </span>
    </a>
  );
};
