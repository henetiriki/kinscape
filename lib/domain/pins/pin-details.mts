import type { PersonView } from '#ks/lib/domain/persons/types.ts';
import type { Pin, PinDetails } from '#ks/lib/domain/pins/types.ts';
import type { Place } from '#ks/lib/domain/places/types.ts';

/**
 * What the popup shows of a Pin beyond the map (PIN-02): the Person's names, the event type, the
 * address and the precision of the Place. It copies each field, so a source, note, date or id never
 * leaves with it (NFR-10).
 */
export const pinDetails = (
  pin: Pin,
  person: PersonView,
  place: Pick<Place, 'precision'>
): PinDetails => ({
  address: pin.address,
  eventType: pin.eventType,
  givenNames: person.givenNames,
  precision: place.precision,
  surname: person.surname,
});
