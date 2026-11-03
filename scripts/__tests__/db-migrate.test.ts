import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestDb } from '../../server/db/__tests__/pglite.ts';
import { run } from '../db-migrate.mts';

const env = {
  KINSCAPE_DATABASE_DIRECT_URL: 'postgres://direct@localhost/db',
  KINSCAPE_DATABASE_URL: 'postgres://app@localhost/db',
};

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'db-migrate-'));
  writeFileSync(join(dir, '0001_a.sql'), 'create table a (id int);');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  rmSync(dir, { force: true, recursive: true });
  vi.restoreAllMocks();
});

// NFR-09
describe('db-migrate run', () => {
  it('opens the direct URL, applies pending files and closes', async () => {
    const open = vi.fn(() => createTestDb());

    expect(await run(env, open, dir)).toBe(0);
    expect(open).toHaveBeenCalledExactlyOnceWith(
      'postgres://direct@localhost/db'
    );
    expect(console.log).toHaveBeenCalledWith('Applied: 0001_a.sql');
  });

  it('says so when nothing is pending', async () => {
    const db = createTestDb();
    const destroy = vi.spyOn(db, 'destroy');

    expect(await run(env, () => db, dir)).toBe(0);
    expect(destroy).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalledWith('Applied: 0001_a.sql');

    // A second run on a fresh handle to the same files finds the table empty,
    // so check the message through an empty folder instead.
    const empty = mkdtempSync(join(tmpdir(), 'db-migrate-empty-'));

    expect(await run(env, () => createTestDb(), empty)).toBe(0);
    expect(console.log).toHaveBeenLastCalledWith('No pending migrations.');
    rmSync(empty, { force: true, recursive: true });
  });

  it('fails naming the direct URL variable when it is not set', async () => {
    const open = vi.fn();

    expect(
      await run({ KINSCAPE_DATABASE_URL: env.KINSCAPE_DATABASE_URL }, open, dir)
    ).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('KINSCAPE_DATABASE_DIRECT_URL')
    );
    expect(open).not.toHaveBeenCalled();
  });

  it('needs only the direct URL', async () => {
    const open = vi.fn(() => createTestDb());

    expect(
      await run(
        { KINSCAPE_DATABASE_DIRECT_URL: env.KINSCAPE_DATABASE_DIRECT_URL },
        open,
        dir
      )
    ).toBe(0);
  });

  it('closes the database when a migration fails', async () => {
    const db = createTestDb();
    const destroy = vi.spyOn(db, 'destroy');

    writeFileSync(join(dir, '0002_b.sql'), 'select * from missing;');

    await expect(run(env, () => db, dir)).rejects.toThrow(/0002_b\.sql/);
    expect(destroy).toHaveBeenCalledOnce();
  });
});
