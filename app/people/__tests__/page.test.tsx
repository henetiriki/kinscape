import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({ get: vi.fn() }));
const adapters = vi.hoisted(() => ({ current: undefined as unknown }));
const session = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() =>
  vi.fn((to: string) => {
    throw new Error(`redirect:${to}`);
  })
);

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('next/navigation', () => ({
  redirect,
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock('@ks/server/adapters.mts', () => ({
  appAdapters: () => adapters.current,
}));
vi.mock('@ks/server/auth/current.mts', () => ({
  requireSession: session,
  signOut: vi.fn(),
}));

import People from '@ks/app/people/page';
import { personInputSchema } from '@ks/lib/domain/persons/schemas.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { startSession } from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

const savePerson = async (
  store: ReturnType<typeof memoryStore>,
  scope: { accountId: never; treeId: never },
  fields: Record<string, unknown>
) => {
  await store.addPerson({
    ...scope,
    person: personInputSchema.parse({ id: crypto.randomUUID(), ...fields }),
  });
};

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

  await savePerson(store, a as never, {
    birth: 'ABT 1832',
    death: 'BET 1880 AND 1885',
    givenNames: 'Hendrik',
    notes: 'A private note',
    surname: 'Botha',
  });
  await savePerson(store, a as never, {
    givenNames: 'Anna',
    surname: 'Cloete',
  });
  await savePerson(store, b as never, {
    givenNames: 'Stranger',
    surname: 'Nel',
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

  return { store };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// PPL-01, NFR-09
describe('the People page', () => {
  it("lists the Viewer's Persons with short dates and no one else's", async () => {
    await setup();
    render(await People());

    expect(screen.getByText('Botha, Hendrik')).toBeDefined();
    expect(screen.getByText('c. 1832')).toBeDefined();
    expect(screen.getByText('1880–1885')).toBeDefined();
    expect(screen.queryByText(/Stranger|Nel/)).toBeNull();
    expect(screen.queryByText(/private note/)).toBeNull();
  });

  it('shows the email initial in the Avatar', async () => {
    await setup();
    render(await People());

    expect(
      screen.getByRole('button', { name: 'Account menu' }).textContent
    ).toBe('A');
  });

  it('shows a dash for a date the Person lacks', async () => {
    await setup();
    render(await People());

    expect(screen.getByText('Cloete, Anna').closest('a')!.textContent).toBe(
      'Cloete, AnnaBorn —Died —Edit'
    );
  });

  it('shows the load-failed state when the cookie opens no Tree', async () => {
    await setup();
    jar.get.mockReturnValue({ value: 'x'.repeat(43) });
    render(await People());

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.queryByText('Botha, Hendrik')).toBeNull();
  });

  it('shows the load-failed state when the read throws', async () => {
    const { store } = await setup();

    vi.spyOn(store, 'listPersons').mockRejectedValue(new Error('down'));
    render(await People());

    expect(screen.getByRole('alert').textContent).toContain(
      "People didn't load"
    );
  });

  it('sends a visitor with no session to the sign-in page', async () => {
    session.mockRejectedValue(new Error('redirect:/sign-in'));

    await expect(People()).rejects.toThrow('redirect:/sign-in');
  });
});
