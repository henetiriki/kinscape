import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));

import {
  OTHER_PIN,
  PERSON,
  PIN,
  PLACE,
  seedTrees,
} from '@ks/app/__tests__/pin-trees';
import { GET } from '@ks/app/data/pins/route';
import { pinInputSchema } from '@ks/lib/domain/pins/schemas.mts';
import { openTree } from '@ks/server/trees/repository.mts';

// PIN-02, NFR-01, NFR-03, NFR-10. Data is synthetic.

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
  const { sessions, store, tokens } = await seedTrees();

  adapters.current = { sessions, store };

  return {
    sessions,
    signInAs: (subject: 'a' | 'b') =>
      jar.get.mockReturnValue({ value: tokens[subject] }),
    store,
    tokens,
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
  it('sends each Pin with only its id, position, span, event type and dates', async () => {
    const { signInAs } = await setup();

    signInAs('a');

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>[];

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(Object.keys(body[0]).sort()).toEqual(MAP_PIN_KEYS);
    expect(body[0]).toMatchObject({
      date1: '1850',
      eventType: 'baptism',
      id: PIN,
      latitude: -33.9,
      longitude: 18.4,
    });
    expect(JSON.stringify(body)).not.toMatch(
      /Church Street|private note|parish register|Ana|Smit|01900000-0000-7000-a000/
    );
  });

  // PIN-02
  it('adds date2 for a Pin with two dates', async () => {
    const { sessions, signInAs, store, tokens } = await setup();
    const opened = await openTree({ sessions, store }, tokens.a);

    if (!opened.ok) {
      throw new Error('open failed');
    }

    await opened.value.pins.create(
      pinInputSchema.parse({
        date: 'BET 1890 AND 1905',
        eventType: 'residence',
        id: '01900000-0000-7000-b000-0000000000d3',
        personId: PERSON,
        placeId: PLACE,
      })
    );
    signInAs('a');

    const body = (await (await GET()).json()) as Record<string, unknown>[];
    const range = body.find(pin => pin.date2 !== undefined);

    expect(Object.keys(range ?? {}).sort()).toEqual(
      [...MAP_PIN_KEYS, 'date2'].sort()
    );
    expect(range).toMatchObject({
      date1: '1890',
      date2: '1905',
      qualifier: 'BET',
    });
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
