import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@ks/server/auth/current.mts', () => ({
  requireDevPage: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ refresh: vi.fn() }),
}));

import LoadFailed from '@ks/app/screens/people-load-failed/page';
import Loading from '@ks/app/screens/people-loading/page';
import { accountInitial } from '@ks/lib/domain/auth/initial.mts';

// PPL-01
describe('the People screens', () => {
  it('show the avatar letter of the sample email on the load-failed page', async () => {
    render(await LoadFailed());

    expect(
      screen.getByRole('button', { name: 'Account menu' }).textContent
    ).toBe(accountInitial('researcher@example.com'));
  });

  it('show the loading notice with no Avatar and no progress bar', async () => {
    render(await Loading());

    screen.getByRole('heading', { name: 'People' });
    expect(screen.getByRole('status').textContent).toContain('Loading people');
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('link', { name: 'Map' }).getAttribute('href')).toBe(
      '/'
    );
  });

  it('show the load-failed alert', async () => {
    render(await LoadFailed());

    expect(screen.getByRole('alert').textContent).toContain(
      "People didn't load"
    );
  });
});
