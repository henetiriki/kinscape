import { describe, expect, it } from 'vitest';

import { asDay, fromDay, toDay } from '@ks/lib/domain/boundaries/model.mts';

describe('day conversion', () => {
  it('counts days since 1652-01-01', () => {
    expect(toDay('1652-01-01')).toBe(0);
    expect(toDay('1652-01-02')).toBe(1);
    expect(toDay('1950-01-01')).toBe(108_842);
  });

  it('round-trips', () => {
    expect(fromDay(toDay('1950-01-01'))).toBe('1950-01-01');
    expect(fromDay(asDay(0))).toBe('1652-01-01');
  });
});
