import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));

import { GET } from '@ks/app/data/pins/route';
import { pinInputSchema } from '@ks/lib/domain/pins/schemas.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';
import { openTree } from '@ks/server/trees/repository.mts';

// PIN-02, NFR-01, NFR-03, NFR-10. Data is synthetic.
const PERSON = '01900000-0000-7000-8000-0000000000a1';
const PLACE = '01900000-0000-7000-a000-0000000000c1';
const PIN = '01900000-0000-7000-b000-0000000000d1';
const OTHER_PIN = '01900000-0000-7000-b000-0000000000d2';

const MAP_PIN_KEYS = [
  'date1',
  'eventType',
  'id',
  'latitude',
  'longitude',
  'qualifier',
  'span',
];

const setup = async () => {
  const store = memoryStore();
  const sessions = memorySessions();
  const tokens: Record<string, string> = {};

  adapters.current = { sessions, store };

  for (const [subject, latitude, pin] of [
    ['a', -33.9, PIN],
    ['b', -26.2, OTHER_PIN],
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

  return {
    signInAs: (subject: 'a' | 'b') =>
      jar.get.mockReturnValue({ value: tokens[subject] }),
    store,
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  jar.get.mockReturnValue(undefined);
});

describe('GET /data/pins', () => {
  // NFR-03
  it('answers 401 with no body when there is no session', async () => {
    await setup();

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('');
  });

  // NFR-01, NFR-03
  it('sends each Pin with only its id, position, span and event type', async () => {
    const { signInAs } = await setup();

    signInAs('a');

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>[];

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(Object.keys(body[0]).sort()).toEqual(MAP_PIN_KEYS);
    expect(body[0]).toMatchObject({
      eventType: 'baptism',
      id: PIN,
      latitude: -33.9,
      longitude: 18.4,
    });
    expect(JSON.stringify(body)).not.toMatch(
      /Church Street|private note|parish register|Ana|Smit|01900000-0000-7000-a000/
    );
  });

  // NFR-10
  it('sends each Account only the Pins of its own Tree', async () => {
    const { signInAs } = await setup();

    signInAs('a');

    const forA = (await (await GET()).json()) as { id: string }[];

    signInAs('b');

    const forB = (await (await GET()).json()) as { id: string }[];

    expect(forA.map(pin => pin.id)).toEqual([PIN]);
    expect(forB.map(pin => pin.id)).toEqual([OTHER_PIN]);
  });

  // NFR-03
  it('sets Cache-Control to private, no-store', async () => {
    const { signInAs } = await setup();

    signInAs('a');

    expect((await GET()).headers.get('Cache-Control')).toBe(
      'private, no-store'
    );
  });

  // D3
  it('answers 401 with no body when the session has no Tree', async () => {
    const { signInAs, store } = await setup();

    signInAs('a');
    adapters.current = {
      ...(adapters.current as object),
      store: { ...store, findTrees: async () => [] },
    };

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('');
  });

  // NFR-03
  it('answers 500 with no body and logs the error name only when a read throws', async () => {
    const { signInAs, store } = await setup();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    signInAs('a');
    adapters.current = {
      ...(adapters.current as object),
      store: {
        ...store,
        listPins: async () => {
          throw new TypeError('Ana Smit, born 1820');
        },
      },
    };

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('');
    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(error.mock.calls)).not.toMatch(/Ana|Smit|1820/);
    expect(JSON.stringify(error.mock.calls)).toContain('TypeError');
  });

  // NFR-03
  it('logs "unknown" when a read throws a value that is not an Error', async () => {
    const { signInAs, store } = await setup();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    signInAs('a');
    adapters.current = {
      ...(adapters.current as object),
      store: {
        ...store,
        listPlaces: async () => {
          throw 'Ana Smit, born 1820';
        },
      },
    };

    expect((await GET()).status).toBe(500);
    expect(error).toHaveBeenCalledWith('Pins route failed:', 'unknown');
  });
});
