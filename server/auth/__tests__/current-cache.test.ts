import { expect, it, vi } from 'vitest';

const cookies = vi.hoisted(() => vi.fn(async () => ({ get: () => undefined })));

vi.mock('next/headers', () => ({ cookies }));
vi.mock('next/navigation', () => ({ notFound: vi.fn(), redirect: vi.fn() }));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => ({ sessions: {} }),
}));
// A server render remembers a `cache` call for one request. A test has no request, so this
// stand-in remembers the first result for the one test below.
vi.mock('react', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  cache: <Args extends unknown[], Result>(
    lookup: (...args: Args) => Result
  ) => {
    let first: { result: Result } | undefined;

    return (...args: Args) => (first ??= { result: lookup(...args) }).result;
  },
}));

import { currentSession } from '@ks/server/auth/current.mts';

// NFR-03: the root layout's map slot, the People layout and the page share one lookup.
it('looks the session up once for the calls of one request', async () => {
  await currentSession();
  await currentSession();

  expect(cookies).toHaveBeenCalledOnce();
});
