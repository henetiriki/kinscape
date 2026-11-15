import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));
const session = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({ cookies: async () => jar }));
// Next's own errors continue; here that is the redirect.
vi.mock('next/navigation', () => ({
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message.startsWith('redirect:')) {
      throw error;
    }
  },
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));
vi.mock('@ks/server/auth/current.mts', () => ({
  requireSession: session,
  signOut: vi.fn(),
}));

import Relationships, {
  metadata,
} from '@ks/app/people/[id]/relationships/page';
import { personInputSchema } from '@ks/lib/domain/persons/schemas.mts';
import { relationshipInputSchema } from '@ks/lib/domain/relationships/schemas.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

const uuid = (kind: number, n: number) =>
  `01900000-0000-7000-${kind}000-${String(n).padStart(12, '0')}`;

const ME = uuid(8, 1);
const MISSING = uuid(8, 99);
const OTHERS = uuid(8, 50);

const PEOPLE: [number, string, string, object?][] = [
  [1, 'du Toit', 'Maria', { birth: 'ABT 1856', death: '1930' }],
  [2, 'Rossouw', 'Jacobus'],
  [3, 'Nel', 'Johanna'],
  [4, 'Botha', 'Hendrik'],
  [5, 'Botha', 'Anna'],
  [6, 'van Wyk', 'Gerrit'],
];

type Seed = { store: ReturnType<typeof memoryStore>; token: string };

/**
 * Two Accounts. The first one holds Maria with her Relationships; the second one holds one Person who
 * must never show. The cookie is the first Account's.
 */
const setup = async ({ relationships = true } = {}): Promise<Seed> => {
  const store = memoryStore();
  const sessions = memorySessions();
  const accounts = [];

  for (const subject of ['a', 'b']) {
    const added = await store.addAccount({
      issuer: 'test',
      subject,
      treeName: `Tree ${subject}`,
    });

    if (!added.ok) throw new Error('setup failed');
    accounts.push(added.value);
  }

  const [a, b] = accounts as { accountId: never; treeId: never }[];
  const scope = (account: { accountId: never; treeId: never }) => ({
    accountId: account.accountId,
    treeId: account.treeId,
  });

  for (const [n, surname, givenNames, dates] of PEOPLE) {
    await store.addPerson({
      ...scope(a),
      person: personInputSchema.parse({
        givenNames,
        id: uuid(8, n),
        surname,
        ...dates,
      }),
    });
  }

  await store.addPerson({
    ...scope(b),
    person: personInputSchema.parse({
      givenNames: 'Stranger',
      id: OTHERS,
      surname: 'Pretorius',
    }),
  });

  const add = (relationship: object) =>
    store.addRelationship({
      ...scope(a),
      relationship: relationshipInputSchema.parse(relationship),
    });
  const parentRelationship = (
    n: number,
    parentId: number,
    childId: number
  ) => ({
    childId: uuid(8, childId),
    id: uuid(9, n),
    parentId: uuid(8, parentId),
    subtype: 'biological',
    type: 'parent',
  });

  if (relationships) {
    await add(parentRelationship(1, 2, 1));
    await add(parentRelationship(2, 3, 1));
    await add(parentRelationship(3, 1, 4));
    await add(parentRelationship(4, 1, 5));
    await add({
      id: uuid(9, 6),
      marriage: '1875',
      personAId: uuid(8, 6),
      personBId: ME,
      type: 'spouse',
    });
  }

  adapters.current = { sessions, store };

  const token = await startSession(sessions, () => new Date(), {
    accountId: a.accountId,
    email: 'ada@example.test',
  });

  jar.get.mockReturnValue({ value: token });
  session.mockResolvedValue({
    accountId: a.accountId,
    email: 'ada@example.test',
  });

  return { store, token };
};

const open = async (id = ME) =>
  render(await Relationships({ params: Promise.resolve({ id }) }));

const group = (name: string) => within(screen.getByRole('region', { name }));

const rows = (name: string) =>
  group(name)
    .getAllByRole('listitem')
    .map(item => item.textContent);

beforeEach(() => {
  vi.clearAllMocks();
});

// PPL-02
describe('/people/{id}/relationships', () => {
  it('has a title', () => {
    expect(metadata).toEqual({ title: 'Relationships' });
  });

  it('lists the parents, children and spouses, each group sorted by name', async () => {
    await setup();
    await open();

    expect(rows('Parents')).toEqual([
      expect.stringContaining('Nel, Johanna'),
      expect.stringContaining('Rossouw, Jacobus'),
    ]);
    expect(rows('Children')).toEqual([
      expect.stringContaining('Botha, Anna'),
      expect.stringContaining('Botha, Hendrik'),
    ]);
    expect(rows('Spouses')).toEqual([
      expect.stringMatching(/van Wyk, Gerrit.*Mar\. 1875/),
    ]);
    group('Parents').getAllByText('Biological');
  });

  it('shows the name and the dates of the Person under the title', async () => {
    await setup();
    await open();

    expect(screen.getByText(/Each change saves at once\./).textContent).toBe(
      'Maria du Toit. Each change saves at once.'
    );
    screen.getByText('Born about 1856, died in 1930');
    screen.getByText('c. 1856 – 1930');
    expect(
      screen.getByRole('link', { name: 'Edit person' }).getAttribute('href')
    ).toBe(`/people/${ME}`);
  });

  it('shows the empty line of each group for a Person with no Relationships', async () => {
    await setup({ relationships: false });
    await open();

    group('Parents').getByText('No parents yet.');
    group('Children').getByText('No children yet.');
    group('Spouses').getByText('No spouses yet.');
  });

  it('omits a Relationship when the list of Persons has no Person for its other end', async () => {
    const { store } = await setup();

    adapters.current = {
      ...(adapters.current as object),
      store: {
        ...store,
        listPersons: async (scope: never) =>
          (await store.listPersons(scope)).filter(
            person => person.id !== uuid(8, 3)
          ),
      },
    };
    await open();

    expect(rows('Parents')).toEqual([
      expect.stringContaining('Rossouw, Jacobus'),
    ]);
    expect(screen.queryByText(/Nel, Johanna/)).toBeNull();
  });

  it('lists every other Person of the Tree in the picker, and no one of another Tree', async () => {
    await setup();
    await open();
    fireEvent.click(group('Parents').getByRole('button', { name: 'Add' }));

    const dialog = within(screen.getByRole('dialog'));

    expect(
      dialog.getAllByRole('listitem').map(item => item.textContent)
    ).toEqual([
      expect.stringContaining('Botha, Anna'),
      expect.stringContaining('Botha, Hendrik'),
      expect.stringContaining('Nel, Johanna'),
      expect.stringContaining('Rossouw, Jacobus'),
      expect.stringContaining('van Wyk, Gerrit'),
    ]);
    expect(dialog.queryByText(/du Toit|Pretorius/)).toBeNull();
  });

  it('shows the no-other notice in the picker of a Tree with one Person', async () => {
    const { store } = await setup();

    adapters.current = {
      ...(adapters.current as object),
      store: {
        ...store,
        listPersons: async (scope: never) =>
          (await store.listPersons(scope)).filter(person => person.id === ME),
      },
    };
    await open();
    fireEvent.click(group('Spouses').getByRole('button', { name: 'Add' }));

    within(screen.getByRole('dialog')).getByText(
      'No other people in your Tree'
    );
  });

  it.each([
    ['no Person', MISSING],
    ["a Person in another Account's Tree", OTHERS],
    ['an id that is no UUID', 'nope'],
  ])('shows the not-found state for %s', async (_what, id) => {
    await setup();
    await open(id);

    screen.getByText('Person not found');
    expect(screen.queryByText(/Stranger|Pretorius/)).toBeNull();
  });

  it('shows the not-found state when the cookie opens no Tree', async () => {
    await setup();
    jar.get.mockReturnValue({ value: 'x'.repeat(43) });
    await open();

    screen.getByText('Person not found');
  });
});

// PPL-02
describe('a read that fails', () => {
  const failing = async (
    read: 'findPerson' | 'listPersons' | 'listRelationships'
  ) => {
    const { store } = await setup();

    adapters.current = {
      ...(adapters.current as object),
      store: {
        ...store,
        [read]: async () => {
          throw new Error('secret Botha');
        },
      },
    };
  };

  it('shows the notice with the name when the Relationships do not load, and logs the error name only', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await failing('listRelationships');
    await open();

    screen.getByText("Relationships didn't load");
    screen.getByRole('button', { name: 'Try again' });
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getByText(/Each change saves at once\./).textContent).toMatch(
      /^Maria du Toit\./
    );
    expect(log.mock.calls).toEqual([['Relationships page failed:', 'Error']]);
    log.mockRestore();
  });

  it('shows the notice with the name when the list of Persons does not load', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await failing('listPersons');
    await open();

    screen.getByText("Relationships didn't load");
    expect(screen.getByText(/Each change saves at once\./).textContent).toMatch(
      /^Maria du Toit\./
    );
    expect(log.mock.calls).toEqual([['Relationships page failed:', 'Error']]);
    log.mockRestore();
  });

  it('shows the notice with no name when the Person does not load', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await failing('findPerson');
    await open();

    screen.getByText("Relationships didn't load");
    expect(screen.getByText(/Each change saves at once\./).textContent).toBe(
      'Each change saves at once.'
    );
    expect(log.mock.calls).toEqual([['Relationships page failed:', 'Error']]);
    log.mockRestore();
  });

  it('shows the notice with no name when the read of the session throws', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await setup();
    session.mockRejectedValue(new Error('secret Botha'));
    await open();

    screen.getByText("Relationships didn't load");
    expect(screen.getByText(/Each change saves at once\./).textContent).toBe(
      'Each change saves at once.'
    );
    expect(log.mock.calls).toEqual([['Relationships page failed:', 'Error']]);
    log.mockRestore();
  });

  it('logs "unknown" for a thrown value that is no Error', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { store } = await setup();

    adapters.current = {
      ...(adapters.current as object),
      store: {
        ...store,
        listRelationships: () => Promise.reject('secret Botha'),
      },
    };
    await open();

    expect(log.mock.calls).toEqual([['Relationships page failed:', 'unknown']]);
    log.mockRestore();
  });

  it('rethrows a redirect of Next', async () => {
    const { store } = await setup();

    adapters.current = {
      ...(adapters.current as object),
      store: {
        ...store,
        findPerson: () => Promise.reject(new Error('redirect:/sign-in')),
      },
    };

    await expect(open()).rejects.toThrow('redirect:/sign-in');
  });
});

// NFR-05
describe('on a phone', () => {
  const desktop = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = (() => ({
      addEventListener: () => {},
      matches: true,
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = desktop;
  });

  it('shows the notice and no Relationships', async () => {
    await setup();
    await open();

    expect(screen.getByRole('status').textContent).toContain(
      'Edit people on a computer'
    );
    expect(screen.queryByText(/Rossouw/)).toBeNull();
  });
});
