import { afterEach, describe, expect, it, vi } from 'vitest';

// NFR-03
describe('appAdapters', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses the memory session and store together under the test-only variable', async () => {
    vi.stubEnv('KINSCAPE_MEMORY_ADAPTERS', '1');

    const { appAdapters, SYNTHETIC } = await import('@ks/server/adapters.mts');
    const { signIn } = await import('@ks/server/auth/sign-in.mts');
    const adapters = appAdapters();

    expect(appAdapters()).toBe(adapters);

    const signedIn = await signIn(
      adapters,
      SYNTHETIC.email,
      SYNTHETIC.password
    );

    expect(signedIn.ok).toBe(true);

    if (signedIn.ok) {
      expect(await adapters.store.findTrees(signedIn.value.id)).toHaveLength(1);
    }

    const { resumeSession, startSession } =
      await import('@ks/server/auth/sessions.mts');
    const token = await startSession(adapters.sessions, () => new Date(), {
      accountId: SYNTHETIC.accountId,
      email: SYNTHETIC.email,
    });

    expect(
      await resumeSession(adapters.sessions, () => new Date(), token)
    ).toEqual({ accountId: SYNTHETIC.accountId, email: SYNTHETIC.email });

    expect(await signIn(adapters, SYNTHETIC.email, 'wrong')).toEqual({
      error: 'refused',
      ok: false,
    });
  });

  it('refuses to build memory adapters on Vercel', async () => {
    vi.stubEnv('KINSCAPE_MEMORY_ADAPTERS', '1');
    vi.stubEnv('VERCEL_ENV', 'preview');

    const { appAdapters } = await import('@ks/server/adapters.mts');

    expect(() => appAdapters()).toThrow(/KINSCAPE_MEMORY_ADAPTERS/);
  });

  it('uses Supabase and the database otherwise', async () => {
    vi.stubEnv('KINSCAPE_DATABASE_URL', 'postgres://app@localhost:1/db');
    vi.stubEnv('KINSCAPE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('KINSCAPE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');

    const { appAdapters } = await import('@ks/server/adapters.mts');
    const { db } = await import('@ks/server/db/database.mts');
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 400 }));
    const { session, sessions, store } = appAdapters();

    expect(await session.verify('a@example.test', 'pw')).toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/token?grant_type=password',
      expect.anything()
    );
    // Port 1 refuses the connection; a memory store would resolve `undefined`.
    await expect(store.findAccount('supabase', 'x')).rejects.toThrow();
    await expect(sessions.find('x')).rejects.toThrow();

    fetch.mockRestore();
    await db().destroy();
  });
});
