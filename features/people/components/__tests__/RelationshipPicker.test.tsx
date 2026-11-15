import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PersonSummary } from '@ks/lib/domain/persons/types';

import { RelationshipPicker } from '@ks/features/people/components/RelationshipPicker';

const person = (fields: Partial<PersonSummary>): PersonSummary => ({
  born: '',
  bornReading: '',
  deceased: false,
  died: '',
  diedReading: '',
  givenNames: 'Given',
  id: 'p',
  maidenName: '',
  surname: 'Surname',
  variants: [],
  ...fields,
});

const pieter = person({
  givenNames: 'Pieter',
  id: 'a',
  surname: 'Fourie',
  variants: ['Fouri'],
});
const susanna = person({
  givenNames: 'Susanna',
  id: 'b',
  maidenName: 'Fourie',
  surname: 'Botha',
});
const maria = person({
  givenNames: 'Maria',
  id: 'c',
  surname: 'Foury',
  variants: ['Fourie'],
});

const open = (
  people: PersonSummary[],
  group: 'children' | 'parents' | 'spouses' = 'parents',
  query?: string
) => {
  const onClose = vi.fn();

  render(
    <RelationshipPicker
      group={group}
      initialQuery={query}
      onClose={onClose}
      people={people}
    />
  );

  return onClose;
};

const names = () =>
  screen.queryAllByRole('listitem').map(item => item.textContent);

// PPL-02
describe('RelationshipPicker', () => {
  it.each([
    ['parents', 'Add a parent'],
    ['spouses', 'Add a spouse'],
    ['children', 'Add a child'],
  ] as const)('titles the dialog of %s as %s', (group, title) => {
    open([pieter], group);

    screen.getByRole('heading', { name: title });
    screen.getByText('Step 1 of 2. Choose the person.');
  });

  it('lists every Person it gets, by name', () => {
    open([maria, pieter, susanna]);

    expect(names()).toEqual([
      expect.stringContaining('Botha, Susanna'),
      expect.stringContaining('Fourie, Pieter'),
      expect.stringContaining('Foury, Maria'),
    ]);
  });

  it('shows a variant note on the row that a variant matched', () => {
    open([pieter, susanna, maria]);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Fourie' },
    });

    expect(names()).toEqual([
      expect.stringContaining('Botha, Susanna'),
      expect.stringContaining('Fourie, Pieter'),
      expect.stringContaining('Foury, Maria'),
    ]);
    expect(
      screen.getByText('Matches the spelling “Fourie”').closest('li')
        ?.textContent
    ).toContain('Foury, Maria');
    expect(screen.getAllByText(/Matches the spelling/)).toHaveLength(1);
  });

  it('finds a Person by the maiden name', () => {
    open([pieter, susanna]);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'fourie' },
    });

    expect(screen.getByText('née Fourie').closest('li')?.textContent).toContain(
      'Botha, Susanna'
    );
  });

  it('shows the no-match notice, and "Clear the filter" lists everyone again', () => {
    open([pieter, susanna], 'parents', 'Pretorius');

    screen.getByText('No one matches “Pretorius”');
    expect(names()).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Clear the filter' }));

    expect(names()).toHaveLength(2);
  });

  it('shows the no-other notice, with a link to add a person', () => {
    open([]);

    screen.getByText('No other people in your Tree');
    expect(
      screen.getByRole('link', { name: 'Add a person' }).getAttribute('href')
    ).toBe('/people/new');
    expect(names()).toEqual([]);
  });

  it('runs onClose on "Cancel"', () => {
    const onClose = open([pieter]);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
