import type { Page } from '@playwright/test';

/** Puts the page in the state a screen in `design/screens.json` names, before the screenshot. */
export const states: Record<string, (page: Page) => Promise<void>> = {
  // The board draws the menu open with Sources and attributions hovered.
  'account-menu-open': async page => {
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page
      .getByRole('menuitem', { name: 'Sources and attributions' })
      .evaluate(node => node.setAttribute('data-state', 'hover'));
  },
  'kit-menu-open': async page => {
    await page.getByRole('button', { name: 'Boards' }).click();
    // The sheet has slid in once its animation is done.
    await page
      .getByRole('dialog', { name: 'Boards' })
      .evaluate(node =>
        Promise.all(node.getAnimations().map(animation => animation.finished))
      );
  },
  // The board filters on a surname that only a maiden name carries, so no row matches.
  'people-no-match': async page => {
    await page
      .getByRole('searchbox', { name: 'Find a person' })
      .fill('Pretorius');
  },
  // The sign-in snapshot's password; the email stays empty and shows its placeholder.
  'sign-in-filled': async page => {
    await page.getByLabel('Password', { exact: true }).fill('example-password');
    // The snapshot shows no focus border.
    await page.getByLabel('Password', { exact: true }).blur();
  },
  // Researcher has no Account, so this is a real wrong-details sign-in.
  'sign-in-wrong-password': async page => {
    await page.getByLabel('Email').fill('researcher@example.com');
    await page.getByLabel('Password', { exact: true }).fill('example-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('alert').filter({ hasText: "don't match" }).waitFor();
  },
};
