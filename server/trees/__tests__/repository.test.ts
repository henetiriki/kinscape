import { describe, expect, it, vi } from 'vitest';

import { memoryStore } from '@ks/server/trees/memory-store.mts';
import { openTree } from '@ks/server/trees/repository.mts';

const MISSING = '00000000-0000-4000-8000-000000000000';

const setup = async () => {
  const store = memoryStore();
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

  return { a: a.value, b: b.value, store };
};

// NFR-09
describe('openTree', () => {
  it('opens the Viewer’s own Tree', async () => {
    const { a, store } = await setup();

    expect(await openTree({ accountId: a.accountId }, a.treeId, store)).toEqual(
      { ok: true, value: { tree: { id: a.treeId, name: 'Tree A' } } }
    );
  });

  it('gives Account B the result of a Tree that does not exist', async () => {
    const { a, b, store } = await setup();
    const cross = await openTree({ accountId: b.accountId }, a.treeId, store);

    expect(cross).toEqual({ error: 'not-found', ok: false });
    expect(cross).toEqual(
      await openTree({ accountId: b.accountId }, MISSING, store)
    );
  });

  it('returns nothing to a Viewer with no Account, without asking the store', async () => {
    const { a, store } = await setup();
    const findTree = vi.spyOn(store, 'findTree');

    expect(await openTree({}, a.treeId, store)).toEqual({
      error: 'not-found',
      ok: false,
    });
    expect(findTree).not.toHaveBeenCalled();
  });

  it('treats a malformed id as not found, without asking the store', async () => {
    const { a, store } = await setup();
    const findTree = vi.spyOn(store, 'findTree');

    expect(
      await openTree({ accountId: a.accountId }, 'not-a-uuid', store)
    ).toEqual({ error: 'not-found', ok: false });
    expect(findTree).not.toHaveBeenCalled();
  });
});
