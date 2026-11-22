import type { PinMessages } from '@ks/features/people/components/types.ts';
import type { PinFieldErrors } from '@ks/lib/domain/pins/types.ts';
import type { CoordinateError } from '@ks/lib/domain/places/types.ts';

import { fuzzyDateMessage } from '@ks/lib/domain/dates/fuzzy-date-text.mts';
import { MAX_NOTES } from '@ks/lib/domain/persons/schemas.mts';
import { MAX_ADDRESS, MAX_SOURCES } from '@ks/lib/domain/pins/schemas.mts';

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

/** The Place precisions as the form lists them, widest last. A test keeps the values equal to `PLACE_PRECISIONS`. */
export const PRECISION_OPTIONS = [
  { label: 'Street address', value: 'street' },
  { label: 'Building', value: 'building' },
  { label: 'Erf', value: 'erf' },
  { label: 'Farm', value: 'farm' },
  { label: 'Suburb', value: 'suburb' },
  { label: 'Town or city', value: 'town' },
  { label: 'District', value: 'district' },
  { label: 'Province', value: 'province' },
  { label: 'Approximate', value: 'approximate' },
];

const DECIMAL = 'Use decimal degrees, such as -33.93, 18.42.';

const COORDINATE_MESSAGES: Record<CoordinateError, string> = {
  dms: 'Use decimal degrees, not degrees, minutes and seconds. For example -33.93, 18.42.',
  'not-decimal': DECIMAL,
  'out-of-range': DECIMAL,
  required: 'Enter the coordinates.',
};

const tooLong = (max: number) =>
  `Use ${max.toLocaleString('en-US')} characters or fewer.`;

/**
 * The texts of the field errors (PIN-01, PIN-02). `coordinates` is the reading error of the point
 * field, which `checkPin` does not see. `dateText` is the date as typed: two date errors quote it.
 */
export const pinMessages = (
  fields: PinFieldErrors['fields'],
  coordinates: CoordinateError | undefined,
  dateText: string
): PinMessages => ({
  address: fields.address && tooLong(MAX_ADDRESS),
  coordinates: coordinates && COORDINATE_MESSAGES[coordinates],
  date:
    fields.date &&
    (fields.date === 'required'
      ? 'Enter a date.'
      : fuzzyDateMessage(fields.date, dateText)),
  eventType: fields.eventType && 'Choose an event type.',
  notes: fields.notes && tooLong(MAX_NOTES),
  personId: fields.personId && 'Choose a person.',
  precision: fields.precision && 'Choose a precision.',
  sources: fields.sources && tooLong(MAX_SOURCES),
});
