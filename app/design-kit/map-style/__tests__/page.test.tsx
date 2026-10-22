import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import tokens from '../../../../design/tokens.json';

vi.mock('../../../../design/tokens.json', async importOriginal => {
  const original = await importOriginal<{ default: typeof tokens }>();

  return {
    default: {
      ...original.default,
      colour: { ...original.default.colour, brand: '#112233' },
      map: { ...original.default.map, sea: '#123456' },
    },
  };
});

const { default: MapStyleKit } = await import('../page');

// NFR-06
it('shows 20 layers in order, with every column', () => {
  render(<MapStyleKit />);

  const table = screen.getByRole('table', { name: 'Layer stack' });
  const rows = within(table).getAllByRole('row');

  expect(rows).toHaveLength(21);
  expect(within(rows[0]).getAllByRole('columnheader')).toHaveLength(7);
  expect(within(rows[1]).getAllByRole('cell')[0].textContent).toBe('01');
  expect(within(rows[1]).getAllByRole('cell')[2].textContent).toBe(
    'background'
  );
  expect(within(rows[20]).getAllByRole('cell')[2].textContent).toBe(
    'selection'
  );
  expect(within(rows[20]).getAllByRole('cell')[6].textContent).toBe(
    'CoversMAP-07'
  );
});

// NFR-05: a phone shows each layer as a card, so its last three fields carry labels
it('labels the source, key properties and covers of every layer', () => {
  render(<MapStyleKit />);

  const rows = within(
    screen.getByRole('table', { name: 'Layer stack' })
  ).getAllByRole('row');

  for (const row of rows.slice(1)) {
    expect(
      [...row.querySelectorAll('.label')].map(label => label.textContent)
    ).toEqual(['Source / filter', 'Key properties', 'Covers']);
  }
});

// NFR-06
it('shows a changed map token in the key properties and the legend', () => {
  render(<MapStyleKit />);

  expect(screen.getByText('background-color #123456')).toBeTruthy();
  expect(screen.getByText('Brand #112233')).toBeTruthy();
});
