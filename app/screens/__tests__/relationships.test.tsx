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

import Empty from '@ks/app/screens/person-relationships-empty/page';
import LoadFailed from '@ks/app/screens/person-relationships-load-failed/page';
import Board from '@ks/app/screens/person-relationships/page';
import { saveNothing } from '@ks/app/screens/relationship-actions';
import Cycle from '@ks/app/screens/relationship-cycle/page';
import Details from '@ks/app/screens/relationship-details-parent/page';
import DetailsSpouse from '@ks/app/screens/relationship-details-spouse/page';
import EditSpouse from '@ks/app/screens/relationship-edit-spouse/page';
import PickEmpty from '@ks/app/screens/relationship-pick-empty/page';
import NoMatch from '@ks/app/screens/relationship-pick-no-match/page';
import Pick from '@ks/app/screens/relationship-pick/page';
import SaveFailed from '@ks/app/screens/relationship-save-failed/page';

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

  it('relationship-pick shows the matches of "Fourie", by name', async () => {
    render(await Pick());

    expect(
      within(screen.getByRole('dialog'))
        .getAllByRole('listitem')
        .map(item => item.textContent)
    ).toEqual([
      expect.stringContaining('Botha, Susanna'),
      expect.stringContaining('Fourie, Pieter'),
      expect.stringContaining('Foury, Maria Elizabeth'),
    ]);
    screen.getByText('née Fourie');
    screen.getByText('Matches the spelling “Fourie”');
  });

  it('relationship-pick-no-match shows the notice of its board', async () => {
    render(await NoMatch());

    screen.getByText('No one matches “Pretorius”');
  });

  it('relationship-pick-empty shows the notice of its board', async () => {
    render(await PickEmpty());

    screen.getByText('No other people in your Tree');
  });

  it('relationship-details-parent shows step 2 for the picked Person', async () => {
    render(await Details());

    const dialog = within(screen.getByRole('dialog'));

    dialog.getByRole('heading', { name: 'Add a parent' });
    dialog.getByText('Fourie, Pieter');
    dialog.getByRole('radiogroup', { name: 'Type of parent' });
    dialog.getByRole('button', { name: 'Back' });
  });

  it('relationship-details-spouse shows the marriage and the divorce fields', async () => {
    render(await DetailsSpouse());

    const dialog = within(screen.getByRole('dialog'));

    dialog.getByText('Botha, Hendrik Willem');
    expect(dialog.getByLabelText('Marriage')).toHaveProperty(
      'value',
      'ABT 1875'
    );
    expect(dialog.getByLabelText('Divorce')).toHaveProperty('value', '');
  });

  it('relationship-cycle shows the cycle alert in the dialog', async () => {
    render(await Cycle());

    within(screen.getByRole('dialog')).getByText(
      'This would make Hendrik Willem du Toit their own ancestor.'
    );
  });

  it('relationship-edit-spouse shows the edit dialog of the van Wyk marriage', async () => {
    render(await EditSpouse());

    const dialog = within(screen.getByRole('dialog'));

    dialog.getByRole('heading', { name: 'Edit marriage' });
    dialog.getByText('van Wyk, Gerrit');
    dialog.getByRole('button', { name: 'Cancel' });
  });

  it('relationship-save-failed shows the error toast over the dialog', async () => {
    render(await SaveFailed());

    within(screen.getByRole('dialog')).getByText(
      "Couldn't save the link. Your picks are still here."
    );
  });

  it('the stand-in action saves nothing', async () => {
    expect(await saveNothing()).toEqual({ error: 'invalid', ok: false });
  });

  it('person-relationships-load-failed shows the notice', async () => {
    render(await LoadFailed());

    screen.getByText("Relationships didn't load");
    screen.getByRole('button', { name: 'Try again' });
  });
});
