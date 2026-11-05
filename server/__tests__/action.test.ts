import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { TreeRepository } from '@ks/server/trees/types.ts';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));

import { err, ok } from '@ks/lib/domain/result/result.mts';
import { treeAction } from '@ks/server/action.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { SESSION_COOKIE, startSession } from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

const setup = async () => {
  const store = memoryStore();
  const sessions = memorySessions();
  const a = await store.addAccount({
    issuer: 'test',
    subject: 'a',
    treeName: 'Tree A',
  });

  if (!a.ok) {
    throw new Error('setup failed');
  }

  adapters.current = { sessions, store };

  const body = vi.fn(
    async (repository: TreeRepository, input: { n: number }) =>
      input.n < 0
        ? err('negative')
        : ok({
            n: input.n,
            tree: repository.tree.name,
            viewer: repository.viewer,
          })
  );
  const token = await startSession(sessions, () => new Date(), {
    accountId: a.value.accountId,
    email: 'x@example.test',
  });

  jar.get.mockReturnValue({ value: token });

  return {
    a: a.value,
    action: treeAction(z.object({ n: z.number() }), body),
    body,
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// NFR-09, NFR-10
describe('treeAction', () => {
  it('runs the body on the cookie’s Viewer and Tree with parsed input', async () => {
    const { a, action } = await setup();

    expect(await action({ n: 1 })).toEqual({
      ok: true,
      value: { n: 1, tree: 'Tree A', viewer: { accountId: a.accountId } },
    });
    expect(jar.get).toHaveBeenCalledWith(SESSION_COOKIE);
  });

  it('passes the body’s own error through', async () => {
    const { action } = await setup();

    expect(await action({ n: -1 })).toEqual({ error: 'negative', ok: false });
  });

  it('returns invalid, without running the body, for bad input', async () => {
    const { action, body } = await setup();

    expect(await action({ n: 'x' })).toEqual({ error: 'invalid', ok: false });
    expect(body).not.toHaveBeenCalled();
  });

  it('returns not-found, without running the body, with no cookie', async () => {
    const { action, body } = await setup();

    jar.get.mockReturnValue(undefined);

    expect(await action({ n: 1 })).toEqual({ error: 'not-found', ok: false });
    expect(body).not.toHaveBeenCalled();
  });

  it('checks the Tree before the input', async () => {
    const { action } = await setup();

    jar.get.mockReturnValue({ value: 'x'.repeat(43) });

    expect(await action({ n: 'x' })).toEqual({ error: 'not-found', ok: false });
  });
});
