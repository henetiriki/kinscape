import { describe, expect, it } from 'vitest';

import { checkRelationshipInput } from '@ks/lib/domain/relationships/form.mts';

const spouse = {
  id: '01900000-0000-7000-8000-0000000000c1',
  personAId: '01900000-0000-7000-8000-0000000000a1',
  personBId: '01900000-0000-7000-8000-0000000000a2',
  type: 'spouse',
};

// PPL-02
describe('checkRelationshipInput', () => {
  it('returns the parsed input for a valid spouse link', () => {
    const result = checkRelationshipInput({
      ...spouse,
      divorce: '1900',
      marriage: '1890',
    });

    expect(result.ok && result.value.type).toBe('spouse');
  });

  it('gives divorce-before-marriage for a divorce before the marriage', () => {
    expect(
      checkRelationshipInput({ ...spouse, divorce: '1890', marriage: '1900' })
    ).toEqual({ error: 'divorce-before-marriage', ok: false });
  });

  it.each([
    ['a bad id', { ...spouse, id: 'nope' }],
    ['an unknown type', { ...spouse, type: 'sibling' }],
    ['no object', 'spouse'],
    ['a bad date', { ...spouse, marriage: 'SOMETIME' }],
    ['a bad divorce date', { ...spouse, divorce: 'SOMETIME' }],
    [
      'a bad date with a divorce before the marriage',
      { ...spouse, divorce: '1890', marriage: 'SOMETIME' },
    ],
  ])('gives invalid for %s', (_what, input) => {
    expect(checkRelationshipInput(input)).toEqual({
      error: 'invalid',
      ok: false,
    });
  });
});
