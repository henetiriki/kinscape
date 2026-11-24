import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));

import {
  NO_PIN,
  OTHER_PIN,
  PIN,
  setupRoute,
} from '@ks/app/__tests__/pin-trees';
import { GET } from '@ks/app/data/pins/[id]/route';

// PIN-02, NFR-03, NFR-10. Data is synthetic.
const ask = (id: string) =>
  GET(new Request('http://x'), { params: Promise.resolve({ id }) });

const setup = () => setupRoute(adapters, jar);

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
  it('sends only the names, the event type, the address and the precision', async () => {
    const { signInAs } = await setup();

    signInAs('a');

    const response = await ask(PIN);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(Object.keys(body).sort()).toEqual([
      'address',
      'eventType',
      'givenNames',
      'precision',
      'surname',
    ]);
    expect(body).toEqual({
      address: '1 Church Street',
      eventType: 'baptism',
      givenNames: 'Ana',
      precision: 'town',
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

  // Risks
  it('answers 404 with no body when the Place of the Pin is missing', async () => {
    const { signInAs, store } = await setup();

    signInAs('a');
    adapters.current = {
      ...(adapters.current as object),
      store: { ...store, findPlace: async () => undefined },
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
