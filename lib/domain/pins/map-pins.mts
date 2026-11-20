import type { MapPin, SpannedPin } from '#ks/lib/domain/pins/types.ts';
import type { Place } from '#ks/lib/domain/places/types.ts';

/**
 * What the map needs of each Pin: the position of its Place, joined by `placeId`, with the span and
 * the event type (PIN-02, NFR-03). The Places go in a `Map`, so the join is one pass over each list.
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
            eventType: pin.eventType,
            id: pin.id,
            latitude: place.latitude,
            longitude: place.longitude,
            span: pin.span,
          },
        ];
  });
};
