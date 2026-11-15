import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  RelationshipEntry,
  RelationshipsPerson,
} from '@ks/features/people/components/types';

import { PersonRelationships } from '@ks/features/people/components/PersonRelationships';

const refresh = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const none = { born: '', bornReading: '', died: '', diedReading: '' };
const b1889 = { born: '1889', bornReading: 'In 1889' };
const d1932 = { died: '1932', diedReading: 'In 1932' };

const person = (fields: Partial<RelationshipsPerson> = {}) => ({
  ...none,
  givenNames: 'Maria Magdalena',
  id: 'maria',
  surname: 'du Toit',
  ...fields,
});

const link = (fields: Partial<RelationshipEntry>): RelationshipEntry => ({
  ...none,
  givenNames: 'Given',
  id: 'r',
  surname: 'Surname',
  ...fields,
});

const empty = { children: [], parents: [], spouses: [] };

type Props = Parameters<typeof PersonRelationships>[0];

/** The page of Maria with no links; `props` changes any prop, so a case can fail the load. */
const open = (props: Record<string, unknown> = {}) =>
  render(
    <PersonRelationships
      {...({
        email: 'a@example.test',
        groups: empty,
        initial: 'A',
        onSignOut: () => Promise.resolve(),
        person: person(),
        ...props,
      } as Props)}
    />
  );

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
      `Maria Magdalena du Toit, ${words}${line}. Each change saves at once.`
    );
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
    ).toBe('/people/maria');
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
  it('lists the links of each group, with a count', () => {
    open({
      groups: {
        children: [link({ givenNames: 'Anna', id: 'c1', surname: 'Botha' })],
        parents: [
          link({
            givenNames: 'Jacobus',
            id: 'p1',
            subtype: 'biological',
            surname: 'Rossouw',
          }),
          link({
            givenNames: 'Johanna',
            id: 'p2',
            subtype: 'adoptive',
            surname: 'Nel',
          }),
        ],
        spouses: [
          link({
            givenNames: 'Gerrit',
            id: 's1',
            married: '1875',
            marriedReading: 'In 1875',
            surname: 'van Wyk',
          }),
        ],
      },
    });

    screen.getByRole('heading', { level: 2, name: 'Parents' });
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

  it('shows the empty line of each group that has no link', () => {
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
        parents: [link({ givenNames: 'Jacobus', surname: 'Rossouw' })],
      },
    });

    const edit = screen.getByRole('link', { name: 'Edit, Rossouw, Jacobus' });

    expect(edit.getAttribute('href')).toBe('/people/maria/relationships');
    expect(screen.queryByRole('button', { name: /Remove|Delete/ })).toBeNull();
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

  it('shows the notice and no links', () => {
    open({
      groups: { ...empty, parents: [link({ surname: 'Rossouw' })] },
    });

    expect(screen.getByRole('status').textContent).toContain(
      'Edit people on a computer'
    );
    expect(screen.queryByText(/Rossouw/)).toBeNull();
  });
});
