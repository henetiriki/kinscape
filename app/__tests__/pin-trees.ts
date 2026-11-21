import { pinInputSchema } from '@ks/lib/domain/pins/schemas.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';
import { openTree } from '@ks/server/trees/repository.mts';

export const PERSON = '01900000-0000-7000-8000-0000000000a1';
export const PLACE = '01900000-0000-7000-a000-0000000000c1';
export const PIN = '01900000-0000-7000-b000-0000000000d1';
export const OTHER_PIN = '01900000-0000-7000-b000-0000000000d2';

/**
 * Two Accounts, `a` and `b`, each with a Tree that holds one Person, one Place and one Pin. The Place
 * of `a` is at `latitudeA` and the Place of `b` at `latitudeB`. All data is synthetic.
 */
export const seedTrees = async (latitudeA = -33.9, latitudeB = -26.2) => {
  const store = memoryStore();
  const sessions = memorySessions();
  const tokens: Record<string, string> = {};

  for (const [subject, latitude, pin] of [
    ['a', latitudeA, PIN],
    ['b', latitudeB, OTHER_PIN],
  ] as const) {
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

    const opened = await openTree({ sessions, store }, tokens[subject]);

    if (!opened.ok) {
      throw new Error('open failed');
    }

    await opened.value.persons.create({
      givenNames: 'Ana',
      id: PERSON,
      surname: `Smit ${subject}`,
    } as never);
    await opened.value.places.create({
      id: PLACE,
      latitude,
      longitude: 18.4,
      precision: 'town',
    } as never);
    await opened.value.pins.create(
      pinInputSchema.parse({
        address: '1 Church Street',
        date: '1850',
        eventType: 'baptism',
        id: pin,
        notes: 'A private note',
        personId: PERSON,
        placeId: PLACE,
        sources: 'A parish register',
      })
    );
  }

  return { sessions, store, tokens };
};
