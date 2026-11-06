import { describe, expect, it } from 'vitest';

import { parseAccountId, parseTreeId } from '@ks/lib/domain/ids/ids.mts';

const UUID = '00000000-0000-4000-8000-0000000000a1';

describe.each([
  ['parseTreeId', parseTreeId],
  ['parseAccountId', parseAccountId],
])('%s', (_name, parse) => {
  it('returns a well-formed UUID unchanged, in either case', () => {
    expect(parse(UUID)).toBe(UUID);
    expect(parse(UUID.toUpperCase())).toBe(UUID.toUpperCase());
  });

  it.each(['', 'not-a-uuid', `${UUID}0`, ` ${UUID}`, UUID.replace('4', 'g')])(
    'returns undefined for %j',
    text => {
      expect(parse(text)).toBeUndefined();
    }
  );
});
