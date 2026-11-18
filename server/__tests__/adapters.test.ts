import { afterEach, describe, expect, it, vi } from 'vitest';

// NFR-03
describe('appAdapters', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    delete (globalThis as { kinscapeAdapters?: unknown }).kinscapeAdapters;
  });

  it('uses the memory session and store together under the test-only variable', async () => {
    vi.stubEnv('KINSCAPE_MEMORY_ADAPTERS', '1');

    const { appAdapters } = await import('@ks/server/adapters.mts');
    const { SYNTHETIC } = await import('@ks/server/auth/synthetic.mts');
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

    const { countFailure, emailKey } =
      await import('@ks/server/auth/throttle.mts');

    await countFailure(adapters.throttle, new Date(), SYNTHETIC.email);

    expect(
      await adapters.throttle.since(
        emailKey(SYNTHETIC.email),
        new Date(Date.now() - 60_000)
      )
    ).toHaveLength(1);
  });

  it('signs in each family fixture Account to its read-only Tree', async () => {
    vi.stubEnv('KINSCAPE_MEMORY_ADAPTERS', '1');

    const { appAdapters } = await import('@ks/server/adapters.mts');
    const { FIXTURES, MARIA } = await import('@ks/server/auth/fixtures.mts');
    const { signIn } = await import('@ks/server/auth/sign-in.mts');
    const adapters = appAdapters();
    const [, family, alone] = FIXTURES;

    for (const [fixture, people, links] of [
      [family, 13, 8],
      [alone, 1, 0],
    ] as const) {
      const signedIn = await signIn(adapters, fixture.email, fixture.password);

      expect(signedIn).toEqual({ ok: true, value: { id: fixture.accountId } });

      const scope = { accountId: fixture.accountId, treeId: fixture.treeId };
      const persons = await adapters.store.listPersons(scope);
      const relationships = await adapters.store.listRelationships(scope);

      expect(persons).toHaveLength(people);
      expect(relationships).toHaveLength(links);
      expect(persons.find(person => person.id === MARIA.id)).toMatchObject({
        maidenName: 'Rossouw',
        notes: 'Her baptism record spells the family name Rossau.',
        variants: ['Du Toit', 'Dutoit', 'Du Tois'],
      });

      // Each write is refused, and the lists do not change.
      expect(
        await adapters.store.addPerson({ ...scope, person: MARIA })
      ).toBeUndefined();
      expect(
        await adapters.store.updatePerson({
          ...scope,
          person: { ...MARIA, givenNames: 'Changed' },
          version: 1,
        })
      ).toMatchObject({ ok: false });
      expect(await adapters.store.listPersons(scope)).toEqual(persons);

      const [first] = FIXTURES[1].relationships;

      expect(
        await adapters.store.addRelationship({
          ...scope,
          relationship: first,
        })
      ).toMatchObject({ ok: false });
      expect(
        await adapters.store.updateRelationship({
          ...scope,
          relationship: first,
          version: 1,
        })
      ).toMatchObject({ ok: false });
      expect(await adapters.store.listRelationships(scope)).toEqual(
        relationships
      );
    }
  });

  it('signs in the researcher fixture Account to an empty read-only Tree under the memory adapters', async () => {
    vi.stubEnv('KINSCAPE_MEMORY_ADAPTERS', '1');

    const { appAdapters } = await import('@ks/server/adapters.mts');
    const { FIXTURES } = await import('@ks/server/auth/fixtures.mts');
    const { SYNTHETIC } = await import('@ks/server/auth/synthetic.mts');
    const { signIn } = await import('@ks/server/auth/sign-in.mts');
    const { personInputSchema } =
      await import('@ks/lib/domain/persons/schemas.mts');
    const { startSession } = await import('@ks/server/auth/sessions.mts');
    const { openTree } = await import('@ks/server/trees/repository.mts');
    const adapters = appAdapters();
    const [fixture] = FIXTURES;

    expect(fixture.email).toBe('researcher@example.com');

    const signedIn = await signIn(adapters, fixture.email, fixture.password);

    expect(signedIn).toEqual({ ok: true, value: { id: fixture.accountId } });
    expect(
      await adapters.store.findTree({
        accountId: fixture.accountId,
        treeId: fixture.treeId,
      })
    ).toEqual({ id: fixture.treeId, name: fixture.treeName });

    const token = await startSession(adapters.sessions, () => new Date(), {
      accountId: fixture.accountId,
      email: fixture.email,
    });
    const opened = await openTree(
      {
        now: () => new Date(),
        sessions: adapters.sessions,
        store: adapters.store,
      },
      token,
      fixture.treeId
    );

    if (!opened.ok) {
      throw new Error('setup failed');
    }

    expect(await opened.value.persons.list()).toEqual([]);
    expect(
      await opened.value.persons.create(
        personInputSchema.parse({ id: '01900000-0000-7000-8000-0000000000a1' })
      )
    ).toEqual({ error: 'not-found', ok: false });
    expect(await opened.value.persons.list()).toEqual([]);

    // The synthetic Account keeps its own empty, writable Tree.
    expect(
      await adapters.store.listPersons({
        accountId: SYNTHETIC.accountId,
        treeId: SYNTHETIC.treeId,
      })
    ).toEqual([]);
    expect(
      await adapters.store.listPersons({
        accountId: SYNTHETIC.accountId,
        treeId: fixture.treeId,
      })
    ).toEqual([]);
  });

  it('knows no fixture Account under the memory sign-in alone', async () => {
    vi.stubEnv('KINSCAPE_MEMORY_SIGN_IN', '1');
    vi.stubEnv('KINSCAPE_DATABASE_URL', 'postgres://app@localhost:1/db');

    const { appAdapters } = await import('@ks/server/adapters.mts');
    const { FIXTURES } = await import('@ks/server/auth/fixtures.mts');
    const { db } = await import('@ks/server/db/database.mts');
    const { signIn } = appAdapters();

    for (const fixture of FIXTURES) {
      expect(
        await signIn.verify(fixture.email, fixture.password)
      ).toBeUndefined();
    }

    await db().destroy();
  });

  it('sends a fixture email to Supabase under neither flag', async () => {
    vi.stubEnv('KINSCAPE_DATABASE_URL', 'postgres://app@localhost:1/db');
    vi.stubEnv('KINSCAPE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('KINSCAPE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');

    const { appAdapters } = await import('@ks/server/adapters.mts');
    const { FIXTURES } = await import('@ks/server/auth/fixtures.mts');
    const { db } = await import('@ks/server/db/database.mts');
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 400 }));
    const { signIn, store } = appAdapters();

    for (const fixture of FIXTURES) {
      expect(
        await signIn.verify(fixture.email, fixture.password)
      ).toBeUndefined();
      // Port 1 refuses the connection; a memory store would resolve `undefined`.
      await expect(
        store.findAccount(fixture.issuer, fixture.subject)
      ).rejects.toThrow();
    }

    expect(fetch).toHaveBeenCalledTimes(FIXTURES.length);

    fetch.mockRestore();
    await db().destroy();
  });

  it('refuses to build memory adapters on Vercel', async () => {
    vi.stubEnv('KINSCAPE_MEMORY_ADAPTERS', '1');
    vi.stubEnv('VERCEL_ENV', 'preview');

    const { appAdapters } = await import('@ks/server/adapters.mts');

    expect(() => appAdapters()).toThrow(/KINSCAPE_MEMORY_ADAPTERS/);
  });

  it('refuses to build the memory sign-in on Vercel', async () => {
    vi.stubEnv('KINSCAPE_MEMORY_SIGN_IN', '1');
    vi.stubEnv('KINSCAPE_DATABASE_URL', 'postgres://app@localhost:1/db');
    vi.stubEnv('VERCEL_ENV', 'preview');

    const { appAdapters } = await import('@ks/server/adapters.mts');

    expect(() => appAdapters()).toThrow(/KINSCAPE_MEMORY_SIGN_IN/);
  });

  it('uses the memory sign-in with the database under KINSCAPE_MEMORY_SIGN_IN', async () => {
    vi.stubEnv('KINSCAPE_MEMORY_SIGN_IN', '1');
    vi.stubEnv('KINSCAPE_DATABASE_URL', 'postgres://app@localhost:1/db');

    const { appAdapters } = await import('@ks/server/adapters.mts');
    const { SYNTHETIC } = await import('@ks/server/auth/synthetic.mts');
    const { db } = await import('@ks/server/db/database.mts');
    const fetch = vi.spyOn(globalThis, 'fetch');
    const { sessions, signIn, store, throttle } = appAdapters();

    expect(await signIn.verify(SYNTHETIC.email, SYNTHETIC.password)).toEqual({
      issuer: SYNTHETIC.issuer,
      subject: SYNTHETIC.subject,
    });
    expect(await signIn.verify(SYNTHETIC.email, 'wrong')).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
    // Port 1 refuses the connection; a memory adapter resolves.
    await expect(store.findAccount('x', 'x')).rejects.toThrow();
    await expect(sessions.find('x')).rejects.toThrow();
    await expect(throttle.since('x', new Date())).rejects.toThrow();

    fetch.mockRestore();
    await db().destroy();
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
    const { sessions, signIn, store, throttle } = appAdapters();

    expect(await signIn.verify('a@example.test', 'pw')).toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/token?grant_type=password',
      expect.anything()
    );
    // Port 1 refuses the connection; a memory store would resolve `undefined`.
    await expect(store.findAccount('supabase', 'x')).rejects.toThrow();
    await expect(sessions.find('x')).rejects.toThrow();
    await expect(throttle.since('x', new Date())).rejects.toThrow();

    fetch.mockRestore();
    await db().destroy();
  });
});
