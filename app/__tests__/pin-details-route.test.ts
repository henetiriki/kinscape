import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));

import { GET } from '@ks/app/data/pins/[id]/route';
import { pinInputSchema } from '@ks/lib/domain/pins/schemas.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';
import { openTree } from '@ks/server/trees/repository.mts';

// PIN-02, NFR-03, NFR-10. Data is synthetic.
const PERSON = '01900000-0000-7000-8000-0000000000a1';
const PLACE = '01900000-0000-7000-a000-0000000000c1';
const PIN = '01900000-0000-7000-b000-0000000000d1';
const OTHER_PIN = '01900000-0000-7000-b000-0000000000d2';
const NO_PIN = '01900000-0000-7000-b000-0000000000d9';

const ask = (id: string) =>
  GET(new Request('http://x'), { params: Promise.resolve({ id }) });

const setup = async () => {
  const store = memoryStore();
  const sessions = memorySessions();
  const tokens: Record<string, string> = {};

  adapters.current = { sessions, store };

  for (const [subject, pin] of [
    ['a', PIN],
    ['b', OTHER_PIN],
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
      latitude: -33.9,
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

describe('GET /data/pins/{id}', () => {
  // NFR-03
  it('answers 401 with no body when there is no session', async () => {
    await setup();

    const response = await ask(PIN);

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('');
  });

  // PIN-02, NFR-10
  it('sends only the names, the event type and the address', async () => {
    const { signInAs } = await setup();

    signInAs('a');

    const response = await ask(PIN);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(Object.keys(body).sort()).toEqual([
      'address',
      'eventType',
      'givenNames',
      'surname',
    ]);
    expect(body).toEqual({
      address: '1 Church Street',
      eventType: 'baptism',
      givenNames: 'Ana',
      surname: 'Smit a',
    });
    expect(JSON.stringify(body)).not.toMatch(
      /private note|parish register|1850|01900000/
    );
  });

  // NFR-10
  it('answers the same 404 with no body for no UUID, no Pin and a Pin of another Tree', async () => {
    const { signInAs } = await setup();

    signInAs('a');

    for (const id of ['not-a-uuid', NO_PIN, OTHER_PIN]) {
      const response = await ask(id);

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('');
    }
  });

  // NFR-03
  it('sets Cache-Control to private, no-store', async () => {
    const { signInAs } = await setup();

    signInAs('a');

    expect((await ask(PIN)).headers.get('Cache-Control')).toBe(
      'private, no-store'
    );
  });

  // #538 plan D3
  it('answers 401 with no body when the session has no Tree', async () => {
    const { signInAs, store } = await setup();

    signInAs('a');
    adapters.current = {
      ...(adapters.current as object),
      store: { ...store, findTrees: async () => [] },
    };

    const response = await ask(PIN);

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('');
  });

  // Risks
  it('answers 404 with no body when the Person of the Pin is missing', async () => {
    const { signInAs, store } = await setup();

    signInAs('a');
    adapters.current = {
      ...(adapters.current as object),
      store: { ...store, findPerson: async () => undefined },
    };

    const response = await ask(PIN);

    expect(response.status).toBe(404);
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
        findPin: async () => {
          throw new TypeError('Ana Smit, born 1820');
        },
      },
    };

    const response = await ask(PIN);

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('');
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
        findPin: async () => {
          throw 'Ana Smit, born 1820';
        },
      },
    };

    expect((await ask(PIN)).status).toBe(500);
    expect(error).toHaveBeenCalledWith('Pin details route failed:', 'unknown');
  });
});
