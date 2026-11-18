import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@ks/server/auth/current.mts', () => ({
  requireDevPage: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

import { saveNothing } from '@ks/app/screens/relationship-actions';
import SaveFailed from '@ks/app/screens/relationship-save-failed/page';
import { accountInitial } from '@ks/lib/domain/auth/initial.mts';

// PPL-02
describe('the Relationships screens', () => {
  it.each([['relationship-save-failed', SaveFailed]])(
    '%s shows the avatar letter of the sample email',
    async (_name, Page) => {
      render(await Page());

      expect(
        screen.getByRole('button', { name: 'Account menu' }).textContent
      ).toBe(accountInitial('researcher@example.com'));
    }
  );

  it('relationship-save-failed shows the error toast over the dialog', async () => {
    render(await SaveFailed());

    within(screen.getByRole('dialog')).getByText(
      "Couldn't save the link. Your picks are still here."
    );
  });

  it('the stand-in action saves nothing', async () => {
    expect(await saveNothing()).toEqual({ error: 'invalid', ok: false });
  });
});
