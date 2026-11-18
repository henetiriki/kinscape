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
import { saveConflict } from '@ks/app/screens/person-actions';
import Conflict from '@ks/app/screens/person-conflict/page';
import { accountInitial } from '@ks/lib/domain/auth/initial.mts';

// PPL-01
describe('the Person screens', () => {
  it('person-conflict shows the synthetic Person', async () => {
    render(await Conflict());

    screen.getByRole('heading', { name: 'Edit Maria Magdalena du Toit' });
  });

  it('person-conflict shows the avatar letter of the sample email', async () => {
    render(await Conflict());

    expect(
      screen.getByRole('button', { name: 'Account menu' }).textContent
    ).toBe(accountInitial('researcher@example.com'));
  });

  it('gives Save an outcome that saves nothing', async () => {
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
