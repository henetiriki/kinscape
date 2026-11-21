import { afterAll, describe, expect, it } from 'vitest';

import { parseAccountId, parseTreeId } from '@ks/lib/domain/ids/ids.mts';
import { pinInputSchema } from '@ks/lib/domain/pins/schemas.mts';
import { placeInputSchema } from '@ks/lib/domain/places/schemas.mts';
import { contractDb } from '@ks/server/db/__tests__/postgres.ts';
import { runTreeStoreContract } from '@ks/server/trees/__tests__/contract.ts';
import { databaseStore } from '@ks/server/trees/database-store.mts';

const shared = contractDb();

afterAll(() => shared.close());

// PIN-01: only a refused Pin gives `not-found`. Any other error reaches the caller.
describe('addPinAt on a closed database', () => {
  it('throws the database error', async () => {
    const db = await shared.fresh();
    const id = '01900000-0000-7000-a000-0000000000c1';

    await db.destroy();

    await expect(
      databaseStore(db).addPinAt({
        accountId: parseAccountId('01900000-0000-7000-8000-0000000000a1')!,
        pin: pinInputSchema.parse({
          date: '1850',
          eventType: 'residence',
          id: '01900000-0000-7000-b000-0000000000d1',
          personId: '01900000-0000-7000-8000-0000000000a1',
          placeId: id,
        }),
        place: placeInputSchema.parse({ id, latitude: 1, longitude: 2 }),
        treeId: parseTreeId('01900000-0000-7000-9000-0000000000e1')!,
      })
    ).rejects.toThrow();
  });
});

runTreeStoreContract('database', async seed => {
  const db = await shared.fresh();

  for (const { id, issuer, subject, trees } of seed) {
    await db.insertInto('account').values({ id, issuer, subject }).execute();

    for (const tree of trees) {
      await db
        .insertInto('tree')
        .values({ id: tree.id, name: tree.name })
        .execute();
      await db
        .insertInto('treeAccount')
        .values({ accountId: id, treeId: tree.id })
        .execute();
    }
  }

  const store = databaseStore(db);

  for (const { id: accountId, trees } of seed) {
    for (const { id: treeId, persons = [], relationships = [] } of trees) {
      for (const person of persons) {
        await store.addPerson({ accountId, person, treeId });
      }

      for (const relationship of relationships) {
        await store.addRelationship({ accountId, relationship, treeId });
      }
    }
  }

  return { close: () => db.destroy(), store };
});
