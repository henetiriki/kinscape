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
  PERSON,
  PIN,
  setupRoute,
} from '@ks/app/__tests__/pin-trees';
import { GET } from '@ks/app/data/pins/[id]/edit/route';

// PIN-02, NFR-03, NFR-10. Data is synthetic.
const ask = (id: string) =>
  GET(new Request('http://x'), { params: Promise.resolve({ id }) });

const setup = () => setupRoute(adapters, jar);

const without = (store: object, override: object) => {
  adapters.current = {
    ...(adapters.current as object),
    store: { ...store, ...override },
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  jar.get.mockReturnValue(undefined);
});

describe('GET /data/pins/{id}/edit', () => {
  // NFR-03
  it('answers 401 with no body when there is no session', async () => {
    await setup();

    const response = await ask(PIN);

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('');
  });

  // PIN-02, NFR-10
  it('sends the fields of the form and no Pin id or Place id', async () => {
    const { signInAs } = await setup();

    signInAs('a');

    const response = await ask(PIN);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      address: '1 Church Street',
      date: '1850',
      eventType: 'baptism',
      latitude: -33.9,
      longitude: 18.4,
      notes: 'A private note',
      personId: PERSON,
      precision: 'town',
      sources: 'A parish register',
      version: 1,
    });
    expect(JSON.stringify(body)).not.toContain(PIN);
    expect(JSON.stringify(body)).not.toContain('a000-0000000000c1');
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

  // PIN-02
  it('answers 404 with no body when the Place of the Pin is missing', async () => {
    const { signInAs, store } = await setup();

    signInAs('a');
    without(store, { findPlace: async () => undefined });

    const response = await ask(PIN);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
  });

  // NFR-03
  it('answers 500 with no body and logs the error name only when a read throws', async () => {
    const { signInAs, store } = await setup();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    signInAs('a');
    without(store, {
      findPin: async () => {
        throw new TypeError('Ana Smit, born 1820');
      },
    });

    const response = await ask(PIN);

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('');
    expect(JSON.stringify(error.mock.calls)).not.toMatch(/Ana|Smit|1820/);
    expect(JSON.stringify(error.mock.calls)).toContain('TypeError');
  });
});
