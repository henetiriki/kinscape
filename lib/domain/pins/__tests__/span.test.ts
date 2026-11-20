import { describe, expect, it } from 'vitest';

import type { Qualifier } from '@ks/lib/domain/dates/types.ts';

import { toDay } from '@ks/lib/domain/boundaries/model.mts';
import { fuzzyDateOf } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { spanOf } from '@ks/lib/domain/pins/span.mts';
import { isCurrentOn } from '@ks/lib/domain/validity/validity.mts';

const date = (qualifier: Qualifier, date1: string, date2?: string) =>
  fuzzyDateOf(qualifier, date1, date2);

describe('spanOf', () => {
  it('is the Pin date when the Person has no birth and no death', () => {
    const span = spanOf(date('FROM', '1840', '1855'), {});

    expect(span).toEqual({
      validFrom: toDay('1840-01-01'),
      validTo: toDay('1856-01-01'),
    });
  });

  it('clips an AFT date at the day after the death', () => {
    const span = spanOf(date('AFT', '1850'), { death: date('EXACT', '1860') });

    expect(isCurrentOn(span, toDay('1855-06-01'))).toBe(true);
    expect(isCurrentOn(span, toDay('1865-06-01'))).toBe(false);
    expect(span.validTo).toBe(toDay('1861-01-01'));
  });

  it('clips a BEF date at the earliest day of the birth', () => {
    const span = spanOf(date('BEF', '1850'), { birth: date('EXACT', '1830') });

    expect(isCurrentOn(span, toDay('1820-06-01'))).toBe(false);
    expect(isCurrentOn(span, toDay('1840-06-01'))).toBe(true);
    expect(span.validFrom).toBe(toDay('1830-01-01'));
  });

  it('clips by the earliest day of a fuzzy birth and the latest day of a fuzzy death', () => {
    const span = spanOf(date('FROM', '1800', '1900'), {
      birth: date('ABT', '1830'),
      death: date('ABT', '1860'),
    });

    expect(span.validFrom).toBe(date('ABT', '1830').validFrom);
    expect(span.validTo).toBe(date('ABT', '1860').validTo);
  });

  it('gives an empty span, never a reversed one, for a birth after the Pin', () => {
    const span = spanOf(date('FROM', '1840', '1855'), {
      birth: date('EXACT', '1900'),
    });

    expect(span.validFrom).toBe(span.validTo);

    for (const day of ['1840-01-01', '1855-12-31', '1900-01-01']) {
      expect(isCurrentOn(span, toDay(day))).toBe(false);
    }
  });

  it.each(['ABT', 'CAL', 'EST', 'EXACT'] as const)(
    'clips a %s date by the death',
    qualifier => {
      const span = spanOf(date(qualifier, '1850'), {
        death: date('EXACT', '1850-03-01'),
      });

      expect(span.validTo).toBe(toDay('1850-03-02'));
    }
  );

  it('clips a BET date by the birth', () => {
    const span = spanOf(date('BET', '1848', '1852'), {
      birth: date('EXACT', '1850'),
    });

    expect(span.validFrom).toBe(toDay('1850-01-01'));
    expect(span.validTo).toBe(toDay('1853-01-01'));
  });
});
