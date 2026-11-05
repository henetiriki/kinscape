import { describe, expect, it } from 'vitest';

import { parseDirectUrl, parseEnv } from '@ks/server/env.mts';

const FULL = {
  KINSCAPE_DATABASE_URL: 'postgres://app@localhost/db',
  KINSCAPE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  KINSCAPE_SUPABASE_URL: 'https://example.supabase.co',
};

// NFR-09
describe('parseEnv', () => {
  it('returns the database and Supabase settings', () => {
    expect(
      parseEnv({
        ...FULL,
        KINSCAPE_DATABASE_DIRECT_URL: 'postgres://direct@localhost/db',
      })
    ).toEqual({
      databaseDirectUrl: 'postgres://direct@localhost/db',
      databaseUrl: 'postgres://app@localhost/db',
      memoryAdapters: false,
      supabasePublishableKey: 'publishable-key',
      supabaseUrl: 'https://example.supabase.co',
    });
  });

  it('leaves the direct URL optional', () => {
    expect(parseEnv(FULL)).toMatchObject({
      databaseDirectUrl: undefined,
      databaseUrl: 'postgres://app@localhost/db',
    });
  });

  it('names a missing variable', () => {
    expect(() => parseEnv({})).toThrow(/KINSCAPE_DATABASE_URL/);
  });

  it('names a missing Supabase variable', () => {
    expect(() =>
      parseEnv({ KINSCAPE_DATABASE_URL: FULL.KINSCAPE_DATABASE_URL })
    ).toThrow(/KINSCAPE_SUPABASE_PUBLISHABLE_KEY, KINSCAPE_SUPABASE_URL/);
  });

  it('names an empty variable', () => {
    expect(() => parseEnv({ ...FULL, KINSCAPE_DATABASE_URL: '' })).toThrow(
      /KINSCAPE_DATABASE_URL/
    );
  });

  it('never includes the value of an invalid variable', () => {
    const secret = 'not-a-url-s3cret-token';

    expect(() =>
      parseEnv({ ...FULL, KINSCAPE_DATABASE_DIRECT_URL: secret })
    ).toThrow(/KINSCAPE_DATABASE_DIRECT_URL/);

    try {
      parseEnv({
        ...FULL,
        KINSCAPE_DATABASE_DIRECT_URL: secret,
        KINSCAPE_DATABASE_URL: secret,
      });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });
});

const WEAKER = [
  'sslmode=disable',
  'sslmode=allow',
  'sslmode=prefer',
  'sslmode=require',
  'sslmode=verify-ca',
  'sslmode=no-verify',
  'sslmode=verify-full&uselibpqcompat=true',
  'uselibpqcompat=true',
  'ssl=false',
  'ssl=0',
  'sslrootcert=/etc/ca.crt',
  'sslcert=/etc/client.crt',
  'sslkey=/etc/client.key',
];

// NFR-03
describe('database URL TLS settings', () => {
  it.each(['', '?sslmode=verify-full', '?application_name=ks'])(
    'accepts both URLs with query %j',
    query => {
      const url = `postgres://app@localhost/db${query}`;

      expect(
        parseEnv({
          ...FULL,
          KINSCAPE_DATABASE_DIRECT_URL: url,
          KINSCAPE_DATABASE_URL: url,
        })
      ).toMatchObject({ databaseDirectUrl: url, databaseUrl: url });
      expect(parseDirectUrl({ KINSCAPE_DATABASE_DIRECT_URL: url })).toBe(url);
    }
  );

  it.each(WEAKER)('rejects KINSCAPE_DATABASE_URL with %s', query => {
    expect(() =>
      parseEnv({
        ...FULL,
        KINSCAPE_DATABASE_URL: `postgres://app@localhost/db?${query}`,
      })
    ).toThrow(
      /^Missing or invalid environment variable: KINSCAPE_DATABASE_URL$/
    );
  });

  it.each(WEAKER)('rejects KINSCAPE_DATABASE_DIRECT_URL with %s', query => {
    const url = `postgres://direct@localhost/db?${query}`;

    expect(() =>
      parseEnv({ ...FULL, KINSCAPE_DATABASE_DIRECT_URL: url })
    ).toThrow(/KINSCAPE_DATABASE_DIRECT_URL$/);
    expect(() => parseDirectUrl({ KINSCAPE_DATABASE_DIRECT_URL: url })).toThrow(
      /KINSCAPE_DATABASE_DIRECT_URL$/
    );
  });

  it('never includes the URL in the error', () => {
    const url = 'postgres://app:s3cret-pass@localhost/db?sslmode=disable';

    try {
      parseEnv({ ...FULL, KINSCAPE_DATABASE_URL: url });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain('s3cret-pass');
      expect(String(error)).not.toContain('sslmode');
    }
  });
});

// NFR-03
describe('parseEnv with KINSCAPE_MEMORY_ADAPTERS', () => {
  it('needs no database or Supabase variable', () => {
    expect(parseEnv({ KINSCAPE_MEMORY_ADAPTERS: '1' })).toEqual({
      databaseDirectUrl: undefined,
      databaseUrl: undefined,
      memoryAdapters: true,
      supabasePublishableKey: undefined,
      supabaseUrl: undefined,
    });
  });

  it('is off for any value but 1', () => {
    expect(() => parseEnv({ KINSCAPE_MEMORY_ADAPTERS: '0' })).toThrow(
      /KINSCAPE_DATABASE_URL/
    );
  });

  it.each([
    ['VERCEL', '1'],
    ['VERCEL', ''],
    ['VERCEL_ENV', 'production'],
    ['VERCEL_ENV', ''],
  ])('refuses to start with %s=%j', (name, value) => {
    expect(() =>
      parseEnv({ KINSCAPE_MEMORY_ADAPTERS: '1', [name]: value })
    ).toThrow(/KINSCAPE_MEMORY_ADAPTERS/);
  });

  it('ignores VERCEL when the variable is off', () => {
    expect(parseEnv({ ...FULL, VERCEL: '1' }).memoryAdapters).toBe(false);
  });
});

// NFR-09
describe('parseDirectUrl', () => {
  it('needs no app URL', () => {
    expect(
      parseDirectUrl({
        KINSCAPE_DATABASE_DIRECT_URL: 'postgres://direct@localhost/db',
      })
    ).toBe('postgres://direct@localhost/db');
  });

  it('is undefined when unset', () => {
    expect(parseDirectUrl({})).toBeUndefined();
  });

  it('names an invalid variable, not its value', () => {
    expect(() =>
      parseDirectUrl({ KINSCAPE_DATABASE_DIRECT_URL: 'not-a-url-s3cret' })
    ).toThrow(/KINSCAPE_DATABASE_DIRECT_URL$/);
  });
});
