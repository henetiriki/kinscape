import type { Page } from '@playwright/test';

/** Chooses "Add" in the group `title` of the Relationships page, as an Account does. */
const add = (page: Page, title: 'Children' | 'Parents' | 'Spouses') =>
  page
    .getByRole('region', { name: title })
    .getByRole('button', { name: 'Add' })
    .click();

/** Picks the row of `name` in the picker. */
const pick = (page: Page, name: RegExp) =>
  page.getByRole('button', { name }).click();

/** Chooses "Add a pin" and waits until the panel has its Persons. */
const openPinForm = async (page: Page) => {
  await page.getByRole('button', { name: 'Add a pin' }).click();
  await page.getByRole('combobox', { name: 'Person' }).waitFor();
  await page
    .getByRole('button', { name: 'Save' })
    .and(page.locator(':enabled'))
    .waitFor();
};

/** A field of the add panel. The map has its own "Precision" and "Sources" controls. */
const panelField = (page: Page, name: string) =>
  page
    .getByRole('form', { name: 'Add a pin' })
    .getByLabel(name, { exact: true });

/**
 * Scrolls the panel body and each text area to the top. A fill puts the caret at the end and the
 * browser scrolls to it, but the boards show the start.
 */
const showTop = (page: Page) =>
  page.getByRole('form', { name: 'Add a pin' }).evaluate(form => {
    for (const node of form.querySelectorAll('*')) node.scrollTop = 0;
  });

/** What the boards `pin-form`, `pin-form-saving` and `pin-form-save-failed` hold in the fields. */
const fillPinForm = async (page: Page) => {
  await page.getByRole('combobox', { name: 'Person' }).fill('Maria Magdalena');
  await page
    .getByRole('option')
    .filter({ hasText: 'Maria Magdalena' })
    .first()
    .click();
  await page.getByLabel('Event type').selectOption('residence');
  await page.getByLabel('Date', { exact: true }).fill('FROM 1890 TO 1905');
  await page.getByLabel('Coordinates').fill('-28.742600, 25.311800');
  await page
    .getByLabel('Address as recorded')
    .fill('Farm Example, district Example');
  await panelField(page, 'Precision').selectOption('farm');
  await panelField(page, 'Sources').fill('Example parish register, 1890.');
  await panelField(page, 'Notes').fill('Lived here with the Example family.');
  await showTop(page);
  // The boards show no focus border.
  await panelField(page, 'Notes').blur();
};

/** Fills the panel and chooses "Save". The server action then never answers (`hold`) or fails as a network failure does (`abort`). */
const saveWith = async (page: Page, answer: 'abort' | 'hold') => {
  await page.route('**/*', route =>
    route.request().headers()['next-action']
      ? answer === 'abort'
        ? route.abort()
        : new Promise<void>(() => {})
      : route.continue()
  );
  await openPinForm(page);
  await fillPinForm(page);
  await page.getByRole('button', { name: 'Save' }).click();
};

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
  // On a read-only Tree the store refuses Save, so the form shows the toast. `person-conflict` uses a stand-in action.
  'person-saved-nothing': async page => {
    await page.getByRole('button', { name: 'Save' }).click();
    await page
      .getByRole('alert')
      .filter({ hasText: /Couldn't save|changed while/ })
      .waitFor();
  },
  'pin-form': async page => {
    await openPinForm(page);
    await fillPinForm(page);
  },
  'pin-form-empty': openPinForm,
  // The board's coordinates are in degrees, minutes and seconds, and its date has the wrong format. Its address has 501 characters, and its sources and notes have 10,001.
  'pin-form-errors': async page => {
    await openPinForm(page);
    await page.getByLabel('Date', { exact: true }).fill('14/03/1850');
    await page.getByLabel('Coordinates').fill('28°44′33″S 25°18′42″E');
    await page
      .getByLabel('Address as recorded')
      .fill('Farm Example, district Example, '.repeat(16).slice(0, 501));
    const long = 'Example text that runs past the end of the field. '
      .repeat(201)
      .slice(0, 10_001);

    await panelField(page, 'Sources').fill(long);
    await panelField(page, 'Notes').fill(long);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByText('Choose a person.').waitFor();
    await showTop(page);
    await page.getByRole('button', { name: 'Save' }).blur();
  },
  // The page opens the panel at a synthetic Place. The board shows the Persons loaded.
  'pin-form-existing-place': async page => {
    await page.getByRole('combobox', { name: 'Person' }).waitFor();
  },
  // The Researcher Tree has no Person.
  'pin-form-no-people': async page => {
    await page.getByRole('button', { name: 'Add a pin' }).click();
    await page.getByText('No people yet').waitFor();
  },
  'pin-form-save-failed': async page => {
    await saveWith(page, 'abort');
    await page
      .getByRole('alert')
      .filter({ hasText: "Couldn't save the pin" })
      .waitFor();
    await page.unroute('**/*');
  },
  // The route holds the action request, so the panel stays in its saving state.
  'pin-form-saving': async page => {
    await saveWith(page, 'hold');
    await page
      .getByRole('button', { name: 'Save' })
      .and(page.locator(':disabled'))
      .waitFor();
  },
  // A child of Maria as her parent makes a cycle, so Save shows the alert.
  'relationship-cycle': async page => {
    await add(page, 'Parents');
    await pick(page, /du Toit, Hendrik Willem/);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('alert').filter({ hasText: 'ancestor' }).waitFor();
  },
  'relationship-details-parent': async page => {
    await add(page, 'Parents');
    await pick(page, /Fourie, Pieter/);
  },
  'relationship-details-spouse': async page => {
    await add(page, 'Spouses');
    await pick(page, /Botha, Hendrik Willem/);
    await page.getByLabel('Marriage').fill('ABT 1875');
    await page.getByLabel('Marriage').blur();
  },
  // The board filters the picker on a surname that three rows match, and shows no focus border.
  'relationship-pick': async page => {
    await add(page, 'Parents');
    await page.getByLabel('Find a person').fill('Fourie');
    await page.getByLabel('Find a person').blur();
  },
  // The alone Tree holds one Person, so the picker has no other Person to list.
  'relationship-pick-empty': async page => {
    await add(page, 'Parents');
  },
  // The board filters on a surname that no row carries.
  'relationship-pick-no-match': async page => {
    await add(page, 'Parents');
    await page.getByLabel('Find a person').fill('Pretorius');
    await page.getByLabel('Find a person').blur();
  },
  // The route aborts each server action request, as a network failure does, so Save shows the toast.
  'relationship-save-failed': async page => {
    await page.route('**/*', route =>
      route.request().headers()['next-action']
        ? route.abort()
        : route.continue()
    );
    await add(page, 'Children');
    await pick(page, /le Roux, Anna Catharina/);
    await page.getByRole('button', { name: 'Save' }).click();
    await page
      .getByRole('alert')
      .filter({ hasText: "Couldn't save" })
      .waitFor();
    await page.unroute('**/*');
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
