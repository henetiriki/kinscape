import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import { PersonRow } from '@ks/app/components/actions/PersonRow';

const css = readFileSync(
  join(process.cwd(), 'app/components/actions/PersonRow.module.css'),
  'utf8'
);

const row = (props: Partial<Parameters<typeof PersonRow>[0]> = {}) =>
  render(
    <PersonRow
      born='1832'
      died='1899'
      givenNames='Hendrik Willem'
      href='/people/1'
      surname='Botha'
      {...props}
    />
  );

// PPL-01
it('is one link to edit, named by the name, the dates and Edit', () => {
  row();

  const link = screen.getByRole('link');

  expect(screen.getAllByRole('link')).toHaveLength(1);
  expect(link.getAttribute('href')).toBe('/people/1');
  expect(link.textContent).toBe('Botha, Hendrik WillemBorn 1832Died 1899Edit');
});

// PPL-01
it('names the dates for a screen reader and shows no note without one', () => {
  row();
  expect(screen.getByText('Born')).toBeTruthy();
  expect(screen.getByText('Died')).toBeTruthy();
  expect(screen.queryByText(/née|Matches/)).toBeNull();
});

// PPL-01
it('shows the maiden name, then the matched variant, in one line', () => {
  row({ maidenName: 'Fourie', matchedVariant: 'Bota' });
  expect(screen.getByText(/^née Fourie/).textContent).toBe(
    'née Fourie · Matches the spelling “Bota”'
  );
});

it('shows the maiden name alone, and the matched variant alone', () => {
  row({ maidenName: 'Rossouw' });
  expect(screen.getByText('née Rossouw')).toBeTruthy();
  row({ matchedVariant: 'Nell' });
  expect(screen.getByText('Matches the spelling “Nell”')).toBeTruthy();
});

// PPL-01
it('reads Died as a dash with no date, and as Deceased when marked deceased', () => {
  const { container, unmount } = row({ died: undefined });

  expect(container.textContent).toContain('Died —');
  unmount();
  row({ deceased: true, died: undefined });
  expect(screen.getByRole('link').textContent).toContain('Died Deceased');
});

it('shows a date it is given before Deceased', () => {
  row({ deceased: true, died: 'aft. 1920' });
  expect(screen.getByRole('link').textContent).toContain('Died aft. 1920');
});

it('takes a state', () => {
  row({ state: 'hover' });
  expect(screen.getByRole('link').dataset.state).toBe('hover');
});

// PPL-01
it('puts each date in a flex column, and gives Edit the link text style', () => {
  row();
  expect(screen.getByText('Born').parentElement!.className).toMatch(/date/);
  expect(screen.getByText('Died').parentElement!.className).toMatch(/date/);
  expect(css).toMatch(
    /\.date \{[^}]*display: flex;[^}]*flex-direction: column/
  );
  expect(css).toMatch(
    /\.edit \{[^}]*composes: link from '@ks\/app\/components\/foundation\/Text\.module\.css'/
  );
});

// PPL-01
it('is at least 52px tall on the People-list grid, and tints hover and pressed', () => {
  expect(css).toContain('min-height: var(--size-row-l)');
  expect(css).toContain(
    'grid-template-columns: minmax(0, 1fr) 160px 160px 72px'
  );
  expect(css).toMatch(/hover[\s\S]*?background: var\(--surface-2\)/);
  expect(css).toMatch(/active[\s\S]*?background: var\(--segment\)/);
  expect(css).toContain('color: var(--brand-pressed)');
  expect(css).toContain(
    "composes: ring from '@ks/app/components/foundation/focus.module.css'"
  );
});
