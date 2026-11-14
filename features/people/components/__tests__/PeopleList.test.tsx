import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PersonSummary } from '@ks/lib/domain/persons/types';

import { PeopleList } from '@ks/features/people/components/PeopleList';

const refresh = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const person = (fields: Partial<PersonSummary>): PersonSummary => ({
  born: '—',
  deceased: false,
  died: '',
  givenNames: 'Given',
  id: 'p',
  maidenName: '',
  surname: 'Surname',
  variants: [],
  ...fields,
});

const people = [
  person({
    born: '1850',
    givenNames: 'Maria',
    id: 'maria',
    surname: 'du Toit',
    variants: ['v.d. Merwe'],
  }),
  person({
    born: 'c. 1832',
    died: '1880–1885',
    givenNames: 'Hendrik',
    id: 'hendrik',
    surname: 'Botha',
  }),
  person({
    deceased: true,
    givenNames: 'Anna',
    id: 'anna',
    maidenName: 'Pretorius',
    surname: 'Cloete',
  }),
];

const open = (props: Partial<Parameters<typeof PeopleList>[0]> = {}) =>
  render(
    <PeopleList
      email='a@example.test'
      initial='A'
      onSignOut={() => Promise.resolve()}
      people={people}
      {...props}
    />
  );

const filter = (text: string) =>
  fireEvent.change(screen.getByRole('searchbox', { name: 'Find a person' }), {
    target: { value: text },
  });

beforeEach(() => {
  vi.clearAllMocks();
});

// PPL-01
describe('PeopleList', () => {
  it('lists the Persons by surname with their years and a link to each', () => {
    open();

    const links = within(
      screen.getByRole('region', { name: 'People, by surname' })
    ).getAllByRole('link');

    expect(links.map(link => link.textContent)).toEqual([
      'Botha, HendrikBorn c. 1832Died 1880–1885Edit',
      'Cloete, Annanée PretoriusBorn —Died DeceasedEdit',
      'du Toit, MariaBorn 1850Died —Edit',
    ]);
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/people/hendrik',
      '/people/anna',
      '/people/maria',
    ]);
  });

  it('shows the title, the Map back link and Add a person', () => {
    open();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'People'
    );
    expect(screen.getByRole('link', { name: 'Map' }).getAttribute('href')).toBe(
      '/'
    );
    expect(
      screen.getByRole('link', { name: 'Add a person' }).getAttribute('href')
    ).toBe('/people/new');
  });

  it('counts the Persons', () => {
    open();
    expect(screen.getByRole('status').textContent).toBe(
      '3 people in this Tree, by surname'
    );
  });

  it('says "1 person" for one Person', () => {
    open({ people: [people[0]] });
    expect(screen.getByRole('status').textContent).toBe(
      '1 person in this Tree, by surname'
    );
    filter('maria');
    expect(screen.getByRole('status').textContent).toBe(
      '1 of 1 person matches'
    );
  });

  it('filters as the user types and counts the matches', () => {
    open();
    filter('hend');
    expect(screen.getByRole('status').textContent).toBe('1 of 3 people match');
    expect(
      screen.getByText('Botha, Hendrik').closest('a')!.getAttribute('href')
    ).toBe('/people/hendrik');
    expect(screen.queryByText('Cloete, Anna')).toBeNull();
  });

  it('matches a variant and shows the spelling that matched', () => {
    open();
    filter('v.d.');
    expect(screen.getByRole('status').textContent).toBe('1 of 3 people match');
    expect(
      screen.getByText('Matches the spelling “v.d. Merwe”').closest('a')!
        .textContent
    ).toBe(
      'du Toit, MariaMatches the spelling “v.d. Merwe”Born 1850Died —Edit'
    );
  });

  it('shows the maiden name as a note', () => {
    open();
    expect(screen.getByText('née Pretorius').closest('a')!.textContent).toBe(
      'Cloete, Annanée PretoriusBorn —Died DeceasedEdit'
    );
  });

  it('offers the filter with its helper and the / shortcut', () => {
    open();

    const box = screen.getByRole('searchbox', { name: 'Find a person' });

    expect(box.getAttribute('aria-keyshortcuts')).toBe('/');
    expect(box.getAttribute('aria-describedby')).toBe(
      screen.getByText(
        'Matches given names, surnames, maiden names and spelling variants.'
      ).id
    );
  });

  it('says no one matches, with the query, and clears the filter', () => {
    open();
    filter('Zzz');
    // The count comes first; the notice is a status too.
    expect(screen.getAllByRole('status')[0].textContent).toBe(
      '0 of 3 people match'
    );

    const notice = screen.getAllByRole('status')[1].textContent;

    expect(notice).toContain('No one matches “Zzz”');
    expect(notice).toContain(
      'Check the spelling, or add them with Add a person.'
    );
    expect(screen.queryByText('Botha, Hendrik')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Clear the filter' }));

    expect(
      screen.getByText('Botha, Hendrik').closest('a')!.getAttribute('href')
    ).toBe('/people/hendrik');
    expect(screen.getByRole<HTMLInputElement>('searchbox').value).toBe('');
  });

  it('shows the empty notice and no filter with no Persons', () => {
    open({ people: [] });

    const notice = screen.getByRole('status').textContent;

    expect(notice).toContain('No people yet');
    expect(notice).toContain(
      'Use Add a person to start your Tree. Once people are in it, you can pin their lives to the map.'
    );
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Add a person' }).getAttribute('href')
    ).toBe('/people/new');
  });

  it('shows an alert and a disabled filter when the load failed, and reloads on Try again', () => {
    open({ failed: true, people: [] });
    expect(screen.getByRole('alert').textContent).toContain(
      "People didn't load"
    );
    expect(screen.getByRole('alert').textContent).toContain(
      'Check your connection, then try again. Nothing in your Tree has changed.'
    );
    expect(screen.getByRole<HTMLInputElement>('searchbox').disabled).toBe(true);
    expect(screen.queryByText('No people yet')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refresh).toHaveBeenCalledOnce();
  });

  describe('on a phone', () => {
    const desktop = window.matchMedia;

    beforeEach(() => {
      window.matchMedia = (() => ({
        addEventListener: () => {},
        matches: true,
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = desktop;
    });

    // NFR-05
    it('is a look-up: the note, no Add a person, no link and no Edit', () => {
      open();
      screen.getByText('To add or edit people, use a computer.');
      expect(screen.queryByRole('link', { name: 'Add a person' })).toBeNull();
      expect(screen.queryByText('Edit')).toBeNull();
      expect(
        within(
          screen.getByRole('list', { name: 'People, by surname' })
        ).queryAllByRole('link')
      ).toHaveLength(0);
    });

    // PPL-01
    it('reads one line for each Person', () => {
      open();
      expect(
        within(screen.getByRole('list', { name: 'People, by surname' }))
          .getAllByRole('listitem')
          .map(item => item.textContent)
      ).toEqual([
        'Botha, Hendrikc. 1832 – 1880–1885',
        'Cloete, Anna— – deceasednée Pretorius',
        'du Toit, MariaBorn 1850',
      ]);
    });

    // PPL-01
    it('filters, with the phone helper and no Add a person in the no-match notice', () => {
      open();
      screen.getByText('Matches names, maiden names and spelling variants.');
      filter('Zzz');

      const notice = screen.getAllByRole('status')[1].textContent;

      expect(notice).toContain('Check the spelling.');
      expect(notice).not.toContain('Add a person');
    });

    // NFR-05
    it('says to add people on a computer when there are none', () => {
      open({ people: [] });
      expect(screen.getByRole('status').textContent).toContain(
        'Add people on a computer. Once people are in it, you can pin their lives to the map.'
      );
      expect(
        screen.queryByText('To add or edit people, use a computer.')
      ).toBeNull();
    });

    // PPL-01
    it('keeps the alert when the load failed', () => {
      open({ failed: true, people: [] });
      screen.getByRole('alert');
      screen.getByRole('button', { name: 'Try again' });
    });
  });

  it('opens the account menu and signs out', async () => {
    const onSignOut = vi.fn(() => Promise.resolve());

    open({ onSignOut });
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    await vi.waitFor(() => expect(onSignOut).toHaveBeenCalledOnce());
  });
});
