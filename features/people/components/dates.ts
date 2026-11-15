import type { PersonDates } from '@ks/app/components/actions/types';
import type { PersonSummary } from '@ks/lib/domain/persons/types';

/** The date fields of a row, for a component that takes `PersonDates`. */
export const datesOf = ({
  born,
  bornReading,
  deceased,
  died,
  diedReading,
}: PersonSummary): PersonDates => ({
  born,
  bornReading,
  deceased,
  died,
  diedReading,
});
