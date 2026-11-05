import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { db, poolConfig, rootCa } from '@ks/server/db/database.mts';

const stubSupabase = () => {
  vi.stubEnv('KINSCAPE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('KINSCAPE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
};

// NFR-03
describe('poolConfig', () => {
  const CA = '-----BEGIN CERTIFICATE-----\nCA\n-----END CERTIFICATE-----\n';

  it.each(['', '?sslmode=verify-full'])(
    'verifies the server against the given CA for query %j',
    query => {
      const { connectionString, ssl } = poolConfig(
        `postgres://app@localhost:6543/db${query}`,
        CA
      );

      // `pg` lets the connection string's TLS parameters override `ssl`; check what a client keeps.
      expect(new pg.Client({ connectionString, ssl }).ssl).toEqual({
        ca: CA,
        rejectUnauthorized: true,
      });
    }
  );

  it('keeps the other connection parameters', () => {
    const { connectionString } = poolConfig(
      'postgres://app:pw@localhost:6543/db?sslmode=verify-full&application_name=ks',
      CA
    );

    expect(new URL(connectionString).searchParams.has('sslmode')).toBe(false);
    expect(connectionString).toBe(
      'postgres://app:pw@localhost:6543/db?application_name=ks'
    );
  });

  it('reads the checked-in CA by default', () => {
    expect(poolConfig('postgres://app@localhost/db').ssl.ca).toBe(
      readFileSync(join(process.cwd(), 'server/db/root-ca.crt'), 'utf8')
    );
    expect(rootCa()).toBe(rootCa());
  });
});

// NFR-09
describe('db', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('refuses to open a database under the memory adapters', () => {
    vi.stubEnv('KINSCAPE_MEMORY_ADAPTERS', '1');

    expect(() => db()).toThrow(/no database/);
  });

  it('opens once from KINSCAPE_DATABASE_URL and reuses the handle', async () => {
    stubSupabase();
    vi.stubEnv('KINSCAPE_DATABASE_URL', 'postgres://app@localhost:1/db');

    const first = db();

    expect(db()).toBe(first);
    await first.destroy();
  });
});
