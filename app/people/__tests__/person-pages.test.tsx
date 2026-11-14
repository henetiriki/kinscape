import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));
const session = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));
vi.mock('@ks/server/auth/current.mts', () => ({
  requireSession: session,
  signOut: vi.fn(),
}));

import EditPerson, { viewport as editViewport } from '@ks/app/people/[id]/page';
import PeopleLayout from '@ks/app/people/layout';
import NewPerson, { viewport as newViewport } from '@ks/app/people/new/page';
import { personInputSchema } from '@ks/lib/domain/persons/schemas.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

const MINE = '01900000-0000-7000-8000-0000000000a1';
const OTHERS = '01900000-0000-7000-8000-0000000000b1';

/** Two Accounts, each with a Tree and one Person; the cookie is the first Account's. */
const setup = async () => {
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

  const [a, b] = accounts;

  const scope = (account: unknown) =>
    account as { accountId: never; treeId: never };

  await store.addPerson({
    ...scope(a),
    person: personInputSchema.parse({
      givenNames: 'Hendrik',
      id: MINE,
      surname: 'Botha',
    }),
  });
  await store.addPerson({
    ...scope(b),
    person: personInputSchema.parse({
      givenNames: 'Stranger',
      id: OTHERS,
      surname: 'Nel',
    }),
  });
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
};

const edit = async (id: string) =>
  render(await EditPerson({ params: Promise.resolve({ id }) }));

beforeEach(() => {
  vi.clearAllMocks();
});

// PPL-01
describe('/people/new', () => {
  it('shows the empty form, with the Avatar initial from the email', async () => {
    await setup();
    render(await NewPerson());

    screen.getByRole('heading', { level: 1, name: 'Add a person' });
    expect(
      screen.getByRole('button', { name: 'Account menu' }).textContent
    ).toBe('A');
  });

  it('covers the whole screen, for the safe area', () => {
    expect(newViewport).toEqual({ viewportFit: 'cover' });
  });
});

// PPL-01
describe('/people/{id}', () => {
  it('shows the Person in the form', async () => {
    await setup();
    await edit(MINE);

    screen.getByRole('heading', { level: 1, name: 'Edit Hendrik Botha' });
    expect((screen.getByLabelText('Surname') as HTMLInputElement).value).toBe(
      'Botha'
    );
  });

  it.each([
    ['no Person', '01900000-0000-7000-8000-0000000000c1'],
    ["a Person in another Account's Tree", OTHERS],
    ['an id that is no UUID', 'nope'],
  ])('shows the not-found state for %s', async (_what, id) => {
    await setup();
    await edit(id);

    screen.getByText('Person not found');
    expect(screen.queryByText(/Stranger|Nel/)).toBeNull();
  });

  it('shows the not-found state when the cookie opens no Tree', async () => {
    await setup();
    jar.get.mockReturnValue({ value: 'x'.repeat(43) });
    await edit(MINE);

    screen.getByText('Person not found');
  });

  it('covers the whole screen, for the safe area', () => {
    expect(editViewport).toEqual({ viewportFit: 'cover' });
  });
});

// PPL-01
describe('the layout', () => {
  it('renders its page', () => {
    render(
      <PeopleLayout>
        <p>The page</p>
      </PeopleLayout>
    );

    screen.getByText('The page');
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

  it('/people/new shows the notice and no form', async () => {
    await setup();
    render(await NewPerson());

    expect(screen.getByRole('status').textContent).toContain(
      'Edit people on a computer'
    );
    expect(screen.queryByLabelText('Surname')).toBeNull();
  });

  it('/people/{id} shows the notice and no form', async () => {
    await setup();
    await edit(MINE);

    expect(screen.getByRole('status').textContent).toContain(
      'Edit people on a computer'
    );
    expect(screen.queryByLabelText('Surname')).toBeNull();
  });
});
