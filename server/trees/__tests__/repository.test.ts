import { describe, expect, it, vi } from 'vitest';

import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';
import { openTree } from '@ks/server/trees/repository.mts';

const MISSING = '00000000-0000-4000-8000-000000000000';
const NOW = new Date('2030-01-01T00:00:00Z');
const NOT_FOUND = { error: 'not-found', ok: false };

const setup = async () => {
  const store = memoryStore();
  const sessions = memorySessions();
  const a = await store.addAccount({
    issuer: 'test',
    subject: 'a',
    treeName: 'Tree A',
  });
  const b = await store.addAccount({
    issuer: 'test',
    subject: 'b',
    treeName: 'Tree B',
  });

  if (!a.ok || !b.ok) {
    throw new Error('setup failed');
  }

  const tokenOf = (accountId: string) =>
    startSession(sessions, () => NOW, { accountId, email: 'x@example.test' });

  return {
    a: a.value,
    b: b.value,
    open: (token: string | undefined, treeId: string) =>
      openTree(token, treeId, store, sessions, () => NOW),
    sessions,
    store,
    tokenOf,
  };
};

// NFR-09
describe('openTree', () => {
  it('opens the signed-in Account’s own Tree', async () => {
    const { a, open, tokenOf } = await setup();

    expect(await open(await tokenOf(a.accountId), a.treeId)).toEqual({
      ok: true,
      value: { tree: { id: a.treeId, name: 'Tree A' } },
    });
  });

  it('gives Account B the result of a Tree that does not exist', async () => {
    const { a, b, open, tokenOf } = await setup();
    const token = await tokenOf(b.accountId);
    const cross = await open(token, a.treeId);

    expect(cross).toEqual(NOT_FOUND);
    expect(cross).toEqual(await open(token, MISSING));
  });

  it.each([
    ['no token', undefined],
    ['a forged token', 'x'.repeat(43)],
    ['a malformed token', 'nope'],
  ])(
    'returns nothing for %s, without asking the store',
    async (_what, token) => {
      const { a, open, store } = await setup();
      const findTree = vi.spyOn(store, 'findTree');

      expect(await open(token, a.treeId)).toEqual(NOT_FOUND);
      expect(findTree).not.toHaveBeenCalled();
    }
  );

  it('returns nothing for an expired token, without asking the store', async () => {
    const { a, sessions, store } = await setup();
    const findTree = vi.spyOn(store, 'findTree');
    const token = await startSession(sessions, () => NOW, {
      accountId: a.accountId,
      email: 'x@example.test',
    });
    const later = new Date(NOW.getTime() + 31 * 86_400_000);

    expect(
      await openTree(token, a.treeId, store, sessions, () => later)
    ).toEqual(NOT_FOUND);
    expect(findTree).not.toHaveBeenCalled();
  });

  it('returns nothing when the session store is down', async () => {
    const { a, sessions, store } = await setup();

    sessions.find = async () => {
      throw new Error('down');
    };

    expect(
      await openTree('x'.repeat(43), a.treeId, store, sessions, () => NOW)
    ).toEqual(NOT_FOUND);
  });

  it('treats a malformed id as not found, without asking the store', async () => {
    const { a, open, store, tokenOf } = await setup();
    const findTree = vi.spyOn(store, 'findTree');

    expect(await open(await tokenOf(a.accountId), 'not-a-uuid')).toEqual(
      NOT_FOUND
    );
    expect(findTree).not.toHaveBeenCalled();
  });
});
