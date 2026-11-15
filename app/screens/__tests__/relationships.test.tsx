import { render, screen, within } from '@testing-library/react';
import { describe, it, vi } from 'vitest';

vi.mock('@ks/server/auth/current.mts', () => ({
  requireDevPage: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import Empty from '@ks/app/screens/person-relationships-empty/page';
import LoadFailed from '@ks/app/screens/person-relationships-load-failed/page';
import Board from '@ks/app/screens/person-relationships/page';

// PPL-02
describe('the Relationships screens', () => {
  it('person-relationships shows the three groups of the board', async () => {
    render(await Board());

    screen.getByText('Maria Magdalena du Toit');
    within(screen.getByRole('region', { name: 'Parents' })).getByText(
      '3 links'
    );
    within(screen.getByRole('region', { name: 'Children' })).getByText(
      '2 links'
    );
    within(screen.getByRole('region', { name: 'Spouses' })).getByText(
      'Mar. 1875, div. 1890'
    );
  });

  it('person-relationships-empty shows the empty line of each group', async () => {
    render(await Empty());

    screen.getByText('No parents yet.');
    screen.getByText('No children yet.');
    screen.getByText('No spouses yet.');
  });

  it('person-relationships-load-failed shows the notice', async () => {
    render(await LoadFailed());

    screen.getByText("Relationships didn't load");
    screen.getByRole('button', { name: 'Try again' });
  });
});
