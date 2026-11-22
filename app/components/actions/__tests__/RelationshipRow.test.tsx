import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { RelationshipRow } from '@ks/app/components/actions/RelationshipRow';

const css = readFileSync(
  join(process.cwd(), 'app/components/actions/RelationshipRow.module.css'),
  'utf8'
);

const row = (props: Partial<Parameters<typeof RelationshipRow>[0]> = {}) =>
  render(
    <RelationshipRow
      born='1832'
      bornReading='In 1832'
      died='1899'
      diedReading='In 1899'
      givenNames='Hendrik Willem'
      href='/people/1/relationships/2'
      surname='Botha'
      {...props}
    />
  );

// PPL-02
describe('a relationship row', () => {
  it('shows the name, the line and one Edit link that names the Person', () => {
    row();
    expect(screen.getAllByRole('link')).toHaveLength(1);

    const link = screen.getByRole('link');

    expect(link.getAttribute('href')).toBe('/people/1/relationships/2');
    expect(link.textContent).toBe('Edit, Botha, Hendrik Willem');
    expect(screen.getByText('Botha, Hendrik Willem')).toBeInstanceOf(
      HTMLSpanElement
    );
    expect(screen.getByText('1832 – 1899').getAttribute('aria-hidden')).toBe(
      'true'
    );
    expect(screen.getByText('Born in 1832, died in 1899').className).toMatch(
      /hidden/
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(/remove/i)).toBeNull();
  });

  it('ends the row with the Edit link and its arrow, an ArrowLink', () => {
    row();

    const link = screen.getByRole('link');

    expect(link.className).toMatch(/link/);
    // eslint-disable-next-line testing-library/no-node-access -- the test checks that the link is the last child of the row
    expect(link.parentElement?.lastElementChild).toBe(link);
    // eslint-disable-next-line testing-library/no-node-access -- the icon is an aria-hidden svg; the test checks its data-icon
    expect(link.querySelector('svg[data-icon="forward"]')).not.toBeNull();
    expect(css).not.toContain('.edit');
  });

  it.each(['adoptive', 'biological', 'step'] as const)(
    'shows the %s subtype',
    subtype => {
      row({ subtype });
      expect(
        screen.getByText(subtype.charAt(0).toUpperCase() + subtype.slice(1))
      ).toBeInstanceOf(HTMLSpanElement);
    }
  );

  it('shows no subtype and no date text for a spouse with no dates', () => {
    row();
    expect(screen.queryByText(/Biological|Adoptive|Step/)).toBeNull();
    expect(screen.queryByText(/^m\.|div\./)).toBeNull();
  });

  it('shows both marriage dates, or one', () => {
    const { unmount } = row({
      divorced: '1890',
      divorcedReading: 'In 1890',
      married: '1875',
      marriedReading: 'In 1875',
    });

    expect(screen.getByText('Mar. 1875, div. 1890')).toBeInstanceOf(
      HTMLSpanElement
    );
    expect(
      screen.getByText('Married in 1875, divorced in 1890').className
    ).toMatch(/hidden/);
    unmount();
    row({ married: '1875', marriedReading: 'In 1875' });
    expect(screen.getByText('Mar. 1875')).toBeInstanceOf(HTMLSpanElement);
  });

  it('shows a Fuzzy marriage date as short text and reads its full reading', () => {
    row({ married: 'c. 1875', marriedReading: 'About 1875' });
    expect(screen.getByText('Mar. c. 1875')).toBeInstanceOf(HTMLSpanElement);
    expect(screen.getByText('Married about 1875').className).toMatch(/hidden/);
  });

  it('takes a state on the link', () => {
    row({ state: 'hover' });
    expect(screen.getByRole('link').dataset.state).toBe('hover');
  });
});
