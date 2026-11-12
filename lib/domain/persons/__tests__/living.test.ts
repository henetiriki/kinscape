import { describe, expect, it } from 'vitest';

import { parseFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { isLiving } from '@ks/lib/domain/persons/living.mts';

const death = (() => {
  const parsed = parseFuzzyDate('1900');

  if (!parsed.ok) throw new Error('setup failed');

  return parsed.value;
})();

// PPL-01
describe('isLiving', () => {
  it('is true with no death date and no deceased mark', () => {
    expect(isLiving({ deceased: false })).toBe(true);
  });

  it('is false with a death date', () => {
    expect(isLiving({ death, deceased: false })).toBe(false);
  });

  it('is false with the deceased mark', () => {
    expect(isLiving({ deceased: true })).toBe(false);
  });
});
