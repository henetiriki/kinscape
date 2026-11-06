import { describe, expect, it } from 'vitest';

import { asDay } from '@ks/lib/domain/boundaries/model.mts';
import {
  current,
  isCurrentOn,
  overlaps,
} from '@ks/lib/domain/validity/validity.mts';

const span = (validFrom: number, validTo: null | number) => ({
  validFrom: asDay(validFrom),
  validTo: validTo === null ? null : asDay(validTo),
});

describe('isCurrentOn', () => {
  it('holds from validFrom up to, not including, validTo', () => {
    const v = span(5, 10);

    expect(isCurrentOn(v, asDay(4))).toBe(false);
    expect(isCurrentOn(v, asDay(5))).toBe(true);
    expect(isCurrentOn(v, asDay(9))).toBe(true);
    expect(isCurrentOn(v, asDay(10))).toBe(false);
  });

  it('never ends when validTo is null', () => {
    expect(isCurrentOn(span(5, null), asDay(1_000_000))).toBe(true);
  });
});

describe('current', () => {
  const rows = [
    { id: 'a', ...span(0, 10) },
    { id: 'b', ...span(5, null) },
  ];

  it('returns the rows whose validity holds the day', () => {
    expect(current(rows, asDay(7)).map(row => row.id)).toEqual(['a', 'b']);
    expect(current(rows, asDay(10)).map(row => row.id)).toEqual(['b']);
    expect(current(rows, asDay(-1))).toEqual([]);
  });
});

describe('overlaps', () => {
  it('is true when the half-open spans share a day', () => {
    expect(overlaps(span(0, 10), span(9, 20))).toBe(true);
    expect(overlaps(span(0, null), span(50, 60))).toBe(true);
    expect(overlaps(span(0, null), span(50, null))).toBe(true);
  });

  it('is false when one ends where the other starts', () => {
    expect(overlaps(span(0, 10), span(10, 20))).toBe(false);
    expect(overlaps(span(10, 20), span(0, 10))).toBe(false);
  });
});
