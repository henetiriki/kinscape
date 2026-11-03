import { afterEach, describe, expect, it, vi } from 'vitest';

import { db } from '@ks/server/db/database.mts';

const stubSupabase = () => {
  vi.stubEnv('KINSCAPE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('KINSCAPE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
};

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
