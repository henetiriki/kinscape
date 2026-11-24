import type { Pin, PinEditFields } from '#ks/lib/domain/pins/types.ts';
import type { Place } from '#ks/lib/domain/places/types.ts';

import { formatFuzzyDate } from '#ks/lib/domain/dates/fuzzy-date.mts';

/**
 * What the edit form needs of a Pin (PIN-02): the fields of the form with the date as text, the
 * point and precision of its Place, and the `version`. It copies each field, so no Pin id or
 * Place id leaves with it (NFR-10).
 */
export const pinEditFields = (
  pin: Pin,
  place: Pick<Place, 'latitude' | 'longitude' | 'precision'>
): PinEditFields => ({
  address: pin.address,
  date: formatFuzzyDate(pin.date),
  eventType: pin.eventType,
  latitude: place.latitude,
  longitude: place.longitude,
  notes: pin.notes,
  personId: pin.personId,
  precision: place.precision,
  sources: pin.sources,
  version: pin.version,
});
