import type {
  PersonDates,
  SpouseDates,
} from '@ks/app/components/actions/types';
import type { ControlState } from '@ks/app/components/foundation/types';

import { spouseLine } from '@ks/app/components/actions/dates';
import { DateText } from '@ks/app/components/actions/DateText';
import { Icon } from '@ks/app/components/foundation/Icon';
import { KitLink } from '@ks/app/components/foundation/link';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/actions/RelationshipRow.module.css';

const SUBTYPES = {
  adoptive: 'Adoptive',
  biological: 'Biological',
  step: 'Step',
};

/**
 * One relationship of a Person. It shows the other Person's name and the line of dates. A parent
 * or child row adds the subtype. A spouse row adds the marriage and divorce dates. It has one
 * "Edit" link. It has no remove control and no phone form.
 */
export const RelationshipRow = ({
  born,
  bornReading,
  deceased,
  died,
  diedReading,
  divorced,
  divorcedReading,
  givenNames,
  href,
  married,
  marriedReading,
  state,
  subtype,
  surname,
}: {
  givenNames: string;
  /** The edit page of the relationship. */
  href: string;
  state?: ControlState;
  /** A parent or child link. A spouse link has none. */
  subtype?: keyof typeof SUBTYPES;
  surname: string;
} & PersonDates &
  SpouseDates) => {
  const spouse = { divorced, divorcedReading, married, marriedReading };
  const marriage = spouseLine(spouse);

  return (
    <div className={styles.row}>
      <span className={styles.name}>
        <Text as='span' variant='title'>
          {surname}, {givenNames}
        </Text>
        {subtype && <Text variant='small'>{SUBTYPES[subtype]}</Text>}
      </span>
      <span className={styles.dates}>
        <DateText dates={{ born, bornReading, deceased, died, diedReading }} />
        {marriage && <DateText spouse={spouse} />}
      </span>
      <KitLink className={styles.edit} data-state={state} href={href}>
        Edit
        <Icon name='forward' size={16} />
        <span className={styles.hidden}>
          , {surname}, {givenNames}
        </span>
      </KitLink>
    </div>
  );
};
