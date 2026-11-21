import { describe, expect, it } from 'vitest';

import { checkPin } from '@ks/lib/domain/pins/form.mts';

const PIN = '00000000-0000-4000-8000-0000000000a1';
const PERSON = '00000000-0000-4000-8000-0000000000b1';
const PLACE = '00000000-0000-4000-8000-0000000000c1';
const point = { id: PLACE, kind: 'new', latitude: -33.93, longitude: 18.42 };
const valid = {
  date: 'ABT 1850',
  eventType: 'residence',
  id: PIN,
  personId: PERSON,
  place: point,
};

const withPlace = (over: Record<string, unknown>) => ({
  ...valid,
  place: { ...point, ...over },
});
const failed = (fields: Record<string, string>) => ({
  error: { fields },
  ok: false,
});

// PIN-01, PIN-02, PIN-04
describe('checkPin', () => {
  it('returns the Pin and the new Place for a new point', () => {
    const result = checkPin({ ...valid, address: ' Kloof Street ' });

    expect(result).toMatchObject({
      ok: true,
      value: {
        pin: {
          address: 'Kloof Street',
          eventType: 'residence',
          id: PIN,
          personId: PERSON,
          placeId: PLACE,
        },
        place: {
          id: PLACE,
          latitude: -33.93,
          longitude: 18.42,
          precision: 'approximate',
        },
      },
    });
    expect(result.ok && result.value.pin.date.qualifier).toBe('ABT');
    expect(result.ok && 'kind' in result.value.place!).toBe(false);
  });

  it('keeps the precision of a new point', () => {
    const result = checkPin(withPlace({ precision: 'farm' }));

    expect(result.ok && result.value.place?.precision).toBe('farm');
  });

  it('returns no Place for an existing Place', () => {
    const result = checkPin({
      ...valid,
      place: { id: PLACE, kind: 'existing' },
    });

    expect(result).toMatchObject({
      ok: true,
      value: { pin: { placeId: PLACE } },
    });
    expect(result.ok && result.value.place).toBeUndefined();
  });

  it.each([
    ['a missing Person', { ...valid, personId: undefined }, 'personId'],
    ['a blank Person', { ...valid, personId: ' ' }, 'personId'],
    ['a missing event type', { ...valid, eventType: undefined }, 'eventType'],
    ['a blank event type', { ...valid, eventType: '' }, 'eventType'],
    ['a missing date', { ...valid, date: undefined }, 'date'],
    ['a blank date', { ...valid, date: '  ' }, 'date'],
    ['a missing Place', { ...valid, place: undefined }, 'place'],
    ['a blank Place', { ...valid, place: '' }, 'place'],
    ['a missing latitude', withPlace({ latitude: undefined }), 'latitude'],
    ['a blank latitude', withPlace({ latitude: '' }), 'latitude'],
    ['a missing longitude', withPlace({ longitude: null }), 'longitude'],
  ])('gives required for %s', (_what, input, field) => {
    expect(checkPin(input)).toEqual(failed({ [field]: 'required' }));
  });

  it.each([
    ['an event type outside the list', { ...valid, eventType: 'wedding' }],
  ])('gives unknown for %s', (_what, input) => {
    expect(checkPin(input)).toEqual(failed({ eventType: 'unknown' }));
  });

  it('gives unknown for a precision outside the list', () => {
    expect(checkPin(withPlace({ precision: 'planet' }))).toEqual(
      failed({ precision: 'unknown' })
    );
  });

  it.each([
    ['31 FEB 1850', 'no-such-day'],
    ['BET 1860 AND 1850', 'reversed'],
    ['SOMETIME', 'syntax'],
    ['ABT 999', 'year'],
  ])('gives the date error for %s', (date, kind) => {
    expect(checkPin({ ...valid, date })).toEqual(failed({ date: kind }));
  });

  it.each([
    ['latitude', 91],
    ['latitude', -90.1],
    ['longitude', 181],
    ['longitude', -180.5],
  ])('gives out-of-range for a %s of %s', (field, value) => {
    expect(checkPin(withPlace({ [field]: value }))).toEqual(
      failed({ [field]: 'out-of-range' })
    );
  });

  it.each([
    ['latitude', 'north'],
    ['latitude', Number.NaN],
    ['longitude', '18.42'],
    ['longitude', true],
  ])('gives not-a-number for a %s of %s', (field, value) => {
    expect(checkPin(withPlace({ [field]: value }))).toEqual(
      failed({ [field]: 'not-a-number' })
    );
  });

  it('accepts the limits of latitude and longitude', () => {
    expect(checkPin(withPlace({ latitude: -90, longitude: 180 })).ok).toBe(
      true
    );
  });

  it.each([
    ['address', 501],
    ['sources', 10_001],
    ['notes', 10_001],
  ])('gives too-long for %s of %s characters', (field, length) => {
    expect(checkPin({ ...valid, [field]: 'x'.repeat(length) })).toEqual(
      failed({ [field]: 'too-long' })
    );
  });

  it('gives every field error at once', () => {
    expect(
      checkPin({
        address: 'x'.repeat(501),
        date: 'SOMETIME',
        eventType: 'wedding',
        id: PIN,
        personId: '',
        place: { ...point, latitude: 91, longitude: 'east', precision: 'x' },
      })
    ).toEqual(
      failed({
        address: 'too-long',
        date: 'syntax',
        eventType: 'unknown',
        latitude: 'out-of-range',
        longitude: 'not-a-number',
        personId: 'required',
        precision: 'unknown',
      })
    );
  });

  // Plan D2: an input that the form already stops gives invalid for the whole input.
  it.each([
    ['a bad Pin id', { ...valid, id: 'nope' }],
    ['a bad Person id', { ...valid, personId: 'nope' }],
    ['a bad Place id', withPlace({ id: 'nope' })],
    ['an unknown key', { ...valid, treeId: PIN }],
    ['an unknown key in a point', withPlace({ extra: 1 })],
    ['a wrong kind', { ...valid, place: { ...point, kind: 'old' } }],
    ['no kind', { ...valid, place: { id: PLACE } }],
    ['a Place that is not an object', { ...valid, place: 5 }],
    [
      'an existing Place with a point',
      {
        ...valid,
        place: { id: PLACE, kind: 'existing', latitude: 1 },
      },
    ],
    ['a NUL in the address', { ...valid, address: 'a\0b' }],
    ['no object', 'Ana'],
    ['a bad id with a field error', { ...valid, date: 'SOMETIME', id: 'nope' }],
  ])('gives invalid for %s', (_what, input) => {
    expect(checkPin(input)).toEqual({ error: 'invalid', ok: false });
  });
});
