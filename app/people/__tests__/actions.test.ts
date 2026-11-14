import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));
const revalidate = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('next/cache', () => ({ revalidatePath: revalidate }));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));

import { createPersonAction, updatePersonAction } from '@ks/app/people/actions';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';
import { openTree } from '@ks/server/trees/repository.mts';

const ID = '01900000-0000-7000-8000-0000000000a1';
const person = { givenNames: 'Ana', id: ID, surname: 'Smit' };

const setup = async () => {
  const store = memoryStore();
  const sessions = memorySessions();
  const tokens: Record<string, string> = {};

  for (const subject of ['a', 'b']) {
    const added = await store.addAccount({
      issuer: 'test',
      subject,
      treeName: `Tree ${subject}`,
    });

    if (!added.ok) {
      throw new Error('setup failed');
    }

    tokens[subject] = await startSession(sessions, () => new Date(), {
      accountId: added.value.accountId,
      email: `${subject}@example.test`,
    });
  }

  adapters.current = { sessions, store };
  jar.get.mockReturnValue({ value: tokens.a });

  return {
    /** The Persons that an Account's Tree holds, read outside the actions. */
    listFor: async (subject: 'a' | 'b') => {
      const opened = await openTree({ sessions, store }, tokens[subject]);

      if (!opened.ok) {
        throw new Error('open failed');
      }

      return opened.value.persons.list();
    },
    signInAs: (subject: 'a' | 'b') =>
      jar.get.mockReturnValue({ value: tokens[subject] }),
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// PPL-01, NFR-09
describe('createPersonAction', () => {
  it.each([
    ['blank given names', { ...person, givenNames: ' ' }, 'givenNames'],
    ['a blank surname', { ...person, surname: '' }, 'surname'],
  ])('gives required for %s and saves nothing', async (_what, input, field) => {
    const { listFor } = await setup();

    expect(await createPersonAction(input)).toEqual({
      error: { fields: { [field]: 'required' } },
      ok: false,
    });
    expect(await listFor('a')).toEqual([]);
  });

  it('gives too-many for 21 variants and saves nothing', async () => {
    const { listFor } = await setup();

    expect(
      await createPersonAction({ ...person, variants: Array(21).fill('x') })
    ).toEqual({ error: { fields: { variants: 'too-many' } }, ok: false });
    expect(await listFor('a')).toEqual([]);
  });

  it('gives no-such-day for a birth of 31 FEB 1850 and saves nothing', async () => {
    const { listFor } = await setup();

    expect(
      await createPersonAction({ ...person, birth: '31 FEB 1850' })
    ).toEqual({ error: { fields: { birth: 'no-such-day' } }, ok: false });
    expect(await listFor('a')).toEqual([]);
  });

  it('gives invalid for input the form stops, and saves nothing', async () => {
    const { listFor } = await setup();

    expect(await createPersonAction({ ...person, sex: 'Q' })).toEqual({
      error: 'invalid',
      ok: false,
    });
    expect(await listFor('a')).toEqual([]);
  });

  it('reads back every field of a saved Person', async () => {
    const { listFor } = await setup();
    const created = await createPersonAction({
      ...person,
      birth: 'ABT 1850',
      deceased: true,
      maidenName: 'Joubert',
      notes: 'A note',
      sex: 'F',
      variants: ['Anna'],
    });

    expect(created.ok && created.value).toMatchObject({
      birth: { date1: '1850', qualifier: 'ABT' },
      deceased: true,
      givenNames: 'Ana',
      id: ID,
      maidenName: 'Joubert',
      notes: 'A note',
      sex: 'F',
      surname: 'Smit',
      variants: ['Anna'],
      version: 1,
    });
    expect(await listFor('a')).toEqual([created.ok && created.value]);
  });

  // PPL-01: Back to a cached page must not show the Person from before the save.
  it('revalidates the people pages after a save, and after nothing else', async () => {
    await setup();

    await createPersonAction({ ...person, surname: '' });
    await createPersonAction({ ...person, sex: 'Q' });

    expect(revalidate).not.toHaveBeenCalled();

    await createPersonAction(person);

    expect(revalidate).toHaveBeenCalledExactlyOnceWith('/people', 'layout');
  });

  it('saves one Person for the same create twice', async () => {
    const { listFor } = await setup();

    await createPersonAction(person);
    await createPersonAction(person);

    expect(await listFor('a')).toHaveLength(1);
  });

  it('gives not-found with no cookie', async () => {
    await setup();
    jar.get.mockReturnValue(undefined);

    expect(await createPersonAction(person)).toEqual({
      error: 'not-found',
      ok: false,
    });
  });
});

// PPL-01, NFR-09
describe('updatePersonAction', () => {
  it('saves a change that names the version read', async () => {
    await setup();
    await createPersonAction(person);

    const updated = await updatePersonAction({
      person: { ...person, surname: 'Botha' },
      version: 1,
    });

    expect(updated.ok && updated.value).toMatchObject({
      surname: 'Botha',
      version: 2,
    });
  });

  // PPL-01
  it('revalidates the people pages after a saved change, not after a conflict', async () => {
    await setup();
    await createPersonAction(person);
    revalidate.mockClear();

    await updatePersonAction({
      person: { ...person, surname: '' },
      version: 1,
    });
    await updatePersonAction({
      person: { ...person, surname: 'Botha' },
      version: 9,
    });

    expect(revalidate).not.toHaveBeenCalled();

    await updatePersonAction({
      person: { ...person, surname: 'Botha' },
      version: 1,
    });

    expect(revalidate).toHaveBeenCalledExactlyOnceWith('/people', 'layout');
  });

  it('gives conflict for an old version', async () => {
    await setup();
    await createPersonAction(person);
    await updatePersonAction({ person, version: 1 });

    expect(await updatePersonAction({ person, version: 1 })).toEqual({
      error: 'conflict',
      ok: false,
    });
  });

  it('gives a field error and changes nothing', async () => {
    const { listFor } = await setup();

    await createPersonAction(person);

    expect(
      await updatePersonAction({
        person: { ...person, surname: '' },
        version: 1,
      })
    ).toEqual({ error: { fields: { surname: 'required' } }, ok: false });
    expect((await listFor('a'))[0]).toMatchObject({
      surname: 'Smit',
      version: 1,
    });
  });

  it.each([
    ['a zero version', { person, version: 0 }],
    ['a fractional version', { person, version: 1.5 }],
    ['a text version', { person, version: '1' }],
    ['no version', { person }],
    ['a bad Person', { person: { ...person, id: 'nope' }, version: 1 }],
  ])('gives invalid for %s', async (_what, input) => {
    await setup();

    expect(await updatePersonAction(input)).toEqual({
      error: 'invalid',
      ok: false,
    });
  });

  it('gives Account B the result of a Person that does not exist', async () => {
    const { listFor, signInAs } = await setup();
    const missing = await updatePersonAction({ person, version: 1 });

    await createPersonAction(person);
    signInAs('b');

    expect(missing).toEqual({ error: 'not-found', ok: false });
    expect(await updatePersonAction({ person, version: 1 })).toEqual(missing);
    expect(await listFor('a')).toHaveLength(1);
  });
});
