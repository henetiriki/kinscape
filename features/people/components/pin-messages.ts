import type { PinFieldErrors } from '@ks/lib/domain/pins/types.ts';
import type { CoordinateError } from '@ks/lib/domain/places/coordinates.mts';

import { fuzzyDateMessage } from '@ks/lib/domain/dates/fuzzy-date-text.mts';
import { MAX_ADDRESS } from '@ks/lib/domain/pins/schemas.mts';

/** The Event types as the form lists them, after the empty choice. A test keeps the list equal to `EVENT_TYPES`. */
export const EVENT_OPTIONS = [
  { label: 'Choose an event type', value: '' },
  { label: 'Birth', value: 'birth' },
  { label: 'Baptism or christening', value: 'baptism' },
  { label: 'Residence', value: 'residence' },
  { label: 'Marriage', value: 'marriage' },
  { label: 'Divorce', value: 'divorce' },
  { label: 'Death', value: 'death' },
  { label: 'Burial', value: 'burial' },
  { label: 'Land ownership', value: 'land' },
  { label: 'Occupation', value: 'occupation' },
  { label: 'Other', value: 'other' },
];

const DECIMAL = 'Use decimal degrees, such as -33.93, 18.42.';

const COORDINATE_MESSAGES: Record<CoordinateError, string> = {
  dms: 'Use decimal degrees, not degrees, minutes and seconds. For example -33.93, 18.42.',
  'not-decimal': DECIMAL,
  'out-of-range': DECIMAL,
  required: 'Enter the coordinates.',
};

/** The error text under each field of the Pin form that has one. */
export type PinMessages = {
  address?: string;
  coordinates?: string;
  date?: string;
  eventType?: string;
  personId?: string;
};

/**
 * The texts of the field errors (PIN-01, PIN-02). `coordinates` is the reading error of the point
 * field, which `checkPin` does not see. `dateText` is the date as typed: two date errors quote it.
 */
export const pinMessages = (
  fields: PinFieldErrors['fields'],
  coordinates: CoordinateError | undefined,
  dateText: string
): PinMessages => ({
  address: fields.address && `Use ${MAX_ADDRESS} characters or fewer.`,
  coordinates: coordinates && COORDINATE_MESSAGES[coordinates],
  date:
    fields.date &&
    (fields.date === 'required'
      ? 'Enter a date.'
      : fuzzyDateMessage(fields.date, dateText)),
  eventType: fields.eventType && 'Choose an event type.',
  personId: fields.personId && 'Choose a person.',
});
