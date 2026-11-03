import { afterEach, describe, expect, it, vi } from 'vitest';

import { db } from '@ks/server/db/database.mts';

// NFR-09
describe('db', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('opens once from KINSCAPE_DATABASE_URL and reuses the handle', async () => {
    vi.stubEnv('KINSCAPE_DATABASE_URL', 'postgres://app@localhost:1/db');

    const first = db();

    expect(db()).toBe(first);
    await first.destroy();
  });
});
