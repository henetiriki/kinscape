import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));
const revalidate = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('next/cache', () => ({ revalidatePath: revalidate }));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));

import type { TreeScope } from '@ks/lib/domain/trees/types.ts';

import {
  createPersonAction,
  createRelationshipAction,
  updatePersonAction,
  updateRelationshipAction,
} from '@ks/app/people/actions';
import { checkRelationshipInput } from '@ks/lib/domain/relationships/form.mts';
import { MAX_RELATIONSHIPS } from '@ks/lib/domain/relationships/schemas.mts';
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
  let scopeA: TreeScope | undefined;

  for (const subject of ['a', 'b']) {
    const added = await store.addAccount({
      issuer: 'test',
      subject,
      treeName: `Tree ${subject}`,
    });

    if (!added.ok) {
      throw new Error('setup failed');
    }

    if (subject === 'a') {
      scopeA = added.value;
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
    /** The Relationships that an Account's Tree holds, read outside the actions. */
    relationshipsFor: async (subject: 'a' | 'b') => {
      const opened = await openTree({ sessions, store }, tokens[subject]);

      if (!opened.ok) {
        throw new Error('open failed');
      }

      return opened.value.relationships.list();
    },
    scopeA: scopeA as TreeScope,
    signInAs: (subject: 'a' | 'b') =>
      jar.get.mockReturnValue({ value: tokens[subject] }),
    store,
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

const P1 = '01900000-0000-7000-8000-0000000000a1';
const P2 = '01900000-0000-7000-8000-0000000000a2';
const P3 = '01900000-0000-7000-8000-0000000000a3';
const P4 = '01900000-0000-7000-8000-0000000000a4';
const R1 = '01900000-0000-7000-8000-0000000000c1';
const R2 = '01900000-0000-7000-8000-0000000000c2';
const R3 = '01900000-0000-7000-8000-0000000000c3';

const parent = (
  id: string,
  parentId: string,
  childId: string,
  subtype = 'biological'
) => ({
  childId,
  id,
  parentId,
  subtype,
  type: 'parent',
});
const spouse = (id: string, personAId: string, personBId: string) => ({
  id,
  personAId,
  personBId,
  type: 'spouse',
});

/** Sets up two Accounts and four Persons in Account A's Tree. */
const setupWithPersons = async () => {
  const context = await setup();

  for (const id of [P1, P2, P3, P4]) {
    await createPersonAction({ ...person, id });
  }

  revalidate.mockClear();

  return context;
};

// PPL-02, NFR-09
describe('createRelationshipAction', () => {
  it('saves an adoptive parent link and reads it back equal', async () => {
    const { relationshipsFor } = await setupWithPersons();
    const created = await createRelationshipAction(
      parent(R1, P1, P2, 'adoptive')
    );

    expect(created).toEqual({
      ok: true,
      value: { ...parent(R1, P1, P2, 'adoptive'), version: 1 },
    });
    expect(await relationshipsFor('a')).toEqual([created.ok && created.value]);
  });

  it('reads back both dates of a spouse link', async () => {
    const { relationshipsFor } = await setupWithPersons();
    const created = await createRelationshipAction({
      ...spouse(R1, P1, P2),
      divorce: '1900',
      marriage: '14 MAR 1890',
    });

    expect(created.ok && created.value).toMatchObject({
      divorce: { date1: '1900' },
      marriage: { date1: '1890-03-14' },
      version: 1,
    });
    expect(await relationshipsFor('a')).toEqual([created.ok && created.value]);
  });

  it('saves one Relationship for the same create twice', async () => {
    const { relationshipsFor } = await setupWithPersons();

    await createRelationshipAction(parent(R1, P1, P2));
    await createRelationshipAction(parent(R1, P1, P2));

    expect(await relationshipsFor('a')).toHaveLength(1);
  });

  it.each([
    ['self', parent(R2, P1, P1), []],
    ['cycle', parent(R2, P2, P1), [parent(R1, P1, P2)]],
    [
      'third-biological-parent',
      parent(R3, P3, P4),
      [parent(R1, P1, P4), parent(R2, P2, P4)],
    ],
    ['duplicate', parent(R2, P1, P2, 'step'), [parent(R1, P1, P2)]],
    ['duplicate', spouse(R2, P2, P1), [spouse(R1, P1, P2)]],
    ['duplicate', spouse(R2, P1, P2), [spouse(R1, P1, P2)]],
  ])('gives %s and saves nothing', async (code, input, existing) => {
    const { relationshipsFor } = await setupWithPersons();

    for (const link of existing) {
      await createRelationshipAction(link);
    }

    expect(await createRelationshipAction(input)).toEqual({
      error: code,
      ok: false,
    });
    expect(await relationshipsFor('a')).toHaveLength(existing.length);
  });

  it('gives tree-full for one more link in a full Tree', async () => {
    const { relationshipsFor, scopeA, store } = await setupWithPersons();
    const spouseInput = (n: number) => {
      const checked = checkRelationshipInput(
        spouse(
          n === 0
            ? R1
            : `01900000-0000-7000-9000-${(0x100000 + n).toString(16).padStart(12, '0')}`,
          P1,
          P2
        )
      );

      if (!checked.ok) {
        throw new Error('setup failed');
      }

      return checked.value;
    };

    for (let n = 0; n < MAX_RELATIONSHIPS; n += 1) {
      await store.addRelationship({ ...scopeA, relationship: spouseInput(n) });
    }

    expect(await createRelationshipAction(parent(R2, P1, P3))).toEqual({
      error: 'tree-full',
      ok: false,
    });
    expect(await relationshipsFor('a')).toHaveLength(MAX_RELATIONSHIPS);
  }, 120_000);

  it('gives divorce-before-marriage and saves nothing', async () => {
    const { relationshipsFor } = await setupWithPersons();

    expect(
      await createRelationshipAction({
        ...spouse(R1, P1, P2),
        divorce: '1890',
        marriage: '1900',
      })
    ).toEqual({ error: 'divorce-before-marriage', ok: false });
    expect(await relationshipsFor('a')).toEqual([]);
  });

  it.each([
    ['a bad id', { ...parent(R1, P1, P2), id: 'nope' }],
    ['a bad type', { ...parent(R1, P1, P2), type: 'sibling' }],
    ['a bad subtype', parent(R1, P1, P2, 'foster')],
    ['no object', 'parent'],
  ])('gives invalid for %s', async (_what, input) => {
    const { relationshipsFor } = await setupWithPersons();

    expect(await createRelationshipAction(input)).toEqual({
      error: 'invalid',
      ok: false,
    });
    expect(await relationshipsFor('a')).toEqual([]);
  });

  it('gives not-found for a Person in another Account, or a missing one', async () => {
    const { relationshipsFor, signInAs } = await setupWithPersons();
    const missingPerson = '01900000-0000-7000-8000-0000000000a9';

    signInAs('b');

    expect(await createRelationshipAction(parent(R1, P1, P2))).toEqual({
      error: 'not-found',
      ok: false,
    });
    expect(
      await createRelationshipAction(parent(R1, P1, missingPerson))
    ).toEqual({ error: 'not-found', ok: false });
    expect(await relationshipsFor('a')).toEqual([]);
    expect(await relationshipsFor('b')).toEqual([]);
  });

  it('revalidates the people pages after a save, and after nothing else', async () => {
    await setupWithPersons();

    await createRelationshipAction(parent(R1, P1, P1));
    await createRelationshipAction({ ...parent(R1, P1, P2), type: 'x' });

    expect(revalidate).not.toHaveBeenCalled();

    await createRelationshipAction(parent(R1, P1, P2));

    expect(revalidate).toHaveBeenCalledExactlyOnceWith('/people', 'layout');
  });
});

// PPL-02, NFR-09
describe('updateRelationshipAction', () => {
  it('saves a change of the subtype and reads it back', async () => {
    const { relationshipsFor } = await setupWithPersons();

    await createRelationshipAction(parent(R1, P1, P2));

    const updated = await updateRelationshipAction({
      relationship: parent(R1, P1, P2, 'adoptive'),
      version: 1,
    });

    expect(updated).toEqual({
      ok: true,
      value: { ...parent(R1, P1, P2, 'adoptive'), version: 2 },
    });
    expect(await relationshipsFor('a')).toEqual([updated.ok && updated.value]);
  });

  it('saves a change of a date and reads it back', async () => {
    const { relationshipsFor } = await setupWithPersons();

    await createRelationshipAction({ ...spouse(R1, P1, P2), marriage: '1890' });

    const updated = await updateRelationshipAction({
      relationship: {
        ...spouse(R1, P1, P2),
        divorce: '1900',
        marriage: '1891',
      },
      version: 1,
    });

    expect(updated.ok && updated.value).toMatchObject({
      divorce: { date1: '1900' },
      marriage: { date1: '1891' },
      version: 2,
    });
    expect(await relationshipsFor('a')).toEqual([updated.ok && updated.value]);
  });

  it('gives conflict for an old version', async () => {
    await setupWithPersons();
    await createRelationshipAction(parent(R1, P1, P2));
    await updateRelationshipAction({
      relationship: parent(R1, P1, P2, 'step'),
      version: 1,
    });

    expect(
      await updateRelationshipAction({
        relationship: parent(R1, P1, P2),
        version: 1,
      })
    ).toEqual({ error: 'conflict', ok: false });
  });

  it.each([
    ['the type', spouse(R1, P1, P2)],
    ['a Person', parent(R1, P1, P3)],
  ])('gives not-found for a change of %s', async (_what, relationship) => {
    await setupWithPersons();
    await createRelationshipAction(parent(R1, P1, P2));

    expect(
      await updateRelationshipAction({ relationship, version: 1 })
    ).toEqual({ error: 'not-found', ok: false });
  });

  it('gives a refusal and changes nothing', async () => {
    const { relationshipsFor } = await setupWithPersons();

    await createRelationshipAction(parent(R1, P1, P4));
    await createRelationshipAction(parent(R2, P2, P4));
    await createRelationshipAction(parent(R3, P3, P4, 'step'));

    expect(
      await updateRelationshipAction({
        relationship: parent(R3, P3, P4),
        version: 1,
      })
    ).toEqual({ error: 'third-biological-parent', ok: false });
    expect(await relationshipsFor('a')).toHaveLength(3);
    expect(await relationshipsFor('a')).toContainEqual({
      ...parent(R3, P3, P4, 'step'),
      version: 1,
    });
  });

  it('gives divorce-before-marriage and changes nothing', async () => {
    const { relationshipsFor } = await setupWithPersons();

    await createRelationshipAction(spouse(R1, P1, P2));

    expect(
      await updateRelationshipAction({
        relationship: {
          ...spouse(R1, P1, P2),
          divorce: '1890',
          marriage: '1900',
        },
        version: 1,
      })
    ).toEqual({ error: 'divorce-before-marriage', ok: false });
    expect((await relationshipsFor('a'))[0]).toMatchObject({ version: 1 });
  });

  it.each([
    ['a zero version', { relationship: parent(R1, P1, P2), version: 0 }],
    ['a text version', { relationship: parent(R1, P1, P2), version: '1' }],
    ['no version', { relationship: parent(R1, P1, P2) }],
    [
      'a bad id',
      { relationship: { ...parent(R1, P1, P2), id: 'nope' }, version: 1 },
    ],
    [
      'a bad type',
      { relationship: { ...parent(R1, P1, P2), type: 'x' }, version: 1 },
    ],
    [
      'a bad subtype',
      { relationship: parent(R1, P1, P2, 'foster'), version: 1 },
    ],
  ])('gives invalid for %s', async (_what, input) => {
    await setupWithPersons();

    expect(await updateRelationshipAction(input)).toEqual({
      error: 'invalid',
      ok: false,
    });
  });

  it('gives Account B the result of a Relationship that does not exist', async () => {
    const { relationshipsFor, signInAs } = await setupWithPersons();
    const input = { relationship: parent(R1, P1, P2), version: 1 };
    const missing = await updateRelationshipAction(input);

    await createRelationshipAction(parent(R1, P1, P2));
    signInAs('b');

    expect(missing).toEqual({ error: 'not-found', ok: false });
    expect(await updateRelationshipAction(input)).toEqual(missing);
    expect(await relationshipsFor('a')).toHaveLength(1);
  });

  it('revalidates the people pages after a saved change, not after a refusal', async () => {
    await setupWithPersons();
    await createRelationshipAction(parent(R1, P1, P2));
    revalidate.mockClear();

    await updateRelationshipAction({
      relationship: parent(R1, P1, P1),
      version: 1,
    });
    await updateRelationshipAction({
      relationship: parent(R1, P1, P2, 'step'),
      version: 9,
    });

    expect(revalidate).not.toHaveBeenCalled();

    await updateRelationshipAction({
      relationship: parent(R1, P1, P2, 'step'),
      version: 1,
    });

    expect(revalidate).toHaveBeenCalledExactlyOnceWith('/people', 'layout');
  });
});
