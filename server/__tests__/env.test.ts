import { describe, expect, it } from 'vitest';

import { parseEnv } from '@ks/server/env.mts';

// NFR-09
describe('parseEnv', () => {
  it('returns the database URLs', () => {
    expect(
      parseEnv({
        KINSCAPE_DATABASE_DIRECT_URL: 'postgres://direct@localhost/db',
        KINSCAPE_DATABASE_URL: 'postgres://app@localhost/db',
      })
    ).toEqual({
      databaseDirectUrl: 'postgres://direct@localhost/db',
      databaseUrl: 'postgres://app@localhost/db',
    });
  });

  it('leaves the direct URL optional', () => {
    expect(
      parseEnv({ KINSCAPE_DATABASE_URL: 'postgres://app@localhost/db' })
    ).toEqual({
      databaseDirectUrl: undefined,
      databaseUrl: 'postgres://app@localhost/db',
    });
  });

  it('names a missing variable', () => {
    expect(() => parseEnv({})).toThrow(/KINSCAPE_DATABASE_URL/);
  });

  it('names an empty variable', () => {
    expect(() => parseEnv({ KINSCAPE_DATABASE_URL: '' })).toThrow(
      /KINSCAPE_DATABASE_URL/
    );
  });

  it('never includes the value of an invalid variable', () => {
    const secret = 'not-a-url-s3cret-token';

    expect(() =>
      parseEnv({
        KINSCAPE_DATABASE_DIRECT_URL: secret,
        KINSCAPE_DATABASE_URL: 'postgres://app@localhost/db',
      })
    ).toThrow(/KINSCAPE_DATABASE_DIRECT_URL/);

    try {
      parseEnv({
        KINSCAPE_DATABASE_DIRECT_URL: secret,
        KINSCAPE_DATABASE_URL: secret,
      });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });
});
