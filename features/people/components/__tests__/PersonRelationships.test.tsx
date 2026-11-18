import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  RelationshipEntry,
  RelationshipsPerson,
} from '@ks/features/people/components/types';
import type { Relationship } from '@ks/lib/domain/relationships/types';

import { PersonRelationships } from '@ks/features/people/components/PersonRelationships';

const refresh = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, replace }),
}));

const MARIA = '01900000-0000-7000-8000-000000000001';
const PIETER = '01900000-0000-7000-8000-000000000002';
const GERRIT = '01900000-0000-7000-8000-000000000003';
const ANNA = '01900000-0000-7000-8000-000000000004';
const RELATION = '01900000-0000-7000-9000-000000000001';

const none = { born: '', bornReading: '', died: '', diedReading: '' };
const b1889 = { born: '1889', bornReading: 'In 1889' };
const d1932 = { died: '1932', diedReading: 'In 1932' };

const person = (fields: Partial<RelationshipsPerson> = {}) => ({
  ...none,
  givenNames: 'Maria Magdalena',
  id: MARIA,
  surname: 'du Toit',
  ...fields,
});

/** A Relationship with plain ids: the page only compares them. */
const link = (fields: Record<string, unknown>) =>
  ({
    childId: MARIA,
    id: RELATION,
    parentId: PIETER,
    subtype: 'biological',
    type: 'parent',
    version: 1,
    ...fields,
  }) as unknown as Relationship;

const entry = (fields: Partial<RelationshipEntry>): RelationshipEntry => ({
  ...none,
  givenNames: 'Given',
  id: RELATION,
  relationship: link({}),
  surname: 'Surname',
  ...fields,
});

const empty = { children: [], parents: [], spouses: [] };

type Props = Parameters<typeof PersonRelationships>[0];

const create = vi.fn(async (): Promise<unknown> => ({ ok: true, value: {} }));
const update = vi.fn(async (): Promise<unknown> => ({ ok: true, value: {} }));

/** The page of Maria with no Relationships; `props` changes any prop, so a case can fail the load. */
const page = (props: Record<string, unknown> = {}) => (
  <PersonRelationships
    {...({
      actions: { create, update },
      email: 'a@example.test',
      groups: empty,
      initial: 'A',
      onSignOut: () => Promise.resolve(),
      people: [
        {
          ...none,
          deceased: false,
          givenNames: 'Pieter',
          id: PIETER,
          maidenName: '',
          surname: 'Fourie',
          variants: [],
        },
      ],
      person: person(),
      ...props,
    } as Props)}
  />
);

const open = (props: Record<string, unknown> = {}) => render(page(props));

const group = (name: string) => within(screen.getByRole('region', { name }));

beforeEach(() => {
  vi.clearAllMocks();
});

// PPL-02
describe('the subtitle', () => {
  it.each([
    [{ ...none, ...b1889 }, '1889 –', 'Born in 1889'],
    [none, '? –', 'Born unknown'],
    [
      { ...none, ...b1889, deceased: true },
      '1889 – ?',
      'Born in 1889, died unknown',
    ],
    [{ ...none, deceased: true }, '? – ?', 'Born unknown, died unknown'],
    [{ ...none, ...d1932 }, '? – 1932', 'Born unknown, died in 1932'],
    [
      { ...none, ...b1889, ...d1932 },
      '1889 – 1932',
      'Born in 1889, died in 1932',
    ],
  ])('shows %j as %s and reads %s', (dates, line, words) => {
    open({ person: person(dates) });

    screen.getByText(line);
    expect(screen.getByText(words).className).toMatch(/hidden/);
    expect(screen.getByText(/Each change saves at once\./).textContent).toBe(
      'Maria Magdalena du Toit. Each change saves at once.'
    );
  });

  it('sets the name apart from the save note', () => {
    open();

    const name = screen.getByText('Maria Magdalena du Toit');

    expect(name.className).toMatch(/title/);
    expect(name.parentElement?.className).toMatch(/person/);
    expect(name.parentElement?.parentElement?.textContent).toBe(
      'Maria Magdalena du Toit. Each change saves at once.'
    );
  });

  it('shows the dates on a line below the name', () => {
    open({ person: person({ ...b1889 }) });

    const sentence = screen.getByText(/Each change saves at once\./);
    const dates = screen.getByText('1889 –');

    expect(sentence.contains(dates)).toBe(false);
    expect(
      sentence.compareDocumentPosition(dates) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('shows the second sentence only when the Person did not load', () => {
    open({ failed: true, person: undefined });

    expect(screen.getByText('Each change saves at once.').textContent).toBe(
      'Each change saves at once.'
    );
  });
});

// PPL-02
describe('the header', () => {
  it('links back to the edit page of the Person', () => {
    open();

    expect(
      screen.getByRole('link', { name: 'Edit person' }).getAttribute('href')
    ).toBe(`/people/${MARIA}`);
  });

  it('links back to the list when the Person did not load', () => {
    open({ failed: true, person: undefined });

    expect(
      screen.getByRole('link', { name: 'People' }).getAttribute('href')
    ).toBe('/people');
  });

  it('has no Save or Cancel', () => {
    open();

    expect(screen.queryByRole('button', { name: /Save|Cancel/ })).toBeNull();
  });
});

// PPL-02
describe('the groups', () => {
  it('lists the Relationships of each group, with a count', () => {
    open({
      groups: {
        children: [entry({ givenNames: 'Anna', id: 'c1', surname: 'Botha' })],
        parents: [
          entry({
            givenNames: 'Jacobus',
            id: 'p1',
            subtype: 'biological',
            surname: 'Rossouw',
          }),
          entry({
            givenNames: 'Johanna',
            id: 'p2',
            subtype: 'adoptive',
            surname: 'Nel',
          }),
        ],
        spouses: [
          entry({
            givenNames: 'Gerrit',
            id: 's1',
            married: '1875',
            marriedReading: 'In 1875',
            surname: 'van Wyk',
          }),
        ],
      },
    });

    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map(heading => heading.textContent)
    ).toEqual(['Parents', 'Spouses', 'Children']);
    group('Parents').getByText('2 links');
    group('Children').getByText('1 link');
    group('Spouses').getByText('1 link');
    expect(
      group('Parents')
        .getAllByRole('listitem')
        .map(item => item.textContent)
    ).toEqual([
      expect.stringContaining('Rossouw, Jacobus'),
      expect.stringContaining('Nel, Johanna'),
    ]);
    group('Parents').getByText('Biological');
    group('Spouses').getByText('Mar. 1875');
  });

  it('has an "Add" button in each group', () => {
    open();

    for (const name of ['Parents', 'Children', 'Spouses']) {
      group(name).getByRole('button', { name: 'Add' });
    }
  });

  it.each([
    ['Parents', 'Add a parent'],
    ['Spouses', 'Add a spouse'],
    ['Children', 'Add a child'],
  ])(
    'opens the picker of %s with "Add", and "Cancel" closes it',
    (name, title) => {
      open();

      expect(screen.queryByRole('heading', { name: title })).toBeNull();

      fireEvent.click(group(name).getByRole('button', { name: 'Add' }));

      screen.getByRole('heading', { name: title });
      screen.getByText('Fourie, Pieter');

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('heading', { name: title })).toBeNull();
      expect(document.querySelector('dialog')?.open).toBe(false);
    }
  );

  it('clears the filter when "Add" opens the picker again', () => {
    open();

    fireEvent.click(group('Parents').getByRole('button', { name: 'Add' }));
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Pretorius' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(group('Parents').getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('searchbox')).toHaveProperty('value', '');
  });

  it('shows the no-match notice when the filter matches no one', () => {
    open();

    fireEvent.click(group('Parents').getByRole('button', { name: 'Add' }));
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Pretorius' },
    });

    screen.getByText('No one matches “Pretorius”');
  });

  it('shows the empty line of each group that has no Relationship', () => {
    open();

    group('Parents').getByText('No parents yet.');
    group('Children').getByText('No children yet.');
    group('Spouses').getByText('No spouses yet.');
    expect(screen.getAllByText('0 links')).toHaveLength(3);
  });

  it('gives each row "Edit" with the name of the other Person, and no remove control', () => {
    open({
      groups: {
        ...empty,
        parents: [entry({ givenNames: 'Jacobus', surname: 'Rossouw' })],
      },
    });

    const edit = screen.getByRole('link', { name: 'Edit, Rossouw, Jacobus' });

    expect(edit.getAttribute('href')).toBe(
      `/people/${MARIA}/relationships?edit=${RELATION}`
    );
    expect(screen.queryByRole('button', { name: /Remove|Delete/ })).toBeNull();
  });
});

// PPL-02
describe('step 2 of "Add"', () => {
  const pick = () => {
    open();
    fireEvent.click(group('Parents').getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: /Fourie, Pieter/ }));
  };

  it('shows the details of the picked Person, in place of the picker', () => {
    pick();

    screen.getByRole('heading', { name: 'Add a parent' });
    screen.getByText('Step 2 of 2. Say how they are linked.');
    within(screen.getByRole('dialog')).getByText('Fourie, Pieter');
    screen.getByRole('radiogroup', { name: 'Type of parent' });
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('shows the picker again with "Back", and keeps the filter', () => {
    open();
    fireEvent.click(group('Parents').getByRole('button', { name: 'Add' }));
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Fourie' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Fourie, Pieter/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    screen.getByText('Step 1 of 2. Choose the person.');
    expect(screen.getByRole('searchbox')).toHaveProperty('value', 'Fourie');
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('saves, then closes the dialog with no toast', async () => {
    pick();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(document.querySelector('dialog')?.open).toBe(false)
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ childId: MARIA, parentId: PIETER })
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('keeps step 2 open when the browser reports that the picker closed after the pick', () => {
    pick();
    fireEvent(
      document.querySelectorAll('dialog')[0],
      new Event('close', { bubbles: false })
    );

    expect(
      screen.getByRole('radiogroup', { name: 'Type of parent' })
    ).not.toBeNull();
    expect(document.querySelectorAll('dialog[open]')).toHaveLength(1);
  });

  it('closes with "Close", and the next "Add" starts at the picker', () => {
    pick();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(group('Parents').getByRole('button', { name: 'Add' }));

    screen.getByText('Step 1 of 2. Choose the person.');
  });

  it('opens at step 2 when the screen board says so', () => {
    open({ picking: { group: 'spouses', picked: PIETER } });

    screen.getByRole('heading', { name: 'Add a spouse' });
  });

  it('opens at the picker when the picked Person is not in the Tree', () => {
    open({ picking: { group: 'spouses', picked: 'nobody' } });

    screen.getByText('Step 1 of 2. Choose the person.');
  });
});

// PPL-02
describe('"Edit"', () => {
  const parents = [
    entry({
      givenNames: 'Jacobus',
      id: RELATION,
      relationship: link({ subtype: 'step', version: 4 }),
      subtype: 'step',
      surname: 'Rossouw',
    }),
  ];

  it('opens the dialog at step 2 with the Person fixed, the type filled, and no "Back"', () => {
    open({ edit: RELATION, groups: { ...empty, parents } });

    screen.getByRole('heading', { name: 'Edit parent' });
    screen.getByText('Change the type.');
    within(screen.getByRole('dialog')).getByText('Rossouw, Jacobus');
    expect(screen.getByRole('radio', { name: 'Step' })).toHaveProperty(
      'checked',
      true
    );
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it('names the version that the page read, then replaces the address without `edit`', async () => {
    open({ edit: RELATION, groups: { ...empty, parents } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(`/people/${MARIA}/relationships`)
    );
    expect(update).toHaveBeenCalledWith({
      relationship: expect.objectContaining({ id: RELATION, subtype: 'step' }),
      version: 4,
    });
  });

  it('replaces the address on "Cancel"', () => {
    open({ edit: RELATION, groups: { ...empty, parents } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(replace).toHaveBeenCalledWith(`/people/${MARIA}/relationships`);
  });

  it('opens no dialog for an id that no group holds', () => {
    open({ edit: 'nobody', groups: { ...empty, parents } });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a child, where this Person is the parent, with the child fixed', async () => {
    open({
      edit: RELATION,
      groups: {
        ...empty,
        children: [
          entry({
            givenNames: 'Anna',
            relationship: link({ childId: ANNA, parentId: MARIA }),
            surname: 'Botha',
          }),
        ],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    screen.getByRole('heading', { name: 'Edit child' });
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        relationship: expect.objectContaining({
          childId: ANNA,
          parentId: MARIA,
        }),
        version: 1,
      })
    );
  });

  it.each([
    ['A', { personAId: MARIA, personBId: GERRIT }],
    ['B', { personAId: GERRIT, personBId: MARIA }],
  ])(
    'opens a spouse that this Person is end %s of, and updates with the ends in their stored order',
    async (_end, ends) => {
      open({
        edit: RELATION,
        groups: {
          ...empty,
          spouses: [
            entry({
              givenNames: 'Gerrit',
              relationship: link({ ...ends, type: 'spouse' }),
              surname: 'van Wyk',
            }),
          ],
        },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      screen.getByRole('heading', { name: 'Edit marriage' });
      await waitFor(() =>
        expect(update).toHaveBeenCalledWith({
          relationship: expect.objectContaining(ends),
          version: 1,
        })
      );
    }
  );

  it('stays closed after a save until the address drops `edit`', async () => {
    const props = { edit: RELATION, groups: { ...empty, parents } };

    const { rerender } = open(props);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(replace).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    rerender(page(props));
    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(page({ ...props, edit: undefined }));
    rerender(page(props));
    screen.getByRole('dialog');
  });

  it('opens again on "Edit" while the address still holds `edit`', async () => {
    open({ edit: RELATION, groups: { ...empty, parents } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await act(async () => {});

    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(
      screen.getByRole('link', { name: 'Edit, Rossouw, Jacobus' })
    );

    screen.getByRole('dialog');
  });
});

// PPL-02
describe('a load that failed', () => {
  it('shows the notice with "Try again" and no group', () => {
    open({ failed: true });

    screen.getByText("Relationships didn't load");
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add' })).toBeNull();
  });

  it('runs a refresh on "Try again"', () => {
    open({ failed: true });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

// NFR-05
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

  it('shows the notice and no Relationships', () => {
    open({
      groups: { ...empty, parents: [entry({ surname: 'Rossouw' })] },
    });

    expect(screen.getByRole('status').textContent).toContain(
      'Edit people on a computer'
    );
    expect(screen.queryByText(/Rossouw/)).toBeNull();
  });
});
