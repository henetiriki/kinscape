import type { ComponentProps } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { Icon } from '@ks/app/components/foundation/Icon';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/actions/PersonRow.module.css';

/**
 * One row of the people list, and one link to edit the Person. The page gives the dates as text.
 * Died reads `died`, then "Deceased" when `deceased`, then "—".
 */
export const PersonRow = ({
  born,
  deceased,
  died,
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

  return (
    <a className={styles.row} data-state={state} {...rest}>
      <span className={styles.name}>
        <Text as='span' variant='title'>
          {surname}, {givenNames}
        </Text>
        {note && <Text variant='small'>{note}</Text>}
      </span>
      <span>
        <span className={styles.hidden}>Born </span>
        <Text variant='mono'>{born}</Text>
      </span>
      <span>
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
