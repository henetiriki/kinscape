import type { Page } from '@playwright/test';

// Signs out through the Account menu. Sign-out ends with a client navigation to /sign-in and then a
// document load. Only the `load` event of that document proves it finished: a `page.goto` before that
// event aborts the load. `waitForURL` returns after the client navigation, so it is too early.
export const signOut = async (page: Page) => {
  const loaded = page.waitForEvent(
    'load',
    p => new URL(p.url()).pathname === '/sign-in'
  );

  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await loaded;
};
