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
