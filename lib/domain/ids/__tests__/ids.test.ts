import { describe, expect, it } from 'vitest';

import {
  parseAccountId,
  parsePersonId,
  parseRelationshipId,
  parseTreeId,
  uuidV7,
} from '@ks/lib/domain/ids/ids.mts';

const UUID = '00000000-0000-4000-8000-0000000000a1';

describe.each([
  ['parsePersonId', parsePersonId],
  ['parseRelationshipId', parseRelationshipId],
])('%s', (_name, parse) => {
  it('returns the id in lower case', () => {
    expect(parse(UUID.replace('a1', 'A1'))).toBe(UUID);
  });
});

describe.each([
  ['parseRelationshipId', parseRelationshipId],
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

// PPL-01
describe('uuidV7', () => {
  it('writes version 7, variant 10 and the time in the first 48 bits', () => {
    const id = uuidV7(Date.UTC(2026, 10, 14));

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(Number.parseInt(id.replace('-', '').slice(0, 12), 16)).toBe(
      Date.UTC(2026, 10, 14)
    );
    expect(parsePersonId(id)).toBe(id);
  });

  it('gives a new id at each call', () => {
    expect(uuidV7()).not.toBe(uuidV7());
  });
});
