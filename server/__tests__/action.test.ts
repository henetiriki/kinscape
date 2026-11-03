import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { treeAction } from '@ks/server/action.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

const setup = async () => {
  const store = memoryStore();
  const a = await store.addAccount({
    issuer: 'test',
    subject: 'a',
    treeName: 'Tree A',
  });

  if (!a.ok) {
    throw new Error('setup failed');
  }

  const body = vi.fn(async (repository, input: { n: number }) => ({
    n: input.n,
    tree: repository.tree.name,
  }));

  return {
    a: a.value,
    action: treeAction(store, z.object({ n: z.number() }), body),
    body,
  };
};

// NFR-09
describe('treeAction', () => {
  it('runs the body on the opened Tree with parsed input', async () => {
    const { a, action } = await setup();

    expect(
      await action({ accountId: a.accountId }, a.treeId, { n: 1 })
    ).toEqual({ ok: true, value: { n: 1, tree: 'Tree A' } });
  });

  it('returns invalid, without running the body, for bad input', async () => {
    const { a, action, body } = await setup();

    expect(
      await action({ accountId: a.accountId }, a.treeId, { n: 'x' })
    ).toEqual({ error: 'invalid', ok: false });
    expect(body).not.toHaveBeenCalled();
  });

  it('returns not-found, without running the body, for a Viewer with no Account', async () => {
    const { a, action, body } = await setup();

    expect(await action({}, a.treeId, { n: 1 })).toEqual({
      error: 'not-found',
      ok: false,
    });
    expect(body).not.toHaveBeenCalled();
  });

  it('checks the Tree before the input', async () => {
    const { a, action } = await setup();

    expect(await action({}, a.treeId, { n: 'x' })).toEqual({
      error: 'not-found',
      ok: false,
    });
  });
});
