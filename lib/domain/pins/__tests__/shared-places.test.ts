import { describe, expect, it } from 'vitest';

import type { Day } from '@ks/lib/domain/boundaries/types.ts';
import type { MapPin } from '@ks/lib/domain/pins/types.ts';

import { parsePinId } from '@ks/lib/domain/ids/ids.mts';
import {
  aloneParts,
  groupByPlace,
  sharedPlaces,
} from '@ks/lib/domain/pins/shared-places.mts';

// PIN-06.
const day = (value: number) => value as Day;

const pin = (
  last: string,
  from: number,
  to: null | number,
  [longitude, latitude] = [26.1, -29.1]
): MapPin => ({
  date1: '1890',
  eventType: 'residence',
  id: parsePinId(`01900000-0000-7000-8000-0000000000${last}`)!,
  latitude,
  longitude,
  qualifier: 'EXACT',
  span: { validFrom: day(from), validTo: to === null ? null : day(to) },
});

const ids = (pins: MapPin[]) => pins.map(({ id }) => id.slice(-2));

describe('groupByPlace', () => {
  it('puts Pins with equal positions in one group, and others apart', () => {
    const groups = groupByPlace([
      pin('a1', 0, 10),
      pin('a2', 0, 10, [18.4, -33.9]),
      pin('a3', 0, 10),
    ]);

    expect(groups.map(ids)).toEqual([['a1', 'a3'], ['a2']]);
  });
});

describe('aloneParts', () => {
  it('gives a Pin alone on its Place its whole span', () => {
    expect(aloneParts([pin('a1', 5, null)])).toEqual([
      { id: pin('a1', 5, null).id, validFrom: day(5), validTo: null },
    ]);
  });

  it('gives each Pin the days on which no other Pin of its Place shows', () => {
    const parts = aloneParts([pin('a1', 0, 10), pin('a2', 5, 20)]);

    expect(
      parts.map(({ id, validFrom, validTo }) => [
        id.slice(-2),
        validFrom,
        validTo,
      ])
    ).toEqual([
      ['a1', 0, 5],
      ['a2', 10, 20],
    ]);
  });

  it('gives no part to a Pin that always shares its days, or to a span of no days', () => {
    const parts = aloneParts([
      pin('a1', 0, null),
      pin('a2', 3, 6),
      pin('a3', 6, 8),
      pin('a4', 9, 9),
    ]);

    expect(
      parts.map(({ id, validFrom, validTo }) => [
        id.slice(-2),
        validFrom,
        validTo,
      ])
    ).toEqual([
      ['a1', 0, 3],
      ['a1', 8, null],
    ]);
  });
});

describe('sharedPlaces', () => {
  const groups = groupByPlace([
    pin('b3', 4, 20),
    pin('b1', 0, 20),
    pin('b2', 0, 20),
    pin('c1', 0, 20, [18.4, -33.9]),
  ]);

  it('gives each Place with two or more Pins on the day, at its position', () => {
    expect(sharedPlaces(groups, day(5))).toEqual([
      {
        pins: [groups[0][1], groups[0][2], groups[0][0]],
        position: [26.1, -29.1],
      },
    ]);
  });

  it('sorts the Pins by span start, then by id (#863 plan D5)', () => {
    expect(ids(sharedPlaces(groups, day(5))[0].pins)).toEqual([
      'b1',
      'b2',
      'b3',
    ]);
  });

  it('counts only the Pins that the day shows (#863 D2)', () => {
    expect(ids(sharedPlaces(groups, day(2))[0].pins)).toEqual(['b1', 'b2']);
    expect(sharedPlaces(groups, day(25))).toEqual([]);
  });
});
