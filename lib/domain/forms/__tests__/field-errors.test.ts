import { describe, expect, it } from 'vitest';

import { collectFieldErrors } from '@ks/lib/domain/forms/field-errors.mts';

type Fields = { a?: 'x'; b?: 'y' };

const issue = (name: string) => ({ code: 'custom', message: '', path: [name] });

const table = ({ path }: { path: PropertyKey[] }) =>
  path[0] === 'a'
    ? (['a', 'x'] as ['a', 'x'])
    : path[0] === 'b'
      ? (['b', 'y'] as ['b', 'y'])
      : undefined;

describe('collectFieldErrors', () => {
  it('gives the error kind of each field', () => {
    expect(collectFieldErrors<Fields>([issue('a'), issue('b')], table)).toEqual(
      { a: 'x', b: 'y' }
    );
  });

  it('gives undefined if one issue has no field', () => {
    expect(
      collectFieldErrors<Fields>([issue('a'), issue('z')], table)
    ).toBeUndefined();
  });
});
