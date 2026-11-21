import { describe, expect, it } from 'vitest';

import { MAX_NOTES } from '@ks/lib/domain/persons/schemas.mts';
import {
  EVENT_TYPES,
  MAX_ADDRESS,
  MAX_SOURCES,
  pinFormSchema,
  pinInputSchema,
  pinUpdateSchema,
} from '@ks/lib/domain/pins/schemas.mts';
import { EVENT_ORDER } from '@ks/lib/ui/EventGlyph';

const ID = '00000000-0000-4000-8000-0000000000a1';
const PERSON = '00000000-0000-4000-8000-0000000000b1';
const PLACE = '00000000-0000-4000-8000-0000000000c1';
const pin = (over: Record<string, unknown> = {}) => ({
  date: '1850',
  eventType: 'birth',
  id: ID,
  personId: PERSON,
  placeId: PLACE,
  ...over,
});
const ok = (over: Record<string, unknown> = {}) =>
  pinInputSchema.safeParse(pin(over)).success;

// PIN-03
describe('pinInputSchema', () => {
  it('accepts a Pin, defaults the text and reads the date', () => {
    const result = pinInputSchema.parse(pin({ id: ID.toUpperCase() }));

    expect(result).toMatchObject({
      address: '',
      id: ID,
      notes: '',
      personId: PERSON,
      placeId: PLACE,
      sources: '',
    });
    expect(result.date.earliest).toBe('1850-01-01');
  });

  it.each(EVENT_TYPES)('accepts the event type %s', eventType => {
    expect(ok({ eventType })).toBe(true);
  });

  it.each(['', 'wedding', 'Birth'])('refuses the event type %j', eventType => {
    expect(ok({ eventType })).toBe(false);
  });

  it('lists the same event types as the UI, in the same order', () => {
    expect([...EVENT_TYPES]).toEqual(EVENT_ORDER);
  });

  it('refuses a Pin with no date', () => {
    expect(pinInputSchema.safeParse(pin({ date: undefined })).success).toBe(
      false
    );
    expect(ok({ date: '' })).toBe(false);
  });

  it('reads "BET 1848 AND 1852" as that FuzzyDate', () => {
    const result = pinInputSchema.parse(pin({ date: 'BET 1848 AND 1852' }));

    expect(result.date).toMatchObject({
      earliest: '1848-01-01',
      latest: '1852-12-31',
      qualifier: 'BET',
    });
  });

  it('refuses a date that does not read', () => {
    expect(ok({ date: 'last spring' })).toBe(false);
  });

  it.each([
    ['address', MAX_ADDRESS],
    ['sources', MAX_SOURCES],
    ['notes', MAX_NOTES],
  ])('accepts %s at its limit and refuses one more', (key, max) => {
    expect(ok({ [key]: 'a'.repeat(max) })).toBe(true);
    expect(ok({ [key]: 'a'.repeat(max + 1) })).toBe(false);
  });

  it.each(['address', 'sources', 'notes'])('refuses a NUL in %s', key => {
    expect(ok({ [key]: 'a\0' })).toBe(false);
  });

  it.each(['id', 'personId', 'placeId'])('refuses a bad %s', key => {
    expect(ok({ [key]: 'not-a-uuid' })).toBe(false);
  });

  it('refuses a key it does not know', () => {
    expect(ok({ treeId: ID })).toBe(false);
  });
});

// PIN-02
describe('pinFormSchema', () => {
  const form = (place: unknown) => {
    const withoutPlaceId = Object.fromEntries(
      Object.entries(pin()).filter(([key]) => key !== 'placeId')
    );

    return pinFormSchema.safeParse({ ...withoutPlaceId, place });
  };

  it('reads a new point with the Place id and a default precision', () => {
    const result = form({ id: PLACE, kind: 'new', latitude: 1, longitude: 2 });

    expect(result.success && result.data.place).toEqual({
      id: PLACE,
      kind: 'new',
      latitude: 1,
      longitude: 2,
      precision: 'approximate',
    });
  });

  it('reads an existing Place', () => {
    expect(form({ id: PLACE, kind: 'existing' }).success).toBe(true);
  });

  it('refuses a placeId beside the place', () => {
    expect(
      pinFormSchema.safeParse({
        ...pin(),
        place: { id: PLACE, kind: 'existing' },
      }).success
    ).toBe(false);
  });
});

// PIN-02
describe('pinUpdateSchema', () => {
  const base = Object.fromEntries(
    Object.entries(pin()).filter(([key]) => key !== 'placeId')
  );
  const update = (over: Record<string, unknown>) =>
    pinUpdateSchema.safeParse({ ...base, version: 1, ...over });

  it('reads a Place that stays', () => {
    const result = update({ place: { kind: 'stays' } });

    expect(result.success && result.data.place).toEqual({ kind: 'stays' });
  });

  it('reads a new point with a default precision', () => {
    const result = update({
      place: { id: PLACE, kind: 'new', latitude: 1, longitude: 2 },
    });

    expect(result.success && result.data.place).toMatchObject({
      id: PLACE,
      precision: 'approximate',
    });
  });

  it.each([
    ['an existing Place', { id: PLACE, kind: 'existing' }],
    ['a stays Place with an id', { id: PLACE, kind: 'stays' }],
    ['no Place', undefined],
  ])('refuses %s', (_what, place) => {
    expect(update({ place }).success).toBe(false);
  });

  it.each([0, -1, 1.5, '1', undefined])('refuses a version of %j', version => {
    expect(update({ place: { kind: 'stays' }, version }).success).toBe(false);
  });
});
