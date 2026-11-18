import type { Page } from '@playwright/test';

/** Puts the page in the state a screen in `design/screens.json` names, before the screenshot. */
export const states: Record<string, (page: Page) => Promise<void>> = {
  // The board draws the menu open with People hovered.
  'account-menu-open': async page => {
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page
      .getByRole('menuitem', { name: /^People/ })
      .evaluate(node => node.setAttribute('data-state', 'hover'));
  },
  // The board filters on a surname that only a maiden name carries, so no row matches.
  'people-no-match': async page => {
    await page
      .getByRole('searchbox', { name: 'Find a person' })
      .fill('Pretorius');
  },
  // The board's dates sit beside two blank names: Save marks all three fields.
  'person-errors': async page => {
    await page.getByLabel('Birth').fill('ABT 1850');
    await page.getByLabel('Death').fill('31 FEB 1850');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByText('3 fields need fixing').waitFor();
  },
  // The board edits Notes, then chooses "Relationships", so the leave warning shows.
  'person-leave': async page => {
    await page
      .getByLabel('Notes')
      .fill(
        'Her baptism record spells the family name Rossau. Six children are named in the family Bible.'
      );
    await page.getByRole('link', { name: 'Relationships' }).click();
    await page.getByRole('dialog', { name: 'Leave without saving?' }).waitFor();
  },
  // The stand-in action returns an error, so Save shows the toast or the conflict alert.
  'person-saved-nothing': async page => {
    await page.getByRole('button', { name: 'Save' }).click();
    await page
      .getByRole('alert')
      .filter({ hasText: /Couldn't save|changed while/ })
      .waitFor();
  },
  // The sign-in snapshot's password; the email stays empty and shows its placeholder.
  'sign-in-filled': async page => {
    await page.getByLabel('Password', { exact: true }).fill('example-password');
    // The snapshot shows no focus border.
    await page.getByLabel('Password', { exact: true }).blur();
  },
  // Researcher's fixture password is not this one, so this is a real wrong-details sign-in.
  'sign-in-wrong-password': async page => {
    await page.getByLabel('Email').fill('researcher@example.com');
    await page.getByLabel('Password', { exact: true }).fill('example-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('alert').filter({ hasText: "don't match" }).waitFor();
  },
};
