import { describe, expect, it } from 'vitest';

import { requiredFuzzyDate } from '@ks/lib/domain/dates/schemas.mts';

describe('requiredFuzzyDate', () => {
  it('parses GEDCOM text to a FuzzyDate', () => {
    const result = requiredFuzzyDate.parse(' BET 1848 AND 1852 ');

    expect(result.qualifier).toBe('BET');
    expect(result.earliest).toBe('1848-01-01');
    expect(result.latest).toBe('1852-12-31');
  });

  it.each(['', '   '])('refuses blank text %j', text => {
    expect(requiredFuzzyDate.safeParse(text).success).toBe(false);
  });

  it('refuses a missing value', () => {
    expect(requiredFuzzyDate.safeParse(undefined).success).toBe(false);
  });

  it('refuses text that is not a date', () => {
    expect(requiredFuzzyDate.safeParse('last spring').success).toBe(false);
  });
});
