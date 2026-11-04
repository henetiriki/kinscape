import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { treeAction } from '@ks/server/action.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

const NOW = () => new Date('2030-01-01T00:00:00Z');

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

  const body = vi.fn(async (repository, input: { n: number }) => ({
    n: input.n,
    tree: repository.tree.name,
  }));

  return {
    a: a.value,
    action: treeAction(store, sessions, z.object({ n: z.number() }), body, NOW),
    body,
    token: await startSession(sessions, NOW, {
      accountId: a.value.accountId,
      email: 'x@example.test',
    }),
  };
};

// NFR-09
describe('treeAction', () => {
  it('runs the body on the opened Tree with parsed input', async () => {
    const { a, action, token } = await setup();

    expect(await action(token, a.treeId, { n: 1 })).toEqual({
      ok: true,
      value: { n: 1, tree: 'Tree A' },
    });
  });

  it('returns invalid, without running the body, for bad input', async () => {
    const { a, action, body, token } = await setup();

    expect(await action(token, a.treeId, { n: 'x' })).toEqual({
      error: 'invalid',
      ok: false,
    });
    expect(body).not.toHaveBeenCalled();
  });

  it('returns not-found, without running the body, for no session', async () => {
    const { a, action, body } = await setup();

    expect(await action(undefined, a.treeId, { n: 1 })).toEqual({
      error: 'not-found',
      ok: false,
    });
    expect(body).not.toHaveBeenCalled();
  });

  it('checks the Tree before the input', async () => {
    const { a, action } = await setup();

    expect(await action(undefined, a.treeId, { n: 'x' })).toEqual({
      error: 'not-found',
      ok: false,
    });
  });
});
