import { describe, expect, it } from 'vitest';

import { parseFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { relationshipInputSchema } from '@ks/lib/domain/relationships/schemas.mts';

const ID = '00000000-0000-4000-8000-0000000000a1';
const A = '00000000-0000-4000-8000-0000000000b1';
const B = '00000000-0000-4000-8000-0000000000b2';

const parent = {
  childId: B,
  id: ID,
  parentId: A,
  subtype: 'biological',
  type: 'parent',
};
const spouse = { id: ID, personAId: A, personBId: B, type: 'spouse' };

const date = (text: string) => {
  const parsed = parseFuzzyDate(text);

  if (!parsed.ok) {
    throw new Error(text);
  }

  return parsed.value;
};

describe('relationshipInputSchema', () => {
  // PPL-02
  it('parses a parent', () => {
    const result = relationshipInputSchema.parse(parent);

    expect(result).toEqual(parent);
  });

  // PPL-02
  it('parses the dates of a spouse to the same value as the input', () => {
    const result = relationshipInputSchema.parse({
      ...spouse,
      divorce: '1885',
      marriage: 'ABT 1870',
    });

    expect(result).toEqual({
      ...spouse,
      divorce: date('1885'),
      marriage: date('ABT 1870'),
    });
  });

  it('refuses a bad date', () => {
    expect(
      relationshipInputSchema.safeParse({ ...spouse, marriage: 'soon' }).success
    ).toBe(false);
  });

  it('refuses a parent with no subtype', () => {
    expect(
      relationshipInputSchema.safeParse({ ...parent, subtype: undefined })
        .success
    ).toBe(false);
  });

  it('refuses a spouse with a subtype', () => {
    expect(
      relationshipInputSchema.safeParse({ ...spouse, subtype: 'biological' })
        .success
    ).toBe(false);
  });

  it('refuses an id that is not a UUID', () => {
    expect(
      relationshipInputSchema.safeParse({ ...parent, parentId: 'x' }).success
    ).toBe(false);
  });

  it('refuses a divorce before the marriage', () => {
    const result = relationshipInputSchema.safeParse({
      ...spouse,
      divorce: '1870',
      marriage: '1885',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a marriage "ABT 1870" and a divorce in 1870', () => {
    expect(
      relationshipInputSchema.safeParse({
        ...spouse,
        divorce: '1870',
        marriage: 'ABT 1870',
      }).success
    ).toBe(true);
  });
});
