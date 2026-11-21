import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));

import { PERSON, seedTrees } from '@ks/app/__tests__/pin-trees';
import { GET } from '@ks/app/data/people/route';
import { personSummary } from '@ks/lib/domain/persons/dates.mts';
import { openTree } from '@ks/server/trees/repository.mts';

// PIN-01, NFR-03, NFR-10. Data is synthetic.

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

describe('GET /data/people', () => {
  // NFR-03
  it('answers 401 with no body when there is no session', async () => {
    await setup();

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('');
  });

  // PIN-01
  it('sends each Person as a summary with no notes', async () => {
    const { sessions, signInAs, store, tokens } = await setup();
    const opened = await openTree({ sessions, store }, tokens.a);

    if (!opened.ok) {
      throw new Error('open failed');
    }

    await opened.value.persons.create({
      givenNames: 'Bo',
      id: '01900000-0000-7000-8000-0000000000a2',
      notes: 'A secret family note',
      surname: 'Smit a',
    } as never);
    signInAs('a');

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>[];
    const listed = await opened.value.persons.list();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body).toEqual(
      JSON.parse(JSON.stringify(listed.map(personSummary))) as unknown[]
    );
    expect(JSON.stringify(body)).not.toContain('notes');
    expect(JSON.stringify(body)).not.toMatch(/secret family note/);
    expect(body.map(person => person.id)).toContain(PERSON);
  });

  // PIN-01
  it('answers an empty list for a Tree with no Person', async () => {
    const { signInAs, store } = await setup();

    signInAs('a');
    adapters.current = {
      ...(adapters.current as object),
      store: { ...store, listPersons: async () => [] },
    };

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  // NFR-10
  it('sends each Account only the Persons of its own Tree', async () => {
    const { signInAs } = await setup();

    signInAs('a');

    const forA = JSON.stringify(await (await GET()).json());

    signInAs('b');

    const forB = JSON.stringify(await (await GET()).json());

    expect(forA).toContain('Smit a');
    expect(forA).not.toContain('Smit b');
    expect(forB).toContain('Smit b');
    expect(forB).not.toContain('Smit a');
  });

  // NFR-03
  it('sets Cache-Control to private, no-store', async () => {
    const { signInAs } = await setup();

    signInAs('a');

    expect((await GET()).headers.get('Cache-Control')).toBe(
      'private, no-store'
    );
  });

  // NFR-03
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
        listPersons: async () => {
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
        listPersons: async () => {
          throw 'Ana Smit, born 1820';
        },
      },
    };

    expect((await GET()).status).toBe(500);
    expect(error).toHaveBeenCalledWith('People route failed:', 'unknown');
  });
});
