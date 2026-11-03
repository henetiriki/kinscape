import { describe, expect, it, vi } from 'vitest';

import type { SessionPort } from '@ks/lib/domain/auth/types.ts';

import { memorySession } from '@ks/server/auth/memory-session.mts';
import { signIn } from '@ks/server/auth/sign-in.mts';
import { supabaseSession } from '@ks/server/auth/supabase-session.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';
import { ISSUER } from '@ks/server/trees/repository.mts';

const EMAIL = 'ada@example.test';
const PASSWORD = 'synthetic-password';
const ACCOUNT = '00000000-0000-4000-8000-0000000000a1';

const store = () =>
  memoryStore([{ id: ACCOUNT, issuer: ISSUER, subject: 'sub-ada', trees: [] }]);

const users = [
  { email: EMAIL, password: PASSWORD, subject: 'sub-ada' },
  { email: 'bob@example.test', password: PASSWORD, subject: 'sub-bob' },
];

const reply = (status: number, body: unknown) => async () =>
  new Response(JSON.stringify(body), { status });

const supabase = (fetch: typeof globalThis.fetch): SessionPort =>
  supabaseSession({ fetch, key: 'publishable-key', url: 'https://x.test' });

// NFR-03
describe.each([
  ['memory', () => memorySession(users)],
  [
    'Supabase',
    () =>
      supabase(async (_url, init) => {
        const { email, password } = JSON.parse(String(init?.body));
        const user = users.find(
          u => u.email === email && u.password === password
        );

        return user === undefined
          ? new Response('{"error":"invalid_grant"}', { status: 400 })
          : new Response(JSON.stringify({ user: { id: user.subject } }));
      }),
  ],
])('signIn with the %s port', (_name, session) => {
  it('returns the Account for the right email and password', async () => {
    expect(
      await signIn({ session: session(), store: store() }, EMAIL, PASSWORD)
    ).toEqual({ ok: true, value: { id: ACCOUNT } });
  });

  it('gives one refusal for a wrong password, no Account and an unknown email', async () => {
    const deps = { session: session(), store: store() };
    const refusals = [
      await signIn(deps, EMAIL, 'wrong'),
      await signIn(deps, 'bob@example.test', PASSWORD),
      await signIn(deps, 'nobody@example.test', PASSWORD),
    ];

    for (const refusal of refusals) {
      expect(refusal).toEqual({ error: 'refused', ok: false });
    }
  });
});

// NFR-03
describe('signIn', () => {
  it('refuses an empty email or password without asking the port', async () => {
    const verify = vi.fn();
    const deps = { session: { verify }, store: store() };

    expect(await signIn(deps, '', PASSWORD)).toEqual({
      error: 'refused',
      ok: false,
    });
    expect(await signIn(deps, EMAIL, '')).toEqual({
      error: 'refused',
      ok: false,
    });
    expect(verify).not.toHaveBeenCalled();
  });

  it('lets an outage through as an error, not a refusal', async () => {
    const session = { verify: vi.fn().mockRejectedValue(new Error('down')) };

    await expect(
      signIn({ session, store: store() }, EMAIL, PASSWORD)
    ).rejects.toThrow('down');
  });
});

// NFR-03
describe('supabaseSession', () => {
  it('posts the credentials to the password grant with the key', async () => {
    const fetch = vi.fn(reply(200, { user: { id: 'sub-ada' } }));

    await supabase(fetch).verify(EMAIL, PASSWORD);

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe('https://x.test/auth/v1/token?grant_type=password');
    expect(init.method).toBe('POST');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(new Headers(init.headers).get('apikey')).toBe('publishable-key');
    expect(JSON.parse(String(init.body))).toEqual({
      email: EMAIL,
      password: PASSWORD,
    });
  });

  it('answers undefined for a 400', async () => {
    expect(
      await supabase(reply(400, { error: 'invalid_grant' })).verify(
        EMAIL,
        'wrong'
      )
    ).toBeUndefined();
  });

  it.each([429, 500, 503])('throws naming only the status %i', async status => {
    await expect(
      supabase(reply(status, { msg: EMAIL })).verify(EMAIL, PASSWORD)
    ).rejects.toThrow(new RegExp(`^Supabase Auth answered ${status}$`));
  });

  it.each([
    ['no user', {}],
    ['a user without an id', { user: {} }],
  ])('throws on a malformed body with %s', async (_what, body) => {
    await expect(
      supabase(reply(200, body)).verify(EMAIL, PASSWORD)
    ).rejects.toThrow('Supabase Auth sent an unreadable answer');
  });

  it('throws on a body that is not JSON', async () => {
    await expect(
      supabase(async () => new Response('<html>', { status: 200 })).verify(
        EMAIL,
        PASSWORD
      )
    ).rejects.toThrow('Supabase Auth sent an unreadable answer');
  });

  it('throws "timed out" on a timeout', async () => {
    const fetch = async () => {
      throw new DOMException('slow', 'TimeoutError');
    };

    await expect(supabase(fetch).verify(EMAIL, PASSWORD)).rejects.toThrow(
      'Supabase Auth timed out'
    );
  });

  it('throws without the cause on another network failure', async () => {
    const fetch = async () => {
      throw new Error(`connect failed for ${EMAIL}`);
    };

    await expect(supabase(fetch).verify(EMAIL, PASSWORD)).rejects.toThrow(
      /^Supabase Auth could not be reached$/
    );
  });

  it('logs nothing and leaks neither the email nor the password', async () => {
    const spies = (['error', 'info', 'log', 'warn'] as const).map(method =>
      vi.spyOn(console, method).mockImplementation(() => {})
    );
    const failures = await Promise.all(
      [reply(500, { msg: PASSWORD }), reply(200, { echo: EMAIL })].map(fetch =>
        supabase(fetch)
          .verify(EMAIL, PASSWORD)
          .then(
            () => '',
            (error: Error) => String(error)
          )
      )
    );

    for (const failure of failures) {
      expect(failure).not.toContain(EMAIL);
      expect(failure).not.toContain(PASSWORD);
    }

    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  });
});
