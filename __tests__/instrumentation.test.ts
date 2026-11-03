import { afterEach, describe, expect, it, vi } from 'vitest';

import { register } from '@ks/instrumentation.ts';

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

  it('passes when the database URL is set', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('KINSCAPE_DATABASE_URL', 'postgres://app@localhost/db');

    await expect(register()).resolves.toBeUndefined();
  });

  it('does nothing outside the Node runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    vi.stubEnv('KINSCAPE_DATABASE_URL', '');

    await expect(register()).resolves.toBeUndefined();
  });
});
