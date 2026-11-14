import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@ks/server/auth/current.mts', () => ({
  requireDevPage: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import Readings from '@ks/app/screens/fuzzy-date-readings/page';
import { saveConflict, saveFailed } from '@ks/app/screens/person-actions';
import Conflict from '@ks/app/screens/person-conflict/page';
import Edit from '@ks/app/screens/person-edit/page';
import New from '@ks/app/screens/person-new/page';
import NotFound from '@ks/app/screens/person-not-found/page';
import SaveFailed from '@ks/app/screens/person-save-failed/page';

// PPL-01
describe('the Person screens', () => {
  it('show the empty form', async () => {
    render(await New());

    screen.getByRole('heading', { name: 'Add a person' });
  });

  it.each([
    ['person-edit', Edit],
    ['person-save-failed', SaveFailed],
    ['person-conflict', Conflict],
  ])('%s shows the synthetic Person', async (_name, Page) => {
    render(await Page());

    screen.getByRole('heading', { name: 'Edit Maria Magdalena du Toit' });
  });

  it('show the not-found state', async () => {
    render(await NotFound());

    screen.getByText('Person not found');
  });

  it('give Save an outcome that saves nothing', async () => {
    expect(await saveFailed()).toEqual({ error: 'not-found', ok: false });
    expect(await saveConflict()).toEqual({ error: 'conflict', ok: false });
  });

  it('show every reading and message of the date field', async () => {
    render(await Readings());

    expect(screen.getAllByText('On 14 March 1850').length).toBeGreaterThan(0);
    expect(screen.getAllByText('February 1850 has 28 days.')).not.toHaveLength(
      0
    );
    expect(
      screen.getAllByText('Put the earlier date first: BET 1850 AND 1855.')
    ).toHaveLength(1);
  });
});
