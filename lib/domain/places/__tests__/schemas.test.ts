import { describe, expect, it } from 'vitest';

import { PLACE_PRECISIONS } from '@ks/lib/domain/places/schemas.mts';
import { placeInputSchema } from '@ks/lib/domain/places/schemas.mts';

const ID = '00000000-0000-4000-8000-0000000000a1';
const place = (over: Record<string, unknown> = {}) => ({
  id: ID,
  latitude: -33.9,
  longitude: 18.4,
  precision: 'town',
  ...over,
});

// PIN-02
describe('placeInputSchema', () => {
  it('accepts a Place and lower-cases its id', () => {
    const result = placeInputSchema.parse(place({ id: ID.toUpperCase() }));

    expect(result).toEqual(place());
  });

  it.each([
    ['latitude', 91],
    ['latitude', -91],
    ['longitude', 181],
    ['longitude', -181],
  ])('refuses %s %d', (key, value) => {
    expect(placeInputSchema.safeParse(place({ [key]: value })).success).toBe(
      false
    );
  });

  it.each([
    ['latitude', 90],
    ['latitude', -90],
    ['longitude', 180],
    ['longitude', -180],
  ])('accepts %s %d', (key, value) => {
    expect(placeInputSchema.safeParse(place({ [key]: value })).success).toBe(
      true
    );
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, '10'])(
    'refuses latitude %j',
    value => {
      expect(
        placeInputSchema.safeParse(place({ latitude: value })).success
      ).toBe(false);
    }
  );

  it.each([
    'street',
    'building',
    'erf',
    'farm',
    'suburb',
    'town',
    'district',
    'province',
    'approximate',
  ])('accepts precision %s', precision => {
    expect(placeInputSchema.safeParse(place({ precision })).success).toBe(true);
  });

  it('lists exactly the nine precisions', () => {
    expect(PLACE_PRECISIONS).toHaveLength(9);
  });

  it.each(['day', 'month', 'year', ''])('refuses precision %j', precision => {
    expect(placeInputSchema.safeParse(place({ precision })).success).toBe(
      false
    );
  });

  it('defaults a missing precision to approximate', () => {
    expect(
      placeInputSchema.parse(place({ precision: undefined })).precision
    ).toBe('approximate');
  });

  it.each(['', 'not-a-uuid'])('refuses the Place id %j', id => {
    expect(placeInputSchema.safeParse(place({ id })).success).toBe(false);
  });

  it('refuses a key it does not know', () => {
    expect(placeInputSchema.safeParse(place({ treeId: ID })).success).toBe(
      false
    );
  });
});
