import type { Day } from '#ks/lib/domain/boundaries/types.ts';
import type {
  AlonePart,
  MapPin,
  SharedPlace,
} from '#ks/lib/domain/pins/types.ts';

import { isCurrentOn } from '#ks/lib/domain/validity/validity.mts';

/** Pins share a Place when their positions are equal (#863 D1). The groups keep the order of the Pins. */
export const groupByPlace = (pins: MapPin[]): MapPin[][] => {
  const groups = new Map<string, MapPin[]>();

  for (const pin of pins) {
    const key = `${pin.longitude},${pin.latitude}`;
    const group = groups.get(key);

    if (group) {
      group.push(pin);
    } else {
      groups.set(key, [pin]);
    }
  }

  return [...groups.values()];
};

/**
 * The days on which each Pin of one Place is the only Pin that the Place shows. The map draws a
 * single Pin on those days and a count marker on the others. One sweep over the start and end days
 * of the spans finds them, so a Place of many Pins costs no pairwise loop.
 */
export const aloneParts = (group: MapPin[]): AlonePart[] => {
  const starts = new Map<number, MapPin[]>();
  const ends = new Map<number, MapPin[]>();
  const at = (days: Map<number, MapPin[]>, day: number, pin: MapPin) =>
    days.set(day, [...(days.get(day) ?? []), pin]);

  // A span of no days would enter the sweep and never leave it.
  for (const pin of group.filter(
    ({ span }) => span.validTo !== span.validFrom
  )) {
    at(starts, pin.span.validFrom, pin);

    if (pin.span.validTo !== null) at(ends, pin.span.validTo, pin);
  }

  const days = [...new Set([...starts.keys(), ...ends.keys()])].toSorted(
    (a, b) => a - b
  );
  const shown = new Set<MapPin>();
  const parts: AlonePart[] = [];

  days.forEach((day, index) => {
    for (const pin of ends.get(day) ?? []) shown.delete(pin);
    for (const pin of starts.get(day) ?? []) shown.add(pin);

    if (shown.size !== 1) return;

    // Each day of the sweep changes which Pins show, so two parts of one Pin never touch.
    const [{ id }] = shown;

    parts.push({
      id,
      validFrom: day as Day,
      validTo: (days[index + 1] ?? null) as Day | null,
    });
  });

  return parts;
};

/** Pins in time order: by span start, then by id (#863 plan D5). */
const byStart = (a: MapPin, b: MapPin) =>
  a.span.validFrom - b.span.validFrom || a.id.localeCompare(b.id);

/** Each Place that shows two or more Pins on `day`, with those Pins in time order (#863 D2). */
export const sharedPlaces = (groups: MapPin[][], day: Day): SharedPlace[] =>
  groups.flatMap(group => {
    const shown = group.filter(({ span }) => isCurrentOn(span, day));

    return shown.length < 2
      ? []
      : [
          {
            pins: shown.toSorted(byStart),
            position: [shown[0].longitude, shown[0].latitude],
          },
        ];
  });
