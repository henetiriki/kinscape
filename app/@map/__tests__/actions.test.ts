import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));

import type { PlaceId } from '@ks/lib/domain/ids/types.ts';

import { createPinAction } from '@ks/app/@map/actions';
import { toDay } from '@ks/lib/domain/boundaries/model.mts';
import { personInputSchema } from '@ks/lib/domain/persons/schemas.mts';
import { placeInputSchema } from '@ks/lib/domain/places/schemas.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';
import { openTree } from '@ks/server/trees/repository.mts';

const PIN = '01900000-0000-7000-b000-0000000000d1';
const PIN_2 = '01900000-0000-7000-b000-0000000000d2';
const PERSON = '01900000-0000-7000-8000-0000000000a1';
const OTHER_PERSON = '01900000-0000-7000-8000-0000000000a2';
const PLACE = '01900000-0000-7000-a000-0000000000c1';
const PLACE_B = '01900000-0000-7000-a000-0000000000c2';
const NEW_PLACE = '01900000-0000-7000-a000-0000000000c3';
const point = {
  id: NEW_PLACE,
  kind: 'new',
  latitude: -33.93,
  longitude: 18.42,
};
const valid = {
  date: 'ABT 1850',
  eventType: 'residence',
  id: PIN,
  personId: PERSON,
  place: point,
};

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

  const tree = async (subject: 'a' | 'b') => {
    const opened = await openTree({ sessions, store }, tokens[subject]);

    if (!opened.ok) {
      throw new Error('open failed');
    }

    return opened.value;
  };
  const a = await tree('a');
  const b = await tree('b');

  for (const id of [PERSON, OTHER_PERSON]) {
    await a.persons.create(
      personInputSchema.parse({ givenNames: 'Ana', id, surname: 'Smit' })
    );
  }

  await b.persons.create(
    personInputSchema.parse({
      givenNames: 'Bea',
      id: '01900000-0000-7000-8000-0000000000b1',
      surname: 'Botha',
    })
  );
  await a.places.create(
    placeInputSchema.parse({ id: PLACE, latitude: -26.2, longitude: 28 })
  );
  await b.places.create(
    placeInputSchema.parse({ id: PLACE_B, latitude: -25.7, longitude: 28.2 })
  );

  return { a, b, signedOut: () => jar.get.mockReturnValue(undefined) };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// PIN-01, PIN-02, PIN-04, NFR-10
describe('createPinAction', () => {
  it('saves a Place at the point and a Pin at that Place', async () => {
    const { a } = await setup();
    const saved = await createPinAction(valid);

    expect(saved.ok && saved.value).toMatchObject({
      eventType: 'residence',
      id: PIN,
      personId: PERSON,
      placeId: NEW_PLACE,
      version: 1,
    });
    expect(await a.places.get(NEW_PLACE as PlaceId)).toMatchObject({
      latitude: -33.93,
      longitude: 18.42,
      precision: 'approximate',
    });
  });

  it('reads "ABT 1850" back as a Fuzzy date', async () => {
    const { a } = await setup();

    await createPinAction(valid);

    expect((await a.pins.list())[0].date).toMatchObject({
      date1: '1850',
      qualifier: 'ABT',
    });
  });

  it('adds a Pin to an existing Place and adds no Place', async () => {
    const { a } = await setup();

    await createPinAction({
      ...valid,
      place: { id: PLACE, kind: 'existing' },
    });
    await createPinAction({
      ...valid,
      id: PIN_2,
      personId: OTHER_PERSON,
      place: { id: PLACE, kind: 'existing' },
    });

    expect((await a.pins.list()).map(pin => pin.placeId)).toEqual([
      PLACE,
      PLACE,
    ]);
    expect(await a.places.list()).toHaveLength(1);
  });

  it.each([
    [
      'a latitude of 91',
      { ...point, latitude: 91 },
      { latitude: 'out-of-range' },
    ],
    [
      'a longitude of 181',
      { ...point, longitude: 181 },
      { longitude: 'out-of-range' },
    ],
    [
      'a longitude that is not a number',
      { ...point, longitude: 'east' },
      { longitude: 'not-a-number' },
    ],
    [
      'an unknown precision',
      { ...point, precision: 'planet' },
      { precision: 'unknown' },
    ],
  ])(
    'gives the field error for %s and saves nothing',
    async (_what, place, fields) => {
      const { a } = await setup();

      expect(await createPinAction({ ...valid, place })).toEqual({
        error: { fields },
        ok: false,
      });
      expect(await a.pins.list()).toEqual([]);
      expect(await a.places.list()).toHaveLength(1);
    }
  );

  it.each([
    ['a date that does not read', { date: 'SOMETIME' }, { date: 'syntax' }],
    [
      'an unknown event type',
      { eventType: 'wedding' },
      { eventType: 'unknown' },
    ],
    [
      'no Person, event type, date or Place',
      {
        date: '',
        eventType: undefined,
        personId: undefined,
        place: undefined,
      },
      {
        date: 'required',
        eventType: 'required',
        personId: 'required',
        place: 'required',
      },
    ],
    [
      'an address of 501',
      { address: 'x'.repeat(501) },
      { address: 'too-long' },
    ],
    [
      'sources of 10,001',
      { sources: 'x'.repeat(10_001) },
      { sources: 'too-long' },
    ],
    ['notes of 10,001', { notes: 'x'.repeat(10_001) }, { notes: 'too-long' }],
  ])(
    'gives the field error for %s and saves nothing',
    async (_what, over, fields) => {
      const { a } = await setup();

      expect(await createPinAction({ ...valid, ...over })).toEqual({
        error: { fields },
        ok: false,
      });
      expect(await a.pins.list()).toEqual([]);
      expect(await a.places.get(NEW_PLACE as PlaceId)).toBeUndefined();
    }
  );

  it('gives invalid for input the form stops, and saves nothing', async () => {
    const { a } = await setup();

    expect(await createPinAction({ ...valid, id: 'nope' })).toEqual({
      error: 'invalid',
      ok: false,
    });
    expect(await createPinAction({ ...valid, treeId: PIN })).toEqual({
      error: 'invalid',
      ok: false,
    });
    expect(await a.pins.list()).toEqual([]);
  });

  // NFR-10
  it.each([
    ['a Person', { personId: '01900000-0000-7000-8000-0000000000b1' }],
    ['an existing Place', { place: { id: PLACE_B, kind: 'existing' } }],
  ])(
    'gives not-found for %s of another Tree and saves nothing',
    async (_what, over) => {
      const { a, b } = await setup();

      expect(await createPinAction({ ...valid, ...over })).toEqual({
        error: 'not-found',
        ok: false,
      });
      expect(await a.pins.list()).toEqual([]);
      expect(await b.pins.list()).toEqual([]);
      expect(await a.places.get(NEW_PLACE as PlaceId)).toBeUndefined();
    }
  );

  it('saves no Place when the Pin of a new point fails', async () => {
    const { a } = await setup();

    await createPinAction({
      ...valid,
      personId: '01900000-0000-7000-8000-0000000000b1',
    });

    expect(await a.places.list()).toHaveLength(1);
  });

  it('saves one Pin and one Place for the same ids twice', async () => {
    const { a } = await setup();
    const first = await createPinAction(valid);
    const again = await createPinAction(valid);

    expect(again).toEqual(first);
    expect(await a.pins.list()).toHaveLength(1);
    expect(await a.places.list()).toHaveLength(2);
  });

  it('gives not-found and saves nothing when signed out', async () => {
    const { a, signedOut } = await setup();

    signedOut();

    expect(await createPinAction(valid)).toEqual({
      error: 'not-found',
      ok: false,
    });
    expect(await a.pins.list()).toEqual([]);
  });

  it('returns a Pin that the day query finds inside its date', async () => {
    const { a } = await setup();

    await createPinAction({ ...valid, date: 'FROM 1840 TO 1855' });

    expect(await a.pins.listOn(toDay('1850-06-01'))).toHaveLength(1);
    expect(await a.pins.listOn(toDay('1860-06-01'))).toHaveLength(0);
  });
});
