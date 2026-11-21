import type { PersonView } from '#ks/lib/domain/persons/types.ts';
import type { Pin, PinDetails } from '#ks/lib/domain/pins/types.ts';

/**
 * What the popup shows of a Pin beyond the map (PIN-02): the Person's names, the event type and the
 * address. It copies each field, so a source, note, date or id never leaves with it (NFR-10).
 */
export const pinDetails = (pin: Pin, person: PersonView): PinDetails => ({
  address: pin.address,
  eventType: pin.eventType,
  givenNames: person.givenNames,
  surname: person.surname,
});
