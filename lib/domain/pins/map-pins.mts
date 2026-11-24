import type { MapPin, SpannedPin } from '#ks/lib/domain/pins/types.ts';
import type { Place } from '#ks/lib/domain/places/types.ts';

/**
 * The list with the Pin in place of the entry with the same id, or at the end if none has it. The
 * input list stays as it is (PIN-01, PIN-02).
 */
export const withMapPin = (pins: MapPin[], pin: MapPin): MapPin[] =>
  pins.some(({ id }) => id === pin.id)
    ? pins.map(entry => (entry.id === pin.id ? pin : entry))
    : [...pins, pin];

/**
 * What the map needs of each Pin: the position of its Place, joined by `placeId`, with the span and
 * the event type and the parts of the date (PIN-02, NFR-03). The Places go in a `Map`, so the join is one pass over each list.
 * A Pin whose Place is not in the list has no position, so the function omits it.
 */
export const mapPins = (pins: SpannedPin[], places: Place[]): MapPin[] => {
  const byId = new Map(places.map(place => [place.id, place]));

  return pins.flatMap(pin => {
    const place = byId.get(pin.placeId);

    return place === undefined
      ? []
      : [
          {
            date1: pin.date.date1,
            // A Pin with one date has no `date2` key, as `FuzzyDate` has none.
            ...(pin.date.date2 === undefined ? {} : { date2: pin.date.date2 }),
            eventType: pin.eventType,
            id: pin.id,
            latitude: place.latitude,
            longitude: place.longitude,
            placeId: place.id,
            qualifier: pin.date.qualifier,
            span: pin.span,
          },
        ];
  });
};
