import { describe, expect, it, vi } from 'vitest';

import type {
  AccountId,
  PersonId,
  PinId,
  PlaceId,
  RelationshipId,
  TreeId,
} from '@ks/lib/domain/ids/types.ts';
import type { PersonInput } from '@ks/lib/domain/persons/types.ts';
import type { PinInput } from '@ks/lib/domain/pins/types.ts';
import type { PlaceInput } from '@ks/lib/domain/places/types.ts';
import type { RelationshipInput } from '@ks/lib/domain/relationships/types.ts';
import type { SeedAccount, TreeStore } from '@ks/lib/domain/trees/types.ts';

import { asDay, toDay } from '@ks/lib/domain/boundaries/model.mts';
import { parseAccountId, parseTreeId } from '@ks/lib/domain/ids/ids.mts';
import {
  MAX_LISTED,
  personInputSchema,
} from '@ks/lib/domain/persons/schemas.mts';
import { MAX_PINS, pinInputSchema } from '@ks/lib/domain/pins/schemas.mts';
import {
  MAX_PLACES,
  placeInputSchema,
} from '@ks/lib/domain/places/schemas.mts';
import {
  MAX_RELATIONSHIPS,
  relationshipInputSchema,
} from '@ks/lib/domain/relationships/schemas.mts';
import { isCurrentOn } from '@ks/lib/domain/validity/validity.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { openTree } from '@ks/server/trees/repository.mts';

const MISSING_ACCOUNT = parseAccountId('00000000-0000-4000-8000-000000000000')!;
const MISSING_TREE = parseTreeId('00000000-0000-4000-8000-000000000000')!;
// A cast can hold a string that is not a UUID; a store still finds nothing for it.
const MALFORMED_ACCOUNT = 'not-a-uuid' as AccountId;
const MALFORMED_TREE = 'not-a-uuid' as TreeId;
const NOW = new Date('2030-01-01T00:00:00Z');
const ID_1 = '01900000-0000-7000-8000-0000000000a1' as PersonId;
const ID_2 = '01900000-0000-7000-8000-0000000000a2' as PersonId;
const ID_3 = '01900000-0000-7000-8000-0000000000a3' as PersonId;
const ID_4 = '01900000-0000-7000-8000-0000000000a4' as PersonId;
const ID_5 = '01900000-0000-7000-8000-0000000000a5';
const REL_1 = '01900000-0000-7000-9000-0000000000b1';
const REL_2 = '01900000-0000-7000-9000-0000000000b2';
const REL_3 = '01900000-0000-7000-9000-0000000000b3';
const REL_4 = '01900000-0000-7000-9000-0000000000b4';

const relOf = (fields: Record<string, unknown>): RelationshipInput =>
  relationshipInputSchema.parse(fields);
const parentOf = (
  id: string,
  parentId: string,
  childId: string,
  subtype = 'biological'
) => relOf({ childId, id, parentId, subtype, type: 'parent' });
const spouseOf = (
  id: string,
  personAId: string,
  personBId: string,
  dates: Record<string, unknown> = {}
) => relOf({ id, personAId, personBId, type: 'spouse', ...dates });

/** A synthetic Person as a client's text parses: the schema fills what `fields` omits. */
const personOf = (id: string, fields: Record<string, unknown>): PersonInput =>
  personInputSchema.parse({ ...fields, id });
const PLACE_1 = '01900000-0000-7000-a000-0000000000c1' as PlaceId;
const PLACE_2 = '01900000-0000-7000-a000-0000000000c2' as PlaceId;
const PLACE_3 = '01900000-0000-7000-a000-0000000000c3' as PlaceId;
const PLACE_4 = '01900000-0000-7000-a000-0000000000c4' as PlaceId;

/** A synthetic Place as a client's text parses: the schema fills what `fields` omits. */
const placeOf = (id: string, fields: Record<string, unknown>): PlaceInput =>
  placeInputSchema.parse({
    latitude: -33.9,
    longitude: 18.4,
    ...fields,
    id,
  });

const PIN_1 = '01900000-0000-7000-b000-0000000000d1' as PinId;
const PIN_2 = '01900000-0000-7000-b000-0000000000d2' as PinId;
const PIN_3 = '01900000-0000-7000-b000-0000000000d3' as PinId;

/** A synthetic Pin as a client's text parses: the schema fills what `fields` omits. */
const pinOf = (id: string, fields: Record<string, unknown> = {}): PinInput =>
  pinInputSchema.parse({
    date: '1850',
    eventType: 'residence',
    personId: ID_1,
    placeId: PLACE_1,
    ...fields,
    id,
  });

export const NOT_FOUND = { error: 'not-found', ok: false };
const NO_TREE: SeedAccount = {
  id: parseAccountId('00000000-0000-4000-8000-0000000000a1')!,
  issuer: 'test',
  subject: 'no-tree',
  trees: [],
};

/** The suite every TreeStore adapter passes (NFR-09, NFR-10). Data is synthetic. */
export const runTreeStoreContract = (
  name: string,
  open: (
    seed: SeedAccount[]
  ) => Promise<{ close: () => Promise<void>; store: TreeStore }>
) => {
  describe(`${name} TreeStore contract`, () => {
    const withStore = async (
      test: (store: TreeStore) => Promise<void>,
      seed: SeedAccount[] = []
    ): Promise<void> => {
      const { close, store } = await open(seed);

      try {
        await test(store);
      } finally {
        await close();
      }
    };

    // NFR-09
    it('gives an Account its Tree', async () => {
      await withStore(async store => {
        const added = await store.addAccount({
          issuer: 'test',
          subject: 'a',
          treeName: 'Tree A',
        });

        expect(added.ok).toBe(true);

        if (!added.ok) {
          return;
        }

        expect(await store.findTree(added.value)).toEqual({
          id: added.value.treeId,
          name: 'Tree A',
        });
      });
    });

    // NFR-09
    it('treats another Account’s Tree as a Tree that does not exist', async () => {
      await withStore(async store => {
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

        const cross = await store.findTree({
          accountId: b.value.accountId,
          treeId: a.value.treeId,
        });
        const missing = await store.findTree({
          accountId: b.value.accountId,
          treeId: MISSING_TREE,
        });

        expect(cross).toBeUndefined();
        expect(cross).toEqual(missing);
        expect(
          await store.findTree({
            accountId: MISSING_ACCOUNT,
            treeId: a.value.treeId,
          })
        ).toBeUndefined();
      });
    });

    // NFR-09
    it('refuses an identity that already has an Account', async () => {
      await withStore(async store => {
        const input = { issuer: 'test', subject: 'a', treeName: 'Tree A' };
        const first = await store.addAccount(input);
        const second = await store.addAccount({ ...input, treeName: 'Other' });

        if (!first.ok) {
          throw new Error('setup failed');
        }

        expect(second).toEqual({ error: 'exists', ok: false });
        expect(await store.findTree(first.value)).toEqual({
          id: first.value.treeId,
          name: 'Tree A',
        });
      });
    });

    // NFR-03
    it('finds an Account by issuer and subject', async () => {
      await withStore(async store => {
        const added = await store.addAccount({
          issuer: 'test',
          subject: 'a',
          treeName: 'Tree A',
        });

        if (!added.ok) {
          throw new Error('setup failed');
        }

        expect(await store.findAccount('test', 'a')).toEqual({
          id: added.value.accountId,
        });
        expect(await store.findAccount('other', 'a')).toBeUndefined();
        expect(await store.findAccount('test', 'b')).toBeUndefined();
      });
    });

    // NFR-03
    it('finds only the Trees of the Account asked about', async () => {
      await withStore(async store => {
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

        expect(await store.findTrees(a.value.accountId)).toEqual([
          { id: a.value.treeId, name: 'Tree A' },
        ]);
        expect(await store.findTrees(b.value.accountId)).toEqual([
          { id: b.value.treeId, name: 'Tree B' },
        ]);
        expect(await store.findTrees(MISSING_ACCOUNT)).toEqual([]);
      });
    });

    // NFR-03
    it('treats an id that is not a UUID as one that matches nothing', async () => {
      await withStore(async store => {
        const added = await store.addAccount({
          issuer: 'test',
          subject: 'a',
          treeName: 'Tree A',
        });

        if (!added.ok) {
          throw new Error('setup failed');
        }

        expect(await store.findTrees(MALFORMED_ACCOUNT)).toEqual([]);
        expect(
          await store.findTree({
            accountId: MALFORMED_ACCOUNT,
            treeId: added.value.treeId,
          })
        ).toBe(undefined);
        expect(
          await store.findTree({
            accountId: added.value.accountId,
            treeId: MALFORMED_TREE,
          })
        ).toBe(undefined);
      });
    });

    // NFR-03
    it('gives an Account with no Tree an empty list', async () => {
      await withStore(
        async store => {
          const found = await store.findAccount(
            NO_TREE.issuer,
            NO_TREE.subject
          );

          expect(found).toEqual({ id: NO_TREE.id });
          expect(await store.findTrees(NO_TREE.id)).toEqual([]);
        },
        [NO_TREE]
      );
    });

    // NFR-09
    it('lets the same subject sign in under another issuer', async () => {
      await withStore(async store => {
        const one = await store.addAccount({
          issuer: 'one',
          subject: 'a',
          treeName: 'Tree',
        });
        const two = await store.addAccount({
          issuer: 'two',
          subject: 'a',
          treeName: 'Tree',
        });

        expect(one.ok && two.ok).toBe(true);
      });
    });

    const twoTrees = async (store: TreeStore) => {
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

      return { a: a.value, b: b.value };
    };

    describe('persons', () => {
      // PPL-01
      it('reads back every field of a Person born ABT 1850', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const person = personOf(ID_1, {
            birth: 'ABT 1850',
            death: 'BET 1900 AND MAR 1910',
            deceased: true,
            givenNames: 'Ana',
            maidenName: 'Dube',
            notes: 'Synthetic.',
            sex: 'F',
            surname: 'Test',
            variants: ['Anna', 'Ana'],
          });

          expect(person.birth?.qualifier).toBe('ABT');
          expect(await store.addPerson({ ...a, person })).toEqual({
            ...person,
            version: 1,
          });
          expect(await store.findPerson({ ...a, personId: ID_1 })).toEqual({
            ...person,
            version: 1,
          });
          expect(await store.listPersons(a)).toEqual([
            { ...person, version: 1 },
          ]);
        });
      });

      // PPL-01
      it('saves a Person with no sex as unknown', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const saved = await store.addPerson({
            ...a,
            person: personOf(ID_1, {}),
          });

          expect(saved?.sex).toBe('U');
          expect(saved?.birth).toBeUndefined();
        });
      });

      // NFR-09
      it('gives Account B the result of a Person that does not exist', async () => {
        await withStore(async store => {
          const { a, b } = await twoTrees(store);

          await store.addPerson({ ...a, person: personOf(ID_1, {}) });

          const cross = { accountId: b.accountId, treeId: a.treeId };
          const missing = { ...a, personId: ID_2 };

          expect(await store.findPerson({ ...cross, personId: ID_1 })).toEqual(
            await store.findPerson(missing)
          );
          expect(await store.listPersons(cross)).toEqual([]);
          expect(
            await store.addPerson({ ...cross, person: personOf(ID_2, {}) })
          ).toBeUndefined();
          expect(
            await store.updatePerson({
              ...cross,
              person: personOf(ID_1, { surname: 'Taken' }),
              version: 1,
            })
          ).toEqual({ error: 'not-found', ok: false });
          expect(await store.listPersons(a)).toHaveLength(1);
          expect(
            (await store.findPerson({ ...a, personId: ID_1 }))?.surname
          ).toBe('');
        });
      });

      // NFR-09
      it('keeps the same id apart in two Trees', async () => {
        await withStore(async store => {
          const { a, b } = await twoTrees(store);

          await store.addPerson({
            ...a,
            person: personOf(ID_1, { surname: 'One' }),
          });
          await store.addPerson({
            ...b,
            person: personOf(ID_1, { surname: 'Two' }),
          });

          expect(
            (await store.findPerson({ ...a, personId: ID_1 }))?.surname
          ).toBe('One');
          expect(
            (await store.findPerson({ ...b, personId: ID_1 }))?.surname
          ).toBe('Two');
        });
      });

      // NFR-09
      it('ignores a repeated create with the same id', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const first = await store.addPerson({
            ...a,
            person: personOf(ID_1, { surname: 'First' }),
          });
          const again = await store.addPerson({
            ...a,
            person: personOf(ID_1, { surname: 'Second' }),
          });

          expect(again).toEqual(first);
          expect(await store.listPersons(a)).toEqual([first]);
        });
      });

      // NFR-09
      it('updates with the version read, and refuses a stale one', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          await store.addPerson({
            ...a,
            person: personOf(ID_1, { surname: 'Old' }),
          });

          const update = (surname: string, version: number, id = ID_1) =>
            store.updatePerson({
              ...a,
              person: personOf(id, { surname }),
              version,
            });
          const updated = await update('New', 1);

          expect(updated.ok && updated.value.version).toBe(2);
          expect(updated.ok && updated.value.surname).toBe('New');
          expect(await update('Stale', 1)).toEqual({
            error: 'conflict',
            ok: false,
          });
          expect(await update('Gone', 1, ID_2)).toEqual({
            error: 'not-found',
            ok: false,
          });
          expect(
            (await store.findPerson({ ...a, personId: ID_1 }))?.surname
          ).toBe('New');
        });
      });

      // PPL-01
      it('removes a date that an update leaves out', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          await store.addPerson({
            ...a,
            person: personOf(ID_1, { birth: '1850' }),
          });

          const updated = await store.updatePerson({
            ...a,
            person: personOf(ID_1, {}),
            version: 1,
          });

          expect(updated.ok && updated.value.birth).toBeUndefined();
        });
      });

      // NFR-09
      it('lists by surname, given names, then id', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const ids = [ID_3, ID_1, ID_2, ID_4];
          const names = [
            ['Bee', 'Ann'],
            ['Bee', 'Ann'],
            ['Bee', 'Abe'],
            ['Axe', 'Zed'],
          ];

          for (const [index, id] of ids.entries()) {
            const [surname, givenNames] = names[index];

            await store.addPerson({
              ...a,
              person: personOf(id, { givenNames, surname }),
            });
          }

          expect((await store.listPersons(a)).map(p => p.id)).toEqual([
            ID_4,
            ID_2,
            ID_1,
            ID_3,
          ]);
        });
      });

      // PPL-01
      it('lists no more than the cap', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          for (let n = 0; n <= MAX_LISTED; n += 1) {
            await store.addPerson({
              ...a,
              person: personOf(
                `01900000-0000-7000-8000-${String(n).padStart(12, '0')}`,
                {}
              ),
            });
          }

          expect(await store.listPersons(a)).toHaveLength(MAX_LISTED);
        });
      }, 60_000);

      // NFR-03
      it('treats an id that is not a UUID as one that matches nothing', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const bad = { accountId: MALFORMED_ACCOUNT, treeId: a.treeId };
          const badTree = { accountId: a.accountId, treeId: MALFORMED_TREE };

          expect(await store.listPersons(bad)).toEqual([]);
          expect(await store.listPersons(badTree)).toEqual([]);
          expect(
            await store.findPerson({
              ...a,
              personId: 'nope' as PersonId,
            })
          ).toBeUndefined();
          expect(
            await store.addPerson({ ...badTree, person: personOf(ID_1, {}) })
          ).toBeUndefined();
          expect(
            await store.addPerson({
              ...a,
              person: { ...personOf(ID_1, {}), id: 'nope' as PersonId },
            })
          ).toBeUndefined();
          expect(await store.listPersons(a)).toEqual([]);
          expect(
            await store.updatePerson({
              ...a,
              person: { ...personOf(ID_1, {}), id: 'nope' as PersonId },
              version: 1,
            })
          ).toEqual({ error: 'not-found', ok: false });
        });
      });

      // PPL-01
      it('keeps one Person for an id in either case', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const upper = ID_1.replace('a1', 'A1');

          await store.addPerson({
            ...a,
            person: personOf(upper, { surname: 'First' }),
          });
          await store.addPerson({
            ...a,
            person: personOf(ID_1, { surname: 'Second' }),
          });

          const listed = await store.listPersons(a);

          expect(listed.map(p => [p.id, p.surname])).toEqual([[ID_1, 'First']]);
        });
      });

      // NFR-09
      it.each([0, 1.5, Number.NaN, 2 ** 31, -1])(
        'gives conflict for the version %s',
        async version => {
          await withStore(async store => {
            const { a } = await twoTrees(store);

            await store.addPerson({ ...a, person: personOf(ID_1, {}) });

            expect(
              await store.updatePerson({
                ...a,
                person: personOf(ID_1, { surname: 'New' }),
                version,
              })
            ).toEqual({ error: 'conflict', ok: false });
          });
        }
      );

      // NFR-09
      it('returns copies that a caller may change', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const input = personOf(ID_1, {
            birth: '1850',
            variants: ['Anna'],
          });
          const added = await store.addPerson({ ...a, person: input });
          const found = await store.findPerson({ ...a, personId: ID_1 });
          const [listed] = await store.listPersons(a);

          for (const copy of [added, found, listed, input]) {
            copy?.variants.push('Changed');

            if (copy?.birth) {
              copy.birth.date1 = '1900';
            }
          }

          const saved = await store.findPerson({ ...a, personId: ID_1 });

          expect(saved?.variants).toEqual(['Anna']);
          expect(saved?.birth?.date1).toBe('1850');
        });
      });

      // NFR-09
      it('lists names in code-point order', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          await store.addPerson({
            ...a,
            person: personOf(ID_1, { surname: '\u{1D504}' }),
          });
          await store.addPerson({
            ...a,
            person: personOf(ID_2, { surname: 'Ａ' }),
          });

          // U+FF21 (bytes EF BC A1) sorts before U+1D504 (bytes F0 9D 94 84).
          expect((await store.listPersons(a)).map(p => p.id)).toEqual([
            ID_2,
            ID_1,
          ]);
        });
      });
    });

    describe('relationships', () => {
      /** Two Trees; Tree A holds Persons 1 to 3 and Tree B holds Person 4. */
      const withPersons = async (store: TreeStore) => {
        const trees = await twoTrees(store);

        for (const id of [ID_1, ID_2, ID_3]) {
          await store.addPerson({ ...trees.a, person: personOf(id, {}) });
        }

        await store.addPerson({ ...trees.b, person: personOf(ID_4, {}) });

        return trees;
      };

      // PPL-02
      it('reads back a spouse married ABT 1870 and divorced 1885', async () => {
        await withStore(async store => {
          const { a } = await withPersons(store);
          const relationship = spouseOf(REL_1, ID_1, ID_2, {
            divorce: '1885',
            marriage: 'ABT 1870',
          });
          const expected = { ...relationship, version: 1 };

          expect(relationship).toMatchObject({
            divorce: { date1: '1885' },
            marriage: { qualifier: 'ABT' },
          });
          expect(await store.addRelationship({ ...a, relationship })).toEqual({
            ok: true,
            value: expected,
          });
          expect(
            await store.findRelationship({
              ...a,
              relationshipId: relationship.id,
            })
          ).toEqual(expected);
          expect(await store.listRelationships(a)).toEqual([expected]);
        });
      });

      // PPL-02
      it('reads back a parent with its subtype and no dates', async () => {
        await withStore(async store => {
          const { a } = await withPersons(store);
          const relationship = relOf({
            childId: ID_2,
            id: REL_1,
            parentId: ID_1,
            subtype: 'adoptive',
            type: 'parent',
          });

          await store.addRelationship({ ...a, relationship });

          expect(await store.listRelationships(a)).toEqual([
            { ...relationship, version: 1 },
          ]);
        });
      });

      // NFR-09
      it('refuses a Relationship that joins Persons of two Trees', async () => {
        await withStore(async store => {
          const { a } = await withPersons(store);

          for (const relationship of [
            parentOf(REL_1, ID_1, ID_4),
            parentOf(REL_1, ID_4, ID_1),
            spouseOf(REL_1, ID_1, ID_4),
            parentOf(REL_1, ID_1, '01900000-0000-7000-8000-0000000000ff'),
          ]) {
            expect(await store.addRelationship({ ...a, relationship })).toEqual(
              NOT_FOUND
            );
          }

          expect(await store.listRelationships(a)).toEqual([]);
        });
      });

      // NFR-09
      it('gives Account B the result of a Relationship that does not exist', async () => {
        await withStore(async store => {
          const { a, b } = await withPersons(store);

          await store.addRelationship({
            ...a,
            relationship: parentOf(REL_1, ID_1, ID_2),
          });

          const cross = { accountId: b.accountId, treeId: a.treeId };

          expect(
            await store.findRelationship({
              ...cross,
              relationshipId: REL_1 as RelationshipId,
            })
          ).toEqual(
            await store.findRelationship({
              ...a,
              relationshipId: REL_2 as RelationshipId,
            })
          );
          expect(await store.listRelationships(cross)).toEqual([]);
          expect(
            await store.addRelationship({
              ...cross,
              relationship: parentOf(REL_2, ID_2, ID_3),
            })
          ).toEqual(NOT_FOUND);
          expect(
            await store.updateRelationship({
              ...cross,
              relationship: relOf({
                childId: ID_2,
                id: REL_1,
                parentId: ID_1,
                subtype: 'step',
                type: 'parent',
              }),
              version: 1,
            })
          ).toEqual(NOT_FOUND);
          expect(await store.listRelationships(a)).toHaveLength(1);
        });
      });

      // NFR-09
      it('keeps the same id apart in two Trees', async () => {
        await withStore(async store => {
          const { a, b } = await withPersons(store);

          await store.addPerson({ ...b, person: personOf(ID_1, {}) });
          await store.addRelationship({
            ...a,
            relationship: parentOf(REL_1, ID_1, ID_2),
          });
          await store.addRelationship({
            ...b,
            relationship: spouseOf(REL_1, ID_1, ID_4),
          });

          expect((await store.listRelationships(a))[0].type).toBe('parent');
          expect((await store.listRelationships(b))[0].type).toBe('spouse');
        });
      });

      // NFR-09
      it('ignores a repeated add with the same id', async () => {
        await withStore(async store => {
          const { a } = await withPersons(store);
          const first = await store.addRelationship({
            ...a,
            relationship: parentOf(REL_1, ID_1, ID_2),
          });
          const again = await store.addRelationship({
            ...a,
            relationship: spouseOf(REL_1, ID_2, ID_3),
          });

          expect(again).toEqual(first);
          expect(await store.listRelationships(a)).toEqual([
            first.ok && first.value,
          ]);
        });
      });

      // PPL-02
      it('updates the subtype with the version read, and refuses a stale one', async () => {
        await withStore(async store => {
          const { a } = await withPersons(store);

          await store.addRelationship({
            ...a,
            relationship: parentOf(REL_1, ID_1, ID_2),
          });

          const step = relOf({
            childId: ID_2,
            id: REL_1,
            parentId: ID_1,
            subtype: 'step',
            type: 'parent',
          });
          const updated = await store.updateRelationship({
            ...a,
            relationship: step,
            version: 1,
          });

          expect(updated).toEqual({ ok: true, value: { ...step, version: 2 } });
          expect(
            await store.updateRelationship({
              ...a,
              relationship: parentOf(REL_1, ID_1, ID_2),
              version: 1,
            })
          ).toEqual({ error: 'conflict', ok: false });
          expect(
            (await store.findRelationship({ ...a, relationshipId: step.id }))
              ?.version
          ).toBe(2);
          expect(
            await store.updateRelationship({
              ...a,
              relationship: parentOf(REL_2, ID_1, ID_2),
              version: 1,
            })
          ).toEqual(NOT_FOUND);
        });
      });

      // PPL-02
      it('updates the dates, and removes one that an update leaves out', async () => {
        await withStore(async store => {
          const { a } = await withPersons(store);

          await store.addRelationship({
            ...a,
            relationship: spouseOf(REL_1, ID_1, ID_2, {
              divorce: '1885',
              marriage: '1870',
            }),
          });

          const next = spouseOf(REL_1, ID_1, ID_2, { marriage: 'ABT 1871' });
          const updated = await store.updateRelationship({
            ...a,
            relationship: next,
            version: 1,
          });

          expect(updated).toEqual({ ok: true, value: { ...next, version: 2 } });
          expect(updated.ok && updated.value).not.toHaveProperty('divorce');
        });
      });

      // PPL-02
      it('refuses an update that names other Persons or another type', async () => {
        await withStore(async store => {
          const { a } = await withPersons(store);

          await store.addRelationship({
            ...a,
            relationship: parentOf(REL_1, ID_1, ID_2),
          });

          for (const relationship of [
            parentOf(REL_1, ID_1, ID_3),
            parentOf(REL_1, ID_2, ID_1),
            spouseOf(REL_1, ID_1, ID_2),
          ]) {
            expect(
              await store.updateRelationship({ ...a, relationship, version: 1 })
            ).toEqual(NOT_FOUND);
          }

          expect(
            (
              await store.findRelationship({
                ...a,
                relationshipId: REL_1 as RelationshipId,
              })
            )?.version
          ).toBe(1);
        });
      });

      // NFR-09
      it('lists by id', async () => {
        await withStore(async store => {
          const { a } = await withPersons(store);

          for (const [id, parent, child] of [
            [REL_3, ID_1, ID_3],
            [REL_1, ID_1, ID_2],
            [REL_2, ID_2, ID_3],
          ]) {
            await store.addRelationship({
              ...a,
              relationship: parentOf(id, parent, child),
            });
          }

          expect((await store.listRelationships(a)).map(r => r.id)).toEqual([
            REL_1,
            REL_2,
            REL_3,
          ]);
        });
      });

      // NFR-03
      it('treats an id that is not a UUID as one that matches nothing', async () => {
        await withStore(async store => {
          const { a } = await withPersons(store);
          const bad = { accountId: MALFORMED_ACCOUNT, treeId: a.treeId };
          const badTree = { accountId: a.accountId, treeId: MALFORMED_TREE };
          const badId = {
            ...parentOf(REL_1, ID_1, ID_2),
            id: 'nope',
          } as RelationshipInput;
          const badPerson = {
            ...parentOf(REL_1, ID_1, ID_2),
            childId: 'nope',
          } as RelationshipInput;

          expect(await store.listRelationships(bad)).toEqual([]);
          expect(await store.listRelationships(badTree)).toEqual([]);
          expect(
            await store.findRelationship({
              ...a,
              relationshipId: 'nope' as RelationshipId,
            })
          ).toBeUndefined();

          for (const relationship of [badId, badPerson]) {
            expect(await store.addRelationship({ ...a, relationship })).toEqual(
              NOT_FOUND
            );
            expect(
              await store.updateRelationship({ ...a, relationship, version: 1 })
            ).toEqual(NOT_FOUND);
          }

          expect(
            await store.addRelationship({
              ...badTree,
              relationship: parentOf(REL_1, ID_1, ID_2),
            })
          ).toEqual(NOT_FOUND);
          expect(await store.listRelationships(a)).toEqual([]);
        });
      });

      // PPL-02
      it('keeps one Relationship for an id in either case', async () => {
        await withStore(async store => {
          const { a } = await withPersons(store);

          const upper = REL_1.toUpperCase();

          // A cast skips the schema, which makes the id lower case first.
          await store.addRelationship({
            ...a,
            relationship: {
              ...parentOf(REL_1, ID_1, ID_2),
              id: upper,
            } as RelationshipInput,
          });
          await store.addRelationship({
            ...a,
            relationship: parentOf(REL_1, ID_1, ID_3),
          });

          const listed = await store.listRelationships(a);

          expect(
            listed.map(r => [r.id, r.type === 'parent' && r.childId])
          ).toEqual([[REL_1, ID_2]]);
          expect(
            (
              await store.findRelationship({
                ...a,
                relationshipId: upper as RelationshipId,
              })
            )?.id
          ).toBe(REL_1);
        });
      });

      // NFR-09
      it.each([0, 1.5, Number.NaN, 2 ** 31, -1])(
        'gives conflict for the version %s',
        async version => {
          await withStore(async store => {
            const { a } = await withPersons(store);

            await store.addRelationship({
              ...a,
              relationship: parentOf(REL_1, ID_1, ID_2),
            });

            expect(
              await store.updateRelationship({
                ...a,
                relationship: parentOf(REL_1, ID_1, ID_2),
                version,
              })
            ).toEqual({ error: 'conflict', ok: false });
          });
        }
      );

      // NFR-09
      it('returns copies that a caller may change', async () => {
        await withStore(async store => {
          const { a } = await withPersons(store);
          const input = spouseOf(REL_1, ID_1, ID_2, { marriage: '1870' });
          const added = await store.addRelationship({
            ...a,
            relationship: input,
          });
          const found = await store.findRelationship({
            ...a,
            relationshipId: input.id,
          });
          const [listed] = await store.listRelationships(a);

          for (const copy of [added.ok && added.value, found, listed, input]) {
            if (copy && copy.type === 'spouse' && copy.marriage) {
              copy.marriage.date1 = '1900';
            }
          }

          const saved = await store.findRelationship({
            ...a,
            relationshipId: input.id,
          });

          expect(saved?.type === 'spouse' && saved.marriage?.date1).toBe(
            '1870'
          );
        });
      });
    });

    describe('places', () => {
      // PIN-02
      it('reads back a Place at -33.925839, 18.423300 with its precision', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const place = placeOf(PLACE_1, {
            latitude: -33.925_839,
            longitude: 18.4233,
            precision: 'suburb',
          });
          const expected = { ...place, version: 1 };

          expect(await store.addPlace({ ...a, place })).toEqual({
            ok: true,
            value: expected,
          });
          expect(await store.findPlace({ ...a, placeId: place.id })).toEqual(
            expected
          );
          expect(await store.listPlaces(a)).toEqual([expected]);
        });
      });

      // NFR-09
      it('gives Account B the result of a Place that does not exist', async () => {
        await withStore(async store => {
          const { a, b } = await twoTrees(store);

          await store.addPlace({ ...a, place: placeOf(PLACE_1, {}) });

          const cross = { accountId: b.accountId, treeId: a.treeId };

          expect(await store.findPlace({ ...cross, placeId: PLACE_1 })).toEqual(
            await store.findPlace({ ...a, placeId: PLACE_2 })
          );
          expect(await store.listPlaces(cross)).toEqual([]);
          expect(
            await store.addPlace({ ...cross, place: placeOf(PLACE_2, {}) })
          ).toEqual(NOT_FOUND);
          expect(
            await store.updatePlace({
              ...cross,
              place: placeOf(PLACE_1, { latitude: 1 }),
              version: 1,
            })
          ).toEqual(NOT_FOUND);
          expect(await store.listPlaces(a)).toHaveLength(1);
          expect((await store.listPlaces(a))[0].latitude).toBe(-33.9);
        });
      });

      // NFR-09
      it('keeps the same id apart in two Trees', async () => {
        await withStore(async store => {
          const { a, b } = await twoTrees(store);

          await store.addPlace({ ...a, place: placeOf(PLACE_1, {}) });
          await store.addPlace({
            ...b,
            place: placeOf(PLACE_1, { latitude: 10 }),
          });

          expect((await store.listPlaces(a))[0].latitude).toBe(-33.9);
          expect((await store.listPlaces(b))[0].latitude).toBe(10);
        });
      });

      // NFR-09
      it('ignores a repeated add with the same id', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const first = await store.addPlace({
            ...a,
            place: placeOf(PLACE_1, {}),
          });
          const again = await store.addPlace({
            ...a,
            place: placeOf(PLACE_1, { latitude: 10, precision: 'street' }),
          });

          expect(again).toEqual(first);
          expect(await store.listPlaces(a)).toEqual([first.ok && first.value]);
        });
      });

      // PIN-02
      it('updates with the version read, and refuses a stale one', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          await store.addPlace({ ...a, place: placeOf(PLACE_1, {}) });

          const next = placeOf(PLACE_1, {
            latitude: -26.2,
            longitude: 28.04,
            precision: 'town',
          });

          expect(
            await store.updatePlace({ ...a, place: next, version: 1 })
          ).toEqual({ ok: true, value: { ...next, version: 2 } });

          const stale = placeOf(PLACE_1, { latitude: 5 });

          expect(
            await store.updatePlace({ ...a, place: stale, version: 1 })
          ).toEqual({ error: 'conflict', ok: false });
          expect(await store.findPlace({ ...a, placeId: PLACE_1 })).toEqual({
            ...next,
            version: 2,
          });
          expect(
            await store.updatePlace({
              ...a,
              place: placeOf(PLACE_2, {}),
              version: 1,
            })
          ).toEqual(NOT_FOUND);
        });
      });

      // NFR-09
      it('lists by id', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          for (const id of [PLACE_3, PLACE_1, PLACE_2]) {
            await store.addPlace({ ...a, place: placeOf(id, {}) });
          }

          expect((await store.listPlaces(a)).map(p => p.id)).toEqual([
            PLACE_1,
            PLACE_2,
            PLACE_3,
          ]);
        });
      });

      // NFR-09
      it('lists no more than the cap, ordered by id', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const idOf = (n: number) =>
            `01900000-0000-7000-a000-${String(n).padStart(12, '0')}`;

          for (let n = MAX_PLACES; n >= 0; n -= 1) {
            await store.addPlace({ ...a, place: placeOf(idOf(n), {}) });
          }

          const listed = await store.listPlaces(a);

          expect(listed).toHaveLength(MAX_PLACES);
          expect(listed[0].id).toBe(idOf(0));
          expect(listed[MAX_PLACES - 1].id).toBe(idOf(MAX_PLACES - 1));
        });
      }, 120_000);

      // NFR-03
      it('treats an id that is not a UUID as one that matches nothing', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const bad = { accountId: MALFORMED_ACCOUNT, treeId: a.treeId };
          const badTree = { accountId: a.accountId, treeId: MALFORMED_TREE };
          const badId = { ...placeOf(PLACE_1, {}), id: 'nope' } as PlaceInput;

          expect(await store.listPlaces(bad)).toEqual([]);
          expect(await store.listPlaces(badTree)).toEqual([]);
          expect(
            await store.findPlace({ ...a, placeId: 'nope' as PlaceId })
          ).toBeUndefined();
          expect(await store.addPlace({ ...a, place: badId })).toEqual(
            NOT_FOUND
          );
          expect(
            await store.updatePlace({ ...a, place: badId, version: 1 })
          ).toEqual(NOT_FOUND);
          expect(
            await store.addPlace({ ...badTree, place: placeOf(PLACE_1, {}) })
          ).toEqual(NOT_FOUND);
          expect(await store.listPlaces(a)).toEqual([]);
        });
      });

      // NFR-09
      it('keeps one Place for an id in either case', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const upper = PLACE_1.toUpperCase();

          // A cast skips the schema, which makes the id lower case first.
          await store.addPlace({
            ...a,
            place: { ...placeOf(PLACE_1, {}), id: upper } as PlaceInput,
          });
          await store.addPlace({
            ...a,
            place: placeOf(PLACE_1, { latitude: 10 }),
          });

          const listed = await store.listPlaces(a);

          expect(listed.map(p => [p.id, p.latitude])).toEqual([
            [PLACE_1, -33.9],
          ]);
          expect(
            (await store.findPlace({ ...a, placeId: upper as PlaceId }))?.id
          ).toBe(PLACE_1);
        });
      });

      // NFR-09
      it.each([0, 1.5, Number.NaN, 2 ** 31, -1])(
        'gives conflict for the version %s',
        async version => {
          await withStore(async store => {
            const { a } = await twoTrees(store);

            await store.addPlace({ ...a, place: placeOf(PLACE_1, {}) });

            expect(
              await store.updatePlace({
                ...a,
                place: placeOf(PLACE_1, {}),
                version,
              })
            ).toEqual({ error: 'conflict', ok: false });
          });
        }
      );

      // NFR-09
      it('returns copies that a caller may change', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const input = placeOf(PLACE_1, {});
          const added = await store.addPlace({ ...a, place: input });
          const found = await store.findPlace({ ...a, placeId: input.id });
          const [listed] = await store.listPlaces(a);

          for (const copy of [added.ok && added.value, found, listed, input]) {
            if (copy) {
              copy.latitude = 1;
            }
          }

          expect((await store.listPlaces(a))[0].latitude).toBe(-33.9);
        });
      });
    });

    describe('pins', () => {
      /** Two Trees; Tree A holds Persons 1 to 3 and Places 1 and 2. Tree B holds Person 4 and Place 3. */
      const withRows = async (store: TreeStore) => {
        const trees = await twoTrees(store);

        for (const id of [ID_1, ID_2, ID_3]) {
          await store.addPerson({ ...trees.a, person: personOf(id, {}) });
        }

        for (const id of [PLACE_1, PLACE_2]) {
          await store.addPlace({ ...trees.a, place: placeOf(id, {}) });
        }

        await store.addPerson({ ...trees.b, person: personOf(ID_4, {}) });
        await store.addPlace({ ...trees.b, place: placeOf(PLACE_3, {}) });

        return trees;
      };

      // PIN-02, PIN-04
      it('reads back every field of a Pin dated ABT 1850', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);
          const pin = pinOf(PIN_1, {
            address: '1 Test Street',
            date: 'ABT 1850',
            eventType: 'baptism',
            notes: 'Synthetic.',
            sources: 'Synthetic register.',
          });
          const expected = { ...pin, version: 1 };

          expect(pin.date.qualifier).toBe('ABT');
          expect(await store.addPin({ ...a, pin })).toEqual({
            ok: true,
            value: expected,
          });
          expect(await store.findPin({ ...a, pinId: PIN_1 })).toEqual(expected);
        });
      });

      // PIN-06
      it('saves three Persons pinned to one Place', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);

          for (const [pinId, personId] of [
            [PIN_1, ID_1],
            [PIN_2, ID_2],
            [PIN_3, ID_3],
          ]) {
            const added = await store.addPin({
              ...a,
              pin: pinOf(pinId, { personId }),
            });

            expect(added.ok).toBe(true);
          }

          for (const pinId of [PIN_1, PIN_2, PIN_3]) {
            expect((await store.findPin({ ...a, pinId }))?.placeId).toBe(
              PLACE_1
            );
          }
        });
      });

      // PIN-01, PIN-02
      it('saves a new Place and its Pin in one step', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);
          const place = placeOf(PLACE_3, { precision: 'farm' });
          const pin = pinOf(PIN_1, { placeId: PLACE_3 });

          expect(await store.addPinAt({ ...a, pin, place })).toEqual({
            ok: true,
            value: { ...pin, version: 1 },
          });
          expect(await store.findPlace({ ...a, placeId: PLACE_3 })).toEqual({
            ...place,
            version: 1,
          });
          expect(await store.findPin({ ...a, pinId: PIN_1 })).toEqual({
            ...pin,
            version: 1,
          });
        });
      });

      // PIN-01
      it('joins the Pin to the new Place, whatever its placeId says', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);
          const saved = await store.addPinAt({
            ...a,
            pin: pinOf(PIN_1, { placeId: PLACE_1 }),
            place: placeOf(PLACE_4, {}),
          });

          expect(saved.ok && saved.value.placeId).toBe(PLACE_4);
        });
      });

      // PIN-01
      it('saves no Place when the Pin is refused', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);

          expect(
            await store.addPinAt({
              ...a,
              pin: pinOf(PIN_1, { personId: ID_4 }),
              place: placeOf(PLACE_4, {}),
            })
          ).toEqual(NOT_FOUND);
          expect(await store.findPlace({ ...a, placeId: PLACE_4 })).toBe(
            undefined
          );
          expect(await store.listPlaces(a)).toHaveLength(2);
          expect(await store.findPin({ ...a, pinId: PIN_1 })).toBeUndefined();
        });
      });

      // PIN-01
      it('keeps a Place that was saved before a refused Pin', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);

          expect(
            await store.addPinAt({
              ...a,
              pin: pinOf(PIN_1, { personId: ID_4 }),
              place: placeOf(PLACE_1, {}),
            })
          ).toEqual(NOT_FOUND);
          expect(
            (await store.findPlace({ ...a, placeId: PLACE_1 }))?.version
          ).toBe(1);
        });
      });

      // NFR-09
      it('saves nothing for another Account’s Tree or a bad Place id', async () => {
        await withStore(async store => {
          const { a, b } = await withRows(store);
          const cross = { accountId: b.accountId, treeId: a.treeId };

          expect(
            await store.addPinAt({
              ...cross,
              pin: pinOf(PIN_1),
              place: placeOf(PLACE_4, {}),
            })
          ).toEqual(NOT_FOUND);
          expect(
            await store.addPinAt({
              ...a,
              pin: pinOf(PIN_1),
              place: { ...placeOf(PLACE_4, {}), id: 'not-a-uuid' as PlaceId },
            })
          ).toEqual(NOT_FOUND);
          expect(await store.listPlaces(a)).toHaveLength(2);
          expect(await store.listPlaces(b)).toHaveLength(1);
          expect(await store.listPins(a)).toEqual([]);
        });
      });

      // PIN-01
      it('saves one Pin and one Place for a repeat of the same ids', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);
          const input = {
            ...a,
            pin: pinOf(PIN_1, { placeId: PLACE_4 }),
            place: placeOf(PLACE_4, {}),
          };
          const first = await store.addPinAt(input);
          const again = await store.addPinAt({
            ...input,
            pin: { ...input.pin, eventType: 'death' },
          });

          expect(again).toEqual(first);
          expect(await store.listPlaces(a)).toHaveLength(3);
          expect(await store.listPins(a)).toHaveLength(1);
        });
      });

      // NFR-09
      it('refuses a Pin whose Person or Place is in another Tree', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);

          for (const fields of [
            { personId: ID_4 },
            { placeId: PLACE_3 },
            { personId: '01900000-0000-7000-8000-0000000000ff' },
            { placeId: '01900000-0000-7000-a000-0000000000ff' },
          ]) {
            expect(
              await store.addPin({ ...a, pin: pinOf(PIN_1, fields) })
            ).toEqual(NOT_FOUND);
          }

          expect(await store.findPin({ ...a, pinId: PIN_1 })).toBeUndefined();
        });
      });

      // NFR-09
      it('gives Account B the result of a Pin that does not exist', async () => {
        await withStore(async store => {
          const { a, b } = await withRows(store);

          await store.addPin({ ...a, pin: pinOf(PIN_1) });

          const cross = { accountId: b.accountId, treeId: a.treeId };

          expect(await store.findPin({ ...cross, pinId: PIN_1 })).toEqual(
            await store.findPin({ ...a, pinId: PIN_2 })
          );
          expect(await store.addPin({ ...cross, pin: pinOf(PIN_2) })).toEqual(
            NOT_FOUND
          );
          expect(
            await store.updatePin({
              ...cross,
              pin: pinOf(PIN_1, { eventType: 'death' }),
              version: 1,
            })
          ).toEqual(NOT_FOUND);
          expect((await store.findPin({ ...a, pinId: PIN_1 }))?.eventType).toBe(
            'residence'
          );
          expect(await store.findPin({ ...a, pinId: PIN_2 })).toBeUndefined();
        });
      });

      // NFR-09
      it('keeps the same id apart in two Trees', async () => {
        await withStore(async store => {
          const { a, b } = await withRows(store);

          await store.addPin({ ...a, pin: pinOf(PIN_1) });
          await store.addPin({
            ...b,
            pin: pinOf(PIN_1, {
              eventType: 'death',
              personId: ID_4,
              placeId: PLACE_3,
            }),
          });

          expect((await store.findPin({ ...a, pinId: PIN_1 }))?.eventType).toBe(
            'residence'
          );
          expect((await store.findPin({ ...b, pinId: PIN_1 }))?.eventType).toBe(
            'death'
          );
        });
      });

      // NFR-09
      it('ignores a repeated add with the same id', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);
          const first = await store.addPin({ ...a, pin: pinOf(PIN_1) });
          const again = await store.addPin({
            ...a,
            pin: pinOf(PIN_1, { eventType: 'death', personId: ID_2 }),
          });

          expect(again).toEqual(first);
          expect(await store.findPin({ ...a, pinId: PIN_1 })).toEqual(
            first.ok && first.value
          );
        });
      });

      // PIN-02
      it('updates with the version read, and refuses a stale one', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);

          await store.addPin({ ...a, pin: pinOf(PIN_1) });

          const next = pinOf(PIN_1, {
            address: 'New',
            date: 'MAR 1851',
            eventType: 'burial',
            personId: ID_2,
            placeId: PLACE_2,
          });

          expect(
            await store.updatePin({ ...a, pin: next, version: 1 })
          ).toEqual({ ok: true, value: { ...next, version: 2 } });
          expect(
            await store.updatePin({
              ...a,
              pin: pinOf(PIN_1, { eventType: 'death' }),
              version: 1,
            })
          ).toEqual({ error: 'conflict', ok: false });
          expect(await store.findPin({ ...a, pinId: PIN_1 })).toEqual({
            ...next,
            version: 2,
          });
          expect(
            await store.updatePin({ ...a, pin: pinOf(PIN_2), version: 1 })
          ).toEqual(NOT_FOUND);
        });
      });

      // NFR-09
      it('refuses an update to a Person or Place of another Tree', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);

          await store.addPin({ ...a, pin: pinOf(PIN_1) });

          for (const fields of [{ personId: ID_4 }, { placeId: PLACE_3 }]) {
            expect(
              await store.updatePin({
                ...a,
                pin: pinOf(PIN_1, fields),
                version: 1,
              })
            ).toEqual(NOT_FOUND);
          }

          expect(await store.findPin({ ...a, pinId: PIN_1 })).toEqual({
            ...pinOf(PIN_1),
            version: 1,
          });
        });
      });

      // NFR-03
      it('treats an id that is not a UUID as one that matches nothing', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);
          const badTree = { accountId: a.accountId, treeId: MALFORMED_TREE };
          const badId = { ...pinOf(PIN_1), id: 'nope' } as PinInput;
          const badPerson = { ...pinOf(PIN_1), personId: 'nope' } as PinInput;
          const badPlace = { ...pinOf(PIN_1), placeId: 'nope' } as PinInput;

          expect(
            await store.findPin({ ...a, pinId: 'nope' as PinId })
          ).toBeUndefined();

          for (const pin of [badId, badPerson, badPlace]) {
            expect(await store.addPin({ ...a, pin })).toEqual(NOT_FOUND);
            expect(await store.updatePin({ ...a, pin, version: 1 })).toEqual(
              NOT_FOUND
            );
          }

          expect(await store.addPin({ ...badTree, pin: pinOf(PIN_1) })).toEqual(
            NOT_FOUND
          );
          expect(await store.findPin({ ...a, pinId: PIN_1 })).toBeUndefined();
        });
      });

      // PIN-02
      it('keeps one Pin for an id in either case', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);
          const upper = PIN_1.toUpperCase();

          // A cast skips the schema, which makes the id lower case first.
          await store.addPin({
            ...a,
            pin: { ...pinOf(PIN_1), id: upper } as PinInput,
          });
          await store.addPin({
            ...a,
            pin: pinOf(PIN_1, { eventType: 'death' }),
          });

          expect(
            (await store.findPin({ ...a, pinId: upper as PinId }))?.eventType
          ).toBe('residence');
        });
      });

      // PIN-02
      it('gives the Person and Place of a Pin in lower case', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);
          // A cast skips the schema, which makes each id lower case first.
          const upper = {
            ...pinOf(PIN_1),
            personId: ID_2.toUpperCase(),
            placeId: PLACE_2.toUpperCase(),
          } as PinInput;
          const expected = pinOf(PIN_1, { personId: ID_2, placeId: PLACE_2 });

          expect(await store.addPin({ ...a, pin: upper })).toEqual({
            ok: true,
            value: { ...expected, version: 1 },
          });
          expect(
            await store.updatePin({ ...a, pin: upper, version: 1 })
          ).toEqual({ ok: true, value: { ...expected, version: 2 } });
        });
      });

      // NFR-09
      it.each([0, 1.5, Number.NaN, 2 ** 31, -1])(
        'gives conflict for the version %s',
        async version => {
          await withStore(async store => {
            const { a } = await withRows(store);

            await store.addPin({ ...a, pin: pinOf(PIN_1) });

            expect(
              await store.updatePin({ ...a, pin: pinOf(PIN_1), version })
            ).toEqual({ error: 'conflict', ok: false });
          });
        }
      );

      // NFR-09
      it('returns copies that a caller may change', async () => {
        await withStore(async store => {
          const { a } = await withRows(store);
          const input = pinOf(PIN_1);
          const added = await store.addPin({ ...a, pin: input });
          const found = await store.findPin({ ...a, pinId: PIN_1 });

          for (const copy of [added.ok && added.value, found, input]) {
            if (copy) {
              copy.date.date1 = '1900';
            }
          }

          expect(
            (await store.findPin({ ...a, pinId: PIN_1 }))?.date.date1
          ).toBe('1850');
        });
      });

      describe('day query and list', () => {
        const pinIdOf = (n: number) =>
          `01900000-0000-7000-b000-${String(n).padStart(12, '0')}` as PinId;

        type Scope = Awaited<ReturnType<typeof withRows>>['a'];

        const idsOn = async (store: TreeStore, scope: Scope, day: string) =>
          (await store.listPinsOn({ ...scope, day: toDay(day) })).map(
            pin => pin.id
          );

        /** Saves the Pin of `date` for `personId` and gives its id. */
        const pinned = async (
          store: TreeStore,
          scope: Scope,
          n: number,
          date: string,
          personId: PersonId = ID_1
        ) => {
          await store.addPin({
            ...scope,
            pin: pinOf(pinIdOf(n), { date, personId }),
          });

          return pinIdOf(n);
        };

        // PIN-04
        it('returns a Pin on the days of its date and no other', async () => {
          await withStore(async store => {
            const { a } = await withRows(store);
            const range = await pinned(store, a, 1, 'FROM 1840 TO 1855');
            const between = await pinned(store, a, 2, 'BET 1848 AND 1852');

            expect(await idsOn(store, a, '1850-06-01')).toEqual([
              range,
              between,
            ]);
            expect(await idsOn(store, a, '1860-06-01')).toEqual([]);
            expect(await idsOn(store, a, '1852-12-31')).toEqual([
              range,
              between,
            ]);
            expect(await idsOn(store, a, '1853-01-01')).toEqual([range]);
          });
        });

        // PIN-04
        it('clips a Pin by the birth and death of its Person', async () => {
          await withStore(async store => {
            const { a } = await withRows(store);

            await store.updatePerson({
              ...a,
              person: personOf(ID_2, { birth: '1830', death: '1860' }),
              version: 1,
            });
            await store.updatePerson({
              ...a,
              person: personOf(ID_3, { birth: '1900' }),
              version: 1,
            });

            const after = await pinned(store, a, 1, 'AFT 1850', ID_2);
            const before = await pinned(store, a, 2, 'BEF 1850', ID_2);
            const open = await pinned(store, a, 3, 'AFT 1850', ID_1);
            const late = await pinned(store, a, 4, 'FROM 1840 TO 1855', ID_3);

            expect(await idsOn(store, a, '1865-01-01')).toEqual([open]);
            expect(await idsOn(store, a, '1855-01-01')).toEqual([after, open]);
            expect(await idsOn(store, a, '1820-01-01')).toEqual([]);
            expect(await idsOn(store, a, '1840-01-01')).toEqual([before]);
            expect(await idsOn(store, a, '1900-01-01')).toEqual([open]);

            for (const year of ['1840', '1850', '1855', '1900', '1910']) {
              expect(await idsOn(store, a, `${year}-01-01`)).not.toContain(
                late
              );
            }
          });
        });

        // PIN-04
        it('uses a death that is added after the Pin is saved', async () => {
          await withStore(async store => {
            const { a } = await withRows(store);
            const id = await pinned(store, a, 1, 'AFT 1850');

            expect(await idsOn(store, a, '1900-01-01')).toEqual([id]);

            await store.updatePerson({
              ...a,
              person: personOf(ID_1, { death: '1860' }),
              version: 1,
            });

            expect(await idsOn(store, a, '1900-01-01')).toEqual([]);
            expect(await idsOn(store, a, '1855-01-01')).toEqual([id]);
          });
        });

        // PIN-04
        it('returns three Pins at one Place, each with that Place', async () => {
          await withStore(async store => {
            const { a } = await withRows(store);

            for (const [n, personId] of [ID_1, ID_2, ID_3].entries()) {
              await pinned(store, a, n + 1, 'FROM 1840 TO 1855', personId);
            }

            const found = await store.listPinsOn({
              ...a,
              day: toDay('1850-01-01'),
            });

            expect(found.map(pin => pin.placeId)).toEqual([
              PLACE_1,
              PLACE_1,
              PLACE_1,
            ]);
            expect(found.map(pin => pin.personId)).toEqual([ID_1, ID_2, ID_3]);
          });
        });

        // PIN-06
        it('lists each Pin with its span', async () => {
          await withStore(async store => {
            const { a } = await withRows(store);

            await store.updatePerson({
              ...a,
              person: personOf(ID_2, { death: '1860' }),
              version: 1,
            });

            const id = await pinned(store, a, 1, 'AFT 1850', ID_2);
            const listed = await store.listPins(a);

            expect(listed.map(pin => pin.id)).toEqual([id]);
            expect(listed[0]).toMatchObject({
              date: pinOf(id, { date: 'AFT 1850' }).date,
              version: 1,
            });
            expect(isCurrentOn(listed[0].span, toDay('1855-01-01'))).toBe(true);
            expect(isCurrentOn(listed[0].span, toDay('1865-01-01'))).toBe(
              false
            );
          });
        });

        // PIN-04, PIN-06
        it('holds a day in the list span if and only if the day query returns the Pin', async () => {
          await withStore(async store => {
            const { a } = await withRows(store);

            await store.updatePerson({
              ...a,
              person: personOf(ID_2, { birth: '1830', death: '1860' }),
              version: 1,
            });
            await store.updatePerson({
              ...a,
              person: personOf(ID_3, { birth: '1900' }),
              version: 1,
            });

            let n = 0;

            for (const personId of [ID_1, ID_2, ID_3]) {
              for (const date of [
                'AFT 1850',
                'BEF 1850',
                'FROM 1840 TO 1855',
                '1850',
              ]) {
                n += 1;
                await pinned(store, a, n, date, personId);
              }
            }

            const listed = await store.listPins(a);
            const days = new Set<number>();

            for (let year = 1800; year <= 1910; year += 1) {
              days.add(toDay(`${year}-01-01`));
            }

            for (const { span } of listed) {
              days.add(span.validFrom);
              days.add(span.validFrom - 1);
              days.add(span.validTo! - 1);
              days.add(span.validTo!);
            }

            expect(listed).toHaveLength(12);

            for (const day of days) {
              const found = await store.listPinsOn({ ...a, day: asDay(day) });

              expect(found.map(pin => pin.id)).toEqual(
                listed
                  .filter(({ span }) => isCurrentOn(span, asDay(day)))
                  .map(pin => pin.id)
              );
            }
          });
        });

        // NFR-09
        it('returns no Pins for another Account’s Tree or an id that is not a UUID', async () => {
          await withStore(async store => {
            const { a, b } = await withRows(store);

            await pinned(store, a, 1, 'FROM 1840 TO 1855');

            const day = toDay('1850-01-01');
            const bad = { accountId: MALFORMED_ACCOUNT, treeId: a.treeId };
            const badTree = { accountId: a.accountId, treeId: MALFORMED_TREE };

            for (const scope of [
              { accountId: b.accountId, treeId: a.treeId },
              { accountId: MISSING_ACCOUNT, treeId: a.treeId },
              { accountId: a.accountId, treeId: MISSING_TREE },
              bad,
              badTree,
            ]) {
              expect(await store.listPins(scope)).toEqual([]);
              expect(await store.listPinsOn({ ...scope, day })).toEqual([]);
            }

            expect(await store.listPins(a)).toHaveLength(1);
            expect(await store.listPins(b)).toEqual([]);
          });
        });

        // NFR-09
        it('lists no more than the cap, ordered by id', async () => {
          await withStore(async store => {
            const { a } = await withRows(store);

            for (let n = MAX_PINS; n >= 0; n -= 1) {
              await store.addPin({
                ...a,
                pin: pinOf(pinIdOf(n), { date: '1850' }),
              });
            }

            const listed = await store.listPins(a);
            const found = await store.listPinsOn({
              ...a,
              day: toDay('1850-06-01'),
            });

            for (const rows of [listed, found]) {
              expect(rows).toHaveLength(MAX_PINS);
              expect(rows[0].id).toBe(pinIdOf(0));
              expect(rows[MAX_PINS - 1].id).toBe(pinIdOf(MAX_PINS - 1));
            }
          });
        }, 300_000);
      });
    });

    describe('openTree', () => {
      /** Opens as a signed-in Account; `at` is the clock when opening. */
      const openAs = async (
        store: TreeStore,
        accountId: AccountId,
        treeId?: string,
        at = NOW
      ) => {
        const sessions = memorySessions();
        const token = await startSession(sessions, () => NOW, {
          accountId,
          email: 'x@example.test',
        });

        return openTree({ now: () => at, sessions, store }, token, treeId);
      };

      // NFR-09, NFR-10
      it('opens the signed-in Account’s own Tree for that Viewer', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          expect(await openAs(store, a.accountId, a.treeId)).toEqual({
            ok: true,
            value: expect.objectContaining({
              tree: { id: a.treeId, name: 'Tree A' },
              viewer: { accountId: a.accountId },
            }),
          });
        });
      });

      // NFR-10
      it('opens the Account’s Tree when no id is given', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);

          expect(await openAs(store, a.accountId)).toEqual({
            ok: true,
            value: expect.objectContaining({
              tree: { id: a.treeId, name: 'Tree A' },
              viewer: { accountId: a.accountId },
            }),
          });
        });
      });

      // PPL-01, NFR-10
      it('gives each Person a living status from the death date and the deceased mark', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const opened = await openAs(store, a.accountId, a.treeId);

          if (!opened.ok) {
            throw new Error('setup failed');
          }

          const { persons } = opened.value;
          const created = await persons.create(personOf(ID_1, {}));

          await persons.create(personOf(ID_2, { death: '1900' }));
          await persons.create(personOf(ID_3, { deceased: true }));

          expect(created.ok && created.value.living).toBe(true);
          expect((await persons.get(ID_2))?.living).toBe(false);
          expect((await persons.get(ID_3))?.living).toBe(false);
          expect((await persons.list()).map(p => p.living)).toEqual([
            true,
            false,
            false,
          ]);
        });
      });

      // PPL-01
      it('updates through the group, and refuses a stale version', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const opened = await openAs(store, a.accountId, a.treeId);

          if (!opened.ok) {
            throw new Error('setup failed');
          }

          const { persons } = opened.value;

          await persons.create(personOf(ID_1, {}));

          const first = await persons.update(
            personOf(ID_1, { deceased: true }),
            1
          );

          expect(first.ok && [first.value.version, first.value.living]).toEqual(
            [2, false]
          );
          expect(
            await persons.update(personOf(ID_1, { deceased: false }), 1)
          ).toEqual({ error: 'conflict', ok: false });
        });
      });

      describe('relationships', () => {
        /** Opens Tree A with Persons 1 to 5. */
        const openWithPersons = async (store: TreeStore) => {
          const { a } = await twoTrees(store);
          const opened = await openAs(store, a.accountId, a.treeId);

          if (!opened.ok) {
            throw new Error('setup failed');
          }

          for (const id of [ID_1, ID_2, ID_3, ID_4, ID_5]) {
            await opened.value.persons.create(personOf(id, {}));
          }

          return opened.value;
        };

        // PPL-02
        it('lists, gets, and saves a Relationship', async () => {
          await withStore(async store => {
            const { relationships } = await openWithPersons(store);
            const input = parentOf(REL_1, ID_1, ID_2);
            const created = await relationships.create(input);
            const expected = { ...input, version: 1 };

            expect(created).toEqual({ ok: true, value: expected });
            expect(await relationships.get(input.id)).toEqual(expected);
            expect(await relationships.list()).toEqual([expected]);
            expect(await relationships.get(REL_2 as RelationshipId)).toBe(
              undefined
            );
          });
        });

        // PPL-02
        it('refuses a cycle and saves nothing', async () => {
          await withStore(async store => {
            const { relationships } = await openWithPersons(store);

            await relationships.create(parentOf(REL_1, ID_1, ID_2));

            const before = await relationships.list();

            expect(
              await relationships.create(parentOf(REL_2, ID_2, ID_1))
            ).toEqual({ error: 'cycle', ok: false });
            expect(await relationships.list()).toEqual(before);
          });
        });

        // PPL-02
        it('refuses a third biological parent, and saves an adoptive one', async () => {
          await withStore(async store => {
            const { relationships } = await openWithPersons(store);

            await relationships.create(parentOf(REL_1, ID_1, ID_4));
            await relationships.create(parentOf(REL_2, ID_2, ID_4));

            const before = await relationships.list();

            expect(
              await relationships.create(parentOf(REL_3, ID_3, ID_4))
            ).toEqual({ error: 'third-biological-parent', ok: false });
            expect(await relationships.list()).toEqual(before);

            const adoptive = await relationships.create(
              parentOf(REL_3, ID_3, ID_4, 'adoptive')
            );

            expect(adoptive.ok).toBe(true);
            expect(await relationships.list()).toHaveLength(3);
          });
        });

        // PPL-02
        it('refuses an update to a third biological parent', async () => {
          await withStore(async store => {
            const { relationships } = await openWithPersons(store);

            await relationships.create(parentOf(REL_1, ID_1, ID_4));
            await relationships.create(parentOf(REL_2, ID_2, ID_4));
            await relationships.create(parentOf(REL_3, ID_3, ID_4, 'adoptive'));

            const before = await relationships.list();

            expect(
              await relationships.update(parentOf(REL_3, ID_3, ID_4), 1)
            ).toEqual({ error: 'third-biological-parent', ok: false });
            expect(await relationships.list()).toEqual(before);
          });
        });

        // PPL-02
        it('refuses a Person as their own spouse', async () => {
          await withStore(async store => {
            const { relationships } = await openWithPersons(store);

            expect(
              await relationships.create(spouseOf(REL_1, ID_1, ID_1))
            ).toEqual({ error: 'self', ok: false });
            expect(await relationships.list()).toEqual([]);
          });
        });

        // PPL-02
        it('refuses spouses added again in the other order', async () => {
          await withStore(async store => {
            const { relationships } = await openWithPersons(store);

            await relationships.create(spouseOf(REL_1, ID_1, ID_2));

            const before = await relationships.list();

            expect(
              await relationships.create(spouseOf(REL_2, ID_2, ID_1))
            ).toEqual({ error: 'duplicate', ok: false });
            expect(await relationships.list()).toEqual(before);
          });
        });

        // PPL-02
        it('updates a Relationship with the version read, and refuses a stale one', async () => {
          await withStore(async store => {
            const { relationships } = await openWithPersons(store);

            await relationships.create(parentOf(REL_1, ID_1, ID_2));

            const step = parentOf(REL_1, ID_1, ID_2, 'step');
            const updated = await relationships.update(step, 1);

            expect(updated).toEqual({
              ok: true,
              value: { ...step, version: 2 },
            });
            expect(await relationships.update(step, 1)).toEqual({
              error: 'conflict',
              ok: false,
            });
            expect(
              await relationships.update(parentOf(REL_4, ID_1, ID_3), 1)
            ).toEqual(NOT_FOUND);
          });
        });

        // PPL-02
        it('lists no more than the cap, and refuses a write when the list is full', async () => {
          await withStore(async store => {
            const { a } = await twoTrees(store);
            const opened = await openAs(store, a.accountId, a.treeId);

            if (!opened.ok) {
              throw new Error('setup failed');
            }

            const { persons, relationships } = opened.value;

            for (const id of [ID_1, ID_2, ID_3]) {
              await persons.create(personOf(id, {}));
            }

            // Seeded through the store: the group would refuse a repeated spouse pair.
            const seed = (n: number) =>
              store.addRelationship({
                ...a,
                relationship: spouseOf(
                  n === 0
                    ? REL_1
                    : `01900000-0000-7000-9000-${(0x100000 + n).toString(16).padStart(12, '0')}`,
                  ID_1,
                  ID_2
                ),
              });

            for (let n = 0; n < MAX_RELATIONSHIPS; n += 1) {
              await seed(n);
            }

            const before = await relationships.list();

            expect(before).toHaveLength(MAX_RELATIONSHIPS);
            expect(
              await relationships.create(parentOf(REL_2, ID_1, ID_3))
            ).toEqual({ error: 'tree-full', ok: false });
            expect(
              await relationships.update(spouseOf(REL_1, ID_1, ID_2), 1)
            ).toEqual({ error: 'tree-full', ok: false });
            expect(await relationships.list()).toEqual(before);

            await seed(MAX_RELATIONSHIPS);

            expect(await relationships.list()).toEqual(before);
          });
        }, 120_000);

        // NFR-09
        it('gives not-found for a Person outside the Tree', async () => {
          await withStore(async store => {
            const { relationships } = await openWithPersons(store);
            const outside = '01900000-0000-7000-8000-0000000000ff';

            expect(
              await relationships.create(parentOf(REL_1, ID_1, outside))
            ).toEqual(NOT_FOUND);
            expect(await relationships.list()).toEqual([]);
          });
        });

        // NFR-09
        it('keeps a Relationship of Tree A out of Account B’s Tree', async () => {
          await withStore(async store => {
            const { a, b } = await twoTrees(store);
            const asA = await openAs(store, a.accountId, a.treeId);
            const asB = await openAs(store, b.accountId, b.treeId);

            if (!asA.ok || !asB.ok) {
              throw new Error('setup failed');
            }

            for (const id of [ID_1, ID_2]) {
              await asA.value.persons.create(personOf(id, {}));
            }

            await asA.value.relationships.create(parentOf(REL_1, ID_1, ID_2));

            expect(
              await asB.value.relationships.get(REL_1 as RelationshipId)
            ).toEqual(
              await asB.value.relationships.get(REL_2 as RelationshipId)
            );
            expect(await asB.value.relationships.list()).toEqual([]);
          });
        });
      });

      describe('places and pins', () => {
        /** Opens Tree A with Persons 1 and 2, and Tree B with Person 4 and Place 3. */
        const openBoth = async (store: TreeStore) => {
          const { a, b } = await twoTrees(store);
          const asA = await openAs(store, a.accountId, a.treeId);
          const asB = await openAs(store, b.accountId, b.treeId);

          if (!asA.ok || !asB.ok) {
            throw new Error('setup failed');
          }

          for (const id of [ID_1, ID_2]) {
            await asA.value.persons.create(personOf(id, {}));
          }

          await asB.value.persons.create(personOf(ID_4, {}));
          await asB.value.places.create(placeOf(PLACE_3, {}));

          return { a, a2: asA.value, b2: asB.value };
        };

        // PIN-06
        it('saves a Place, then a Pin that joins a Person and that Place', async () => {
          await withStore(async store => {
            const { a2 } = await openBoth(store);
            const place = placeOf(PLACE_1, {});
            const pin = pinOf(PIN_1);

            expect(await a2.places.create(place)).toEqual({
              ok: true,
              value: { ...place, version: 1 },
            });
            expect(await a2.pins.create(pin)).toEqual({
              ok: true,
              value: { ...pin, version: 1 },
            });
            expect(await a2.places.get(PLACE_1)).toEqual({
              ...place,
              version: 1,
            });
            expect(await a2.pins.get(PIN_1)).toEqual({ ...pin, version: 1 });
            expect(await a2.places.list()).toEqual([{ ...place, version: 1 }]);
            expect(await a2.places.get(PLACE_2)).toBe(undefined);
            expect(await a2.pins.get(PIN_2)).toBe(undefined);
          });
        });

        // PIN-01, PIN-04
        it('creates a Pin at a new Place through the group', async () => {
          await withStore(async store => {
            const { a2 } = await openBoth(store);
            const place = placeOf(PLACE_1, {});
            const pin = pinOf(PIN_1, { date: 'ABT 1850' });
            const saved = await a2.pins.createAt(pin, place);

            expect(saved).toEqual({ ok: true, value: { ...pin, version: 1 } });
            expect(await a2.places.get(PLACE_1)).toEqual({
              ...place,
              version: 1,
            });
            expect((await a2.pins.listOn(toDay('1850-06-01'))).length).toBe(1);
          });
        });

        // NFR-09
        it('gives not-found and saves no Place for a Person of another Tree', async () => {
          await withStore(async store => {
            const { a2 } = await openBoth(store);

            expect(
              await a2.pins.createAt(
                pinOf(PIN_1, { personId: ID_4 }),
                placeOf(PLACE_1, {})
              )
            ).toEqual(NOT_FOUND);
            expect(await a2.places.list()).toEqual([]);
          });
        });

        // PIN-02
        it('adds a Pin to an existing Place and adds no Place', async () => {
          await withStore(async store => {
            const { a2 } = await openBoth(store);

            await a2.places.create(placeOf(PLACE_1, {}));
            await a2.pins.create(pinOf(PIN_1));

            const second = await a2.pins.create(
              pinOf(PIN_2, { personId: ID_2 })
            );

            expect(second.ok && second.value.placeId).toBe(PLACE_1);
            expect(await a2.places.list()).toHaveLength(1);
            expect((await a2.pins.list()).map(pin => pin.placeId)).toEqual([
              PLACE_1,
              PLACE_1,
            ]);
          });
        });

        // PIN-06
        it('updates a Place and a Pin, and refuses a stale version', async () => {
          await withStore(async store => {
            const { a2 } = await openBoth(store);

            await a2.places.create(placeOf(PLACE_1, {}));
            await a2.pins.create(pinOf(PIN_1));

            const moved = await a2.places.update(
              placeOf(PLACE_1, { latitude: -26.2 }),
              1
            );
            const dated = await a2.pins.update(
              pinOf(PIN_1, { date: '1860' }),
              1
            );

            expect(moved.ok && moved.value.version).toBe(2);
            expect(dated.ok && dated.value.version).toBe(2);
            expect(await a2.places.update(placeOf(PLACE_1, {}), 1)).toEqual({
              error: 'conflict',
              ok: false,
            });
            expect(await a2.pins.update(pinOf(PIN_1), 1)).toEqual({
              error: 'conflict',
              ok: false,
            });
          });
        });

        // NFR-09
        it('gives not-found for a Pin whose Person or Place is in another Tree', async () => {
          await withStore(async store => {
            const { a2 } = await openBoth(store);

            await a2.places.create(placeOf(PLACE_1, {}));

            expect(
              await a2.pins.create(pinOf(PIN_1, { personId: ID_4 }))
            ).toEqual(NOT_FOUND);
            expect(
              await a2.pins.create(pinOf(PIN_1, { placeId: PLACE_3 }))
            ).toEqual(NOT_FOUND);
            expect(await a2.pins.list()).toEqual([]);
          });
        });

        // NFR-09
        it('gives not-found when the store refuses a create', async () => {
          await withStore(async store => {
            const { a2 } = await openBoth(store);

            vi.spyOn(store, 'addPlace').mockResolvedValue({
              error: 'not-found',
              ok: false,
            });

            expect(await a2.places.create(placeOf(PLACE_1, {}))).toEqual(
              NOT_FOUND
            );
          });
        });

        // PIN-04
        it('queries the Pins of a day as the store does', async () => {
          await withStore(async store => {
            const { a, a2 } = await openBoth(store);

            await a2.places.create(placeOf(PLACE_1, {}));
            await a2.pins.create(pinOf(PIN_1, { date: 'FROM 1840 TO 1855' }));
            await a2.pins.create(pinOf(PIN_2, { date: '1900' }));

            const day = toDay('1850-06-01');
            const viaGroup = await a2.pins.listOn(day);

            expect(viaGroup.map(pin => pin.id)).toEqual([PIN_1]);
            expect(viaGroup).toEqual(await store.listPinsOn({ ...a, day }));
          });
        });

        // PIN-04
        it('lists each Pin with its span', async () => {
          await withStore(async store => {
            const { a, a2 } = await openBoth(store);

            await a2.places.create(placeOf(PLACE_1, {}));
            await a2.pins.create(pinOf(PIN_1));
            await a2.pins.create(pinOf(PIN_2, { date: '1900' }));

            const listed = await a2.pins.list();

            expect(listed).toHaveLength(2);
            expect(listed.every(pin => pin.span !== undefined)).toBe(true);
            expect(listed).toEqual(await store.listPins(a));
          });
        });

        // NFR-09
        it('keeps a Place and a Pin of Tree A out of Account B’s Tree', async () => {
          await withStore(async store => {
            const { a2, b2 } = await openBoth(store);

            await a2.places.create(placeOf(PLACE_1, {}));
            await a2.pins.create(pinOf(PIN_1));

            expect(await b2.places.get(PLACE_1)).toEqual(
              await b2.places.get(PLACE_2)
            );
            expect(await b2.pins.get(PIN_1)).toEqual(await b2.pins.get(PIN_2));
            expect(await b2.places.list()).toEqual([
              { ...placeOf(PLACE_3, {}), version: 1 },
            ]);
            expect(await b2.pins.list()).toEqual([]);
            expect(await b2.pins.listOn(toDay('1850-06-01'))).toEqual([]);
          });
        });
      });

      // NFR-09
      it('gives not-found when the store refuses a create', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const opened = await openAs(store, a.accountId, a.treeId);

          if (!opened.ok) {
            throw new Error('setup failed');
          }

          vi.spyOn(store, 'addPerson').mockResolvedValue(undefined);

          expect(await opened.value.persons.create(personOf(ID_1, {}))).toEqual(
            { error: 'not-found', ok: false }
          );
        });
      });

      // NFR-09
      it('keeps a Person of Tree A out of Account B’s Tree', async () => {
        await withStore(async store => {
          const { a, b } = await twoTrees(store);
          const asA = await openAs(store, a.accountId, a.treeId);
          const asB = await openAs(store, b.accountId, b.treeId);

          if (!asA.ok || !asB.ok) {
            throw new Error('setup failed');
          }

          await asA.value.persons.create(personOf(ID_1, {}));

          expect(await asB.value.persons.get(ID_1)).toEqual(
            await asB.value.persons.get(ID_2)
          );
          expect(await asB.value.persons.list()).toEqual([]);
        });
      });

      // NFR-09, NFR-10
      it('opens a seed Tree with its People and Relationship', async () => {
        const seeded: SeedAccount = {
          id: parseAccountId('00000000-0000-4000-8000-0000000000a2')!,
          issuer: 'test',
          subject: 'seeded',
          trees: [
            {
              id: parseTreeId('00000000-0000-4000-8000-0000000000b2')!,
              name: 'Seeded',
              persons: [
                personOf(ID_1, { givenNames: 'Ana', surname: 'Test' }),
                personOf(ID_2, { givenNames: 'Ben', surname: 'Test' }),
              ],
              relationships: [parentOf(REL_1, ID_1, ID_2)],
            },
          ],
        };

        await withStore(
          async store => {
            const opened = await openAs(store, seeded.id, seeded.trees[0].id);

            if (!opened.ok) {
              throw new Error('setup failed');
            }

            expect((await opened.value.persons.list()).map(p => p.id)).toEqual([
              ID_1,
              ID_2,
            ]);
            expect((await opened.value.persons.get(ID_1))?.version).toBe(1);
            expect(await opened.value.relationships.list()).toEqual([
              { ...parentOf(REL_1, ID_1, ID_2), version: 1 },
            ]);
          },
          [seeded]
        );
      });

      // NFR-10
      it('finds nothing for an Account with no Tree', async () => {
        await withStore(
          async store => {
            expect(await openAs(store, NO_TREE.id)).toEqual(NOT_FOUND);
          },
          [NO_TREE]
        );
      });

      // NFR-09
      it('gives Account B the result of a Tree that does not exist', async () => {
        await withStore(async store => {
          const { a, b } = await twoTrees(store);
          const cross = await openAs(store, b.accountId, a.treeId);

          expect(cross).toEqual(NOT_FOUND);
          expect(cross).toEqual(await openAs(store, b.accountId, MISSING_TREE));
        });
      });

      // NFR-03
      it.each([
        ['no token', undefined],
        ['a forged token', 'x'.repeat(43)],
        ['a malformed token', 'nope'],
      ])(
        'returns nothing for %s, without asking the store',
        async (_what, token) => {
          await withStore(async store => {
            const { a } = await twoTrees(store);
            const findTree = vi.spyOn(store, 'findTree');
            const findTrees = vi.spyOn(store, 'findTrees');
            const deps = { now: () => NOW, sessions: memorySessions(), store };

            expect(await openTree(deps, token, a.treeId)).toEqual(NOT_FOUND);
            expect(await openTree(deps, token)).toEqual(NOT_FOUND);
            expect(findTree).not.toHaveBeenCalled();
            expect(findTrees).not.toHaveBeenCalled();
          });
        }
      );

      // NFR-03
      it('returns nothing for an expired token, without asking the store', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const findTree = vi.spyOn(store, 'findTree');
          const later = new Date(NOW.getTime() + 31 * 86_400_000);

          expect(await openAs(store, a.accountId, a.treeId, later)).toEqual(
            NOT_FOUND
          );
          expect(findTree).not.toHaveBeenCalled();
        });
      });

      // NFR-03
      it('returns nothing when the session store is down', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const sessions = memorySessions();

          sessions.find = async () => {
            throw new Error('down');
          };

          expect(
            await openTree(
              { now: () => NOW, sessions, store },
              'x'.repeat(43),
              a.treeId
            )
          ).toEqual(NOT_FOUND);
        });
      });

      // NFR-03
      it('treats a malformed id as not found, without asking the store', async () => {
        await withStore(async store => {
          const { a } = await twoTrees(store);
          const findTree = vi.spyOn(store, 'findTree');

          expect(await openAs(store, a.accountId, 'not-a-uuid')).toEqual(
            NOT_FOUND
          );
          expect(findTree).not.toHaveBeenCalled();
        });
      });
    });
  });
};
