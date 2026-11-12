import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPool, db, poolConfig, rootCa } from '@ks/server/db/database.mts';

const stubSupabase = () => {
  vi.stubEnv('KINSCAPE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('KINSCAPE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
};

// NFR-03
describe('poolConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  // The CI `test` job sets KINSCAPE_DATABASE_CA_FILE, so this test stubs it empty.
  it('reads the checked-in CA by default', () => {
    vi.stubEnv('KINSCAPE_DATABASE_CA_FILE', '');

    expect(poolConfig('postgres://app@localhost/db').ssl.ca).toBe(
      readFileSync(join(process.cwd(), 'server/db/root-ca.crt'), 'utf8')
    );
    expect(rootCa()).toBe(rootCa());
  });

  it('reads the CA file that KINSCAPE_DATABASE_CA_FILE names', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ks-ca-'));
    const first = join(dir, 'first.crt');
    const second = join(dir, 'second.crt');

    writeFileSync(first, 'first CA');
    writeFileSync(second, 'second CA');

    vi.stubEnv('KINSCAPE_DATABASE_CA_FILE', first);
    expect(rootCa()).toBe('first CA');
    expect(poolConfig('postgres://app@localhost/db').ssl.ca).toBe('first CA');

    // A later change to the variable takes effect after the first read.
    vi.stubEnv('KINSCAPE_DATABASE_CA_FILE', second);
    expect(rootCa()).toBe('second CA');

    // The memo answers for the first path after its file changes.
    writeFileSync(first, 'changed');
    vi.stubEnv('KINSCAPE_DATABASE_CA_FILE', first);
    expect(rootCa()).toBe('first CA');
  });

  it('refuses the CA file on Vercel', () => {
    vi.stubEnv('KINSCAPE_DATABASE_CA_FILE', '/tmp/ca.crt');
    vi.stubEnv('VERCEL_ENV', 'production');

    expect(() => rootCa()).toThrow(/KINSCAPE_DATABASE_CA_FILE/);
  });
});

// NFR-09
describe('createPool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs the code of an idle client error, not its message', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pool = createPool('postgres://app:s3cret@db.internal:6543/db');

    pool.emit(
      'error',
      Object.assign(new Error('read ECONNRESET db.internal s3cret'), {
        code: '57P01',
      })
    );

    expect(log).toHaveBeenCalledExactlyOnceWith(
      'The database closed an idle connection (57P01)'
    );
    await pool.end();
  });

  it('logs "unknown" for an error without a code', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pool = createPool('postgres://app@localhost:1/db');

    pool.emit('error', new Error('db.internal'));

    expect(log).toHaveBeenCalledExactlyOnceWith(
      'The database closed an idle connection (unknown)'
    );
    await pool.end();
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
