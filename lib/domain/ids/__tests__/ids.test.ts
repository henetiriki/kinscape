import { describe, expect, it } from 'vitest';

import {
  parseAccountId,
  parsePersonId,
  parseTreeId,
} from '@ks/lib/domain/ids/ids.mts';

const UUID = '00000000-0000-4000-8000-0000000000a1';

describe('parsePersonId', () => {
  it('returns the id in lower case', () => {
    expect(parsePersonId(UUID.replace('a1', 'A1'))).toBe(UUID);
  });
});

describe.each([
  ['parseTreeId', parseTreeId],
  ['parsePersonId', parsePersonId],
  ['parseAccountId', parseAccountId],
])('%s', (_name, parse) => {
  it('accepts a well-formed UUID, in either case', () => {
    expect(parse(UUID)).toBe(UUID);
    expect(parse(UUID.toUpperCase())?.toLowerCase()).toBe(UUID);
  });

  it.each(['', 'not-a-uuid', `${UUID}0`, ` ${UUID}`, UUID.replace('4', 'g')])(
    'returns undefined for %j',
    text => {
      expect(parse(text)).toBeUndefined();
    }
  );
});
