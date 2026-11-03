import { afterEach, describe, expect, it, vi } from 'vitest';

import { register } from '@ks/instrumentation.ts';

const stubFull = () => {
  vi.stubEnv('KINSCAPE_DATABASE_URL', 'postgres://app@localhost/db');
  vi.stubEnv('KINSCAPE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('KINSCAPE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
};

// NFR-09
describe('register', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('fails at server start when the database URL is missing', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('KINSCAPE_DATABASE_URL', '');

    await expect(register()).rejects.toThrow(/KINSCAPE_DATABASE_URL/);
  });

  it('passes when the database and Supabase variables are set', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    stubFull();

    await expect(register()).resolves.toBeUndefined();
  });

  it('does nothing outside the Node runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    vi.stubEnv('KINSCAPE_DATABASE_URL', '');

    await expect(register()).resolves.toBeUndefined();
  });

  // NFR-03
  it('passes with the memory adapters and no other variable', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('KINSCAPE_MEMORY_ADAPTERS', '1');

    await expect(register()).resolves.toBeUndefined();
  });

  // NFR-03
  it.each(['VERCEL', 'VERCEL_ENV'])(
    'refuses to start with the memory adapters when %s is set',
    async name => {
      vi.stubEnv('NEXT_RUNTIME', 'nodejs');
      vi.stubEnv('KINSCAPE_MEMORY_ADAPTERS', '1');
      vi.stubEnv(name, '');

      await expect(register()).rejects.toThrow(/KINSCAPE_MEMORY_ADAPTERS/);
    }
  );
});
