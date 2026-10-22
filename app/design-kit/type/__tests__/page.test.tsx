import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import tokens from '../../../../design/tokens.json';

vi.mock('../../../../design/tokens.json', async importOriginal => {
  const original = await importOriginal<{ default: typeof tokens }>();

  return {
    default: {
      ...original.default,
      map: {
        ...original.default.map,
        'water-label': {
          ...original.default.map['water-label'],
          colour: '#123456',
        },
      },
    },
  };
});

const { default: TypeKit } = await import('../page');

// NFR-06
it('shows the five map labels and a note built from the tokens', () => {
  render(<TypeKit />);

  for (const text of [
    'ORANGE FREE STATE',
    'contested · Orange River Colony',
    'Kimberley',
    'Vaal',
    'BECHUANALAND PROTECTORATE',
  ]) {
    expect(screen.getByText(text, { selector: 'span' })).toBeTruthy();
  }

  expect(
    screen.getByText(
      'Polity 12 / 600 uppercase, tracking 0.15em · contested note 11 italic · place 12 / 500 · river 11 italic · context 11 italic uppercase, tracking 0.12em · water 13 italic uppercase, tracking 0.2em. All with a 1.5px land-coloured halo.'
    )
  ).toBeTruthy();
});

// NFR-06
it('draws the water label chip in the changed water-label colour', () => {
  render(<TypeKit />);

  expect(screen.getByText('INDIAN OCEAN').style.color).toBe('rgb(18, 52, 86)');
  // The river label takes the water colour by reference.
  expect(screen.getByText('Vaal').style.color).toBe('rgb(18, 52, 86)');
});

// NFR-06
it('shows the 14 styles, with natural heading elements', () => {
  render(<TypeKit />);

  const scale = screen.getByRole('table', { name: 'Type scale' });

  // The header row and one row per style.
  expect(within(scale).getAllByRole('row')).toHaveLength(15);
  expect(scale.querySelectorAll('[data-variant]')).toHaveLength(14);
  expect(within(scale).getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(within(scale).getAllByRole('heading', { level: 2 })).toHaveLength(1);
  expect(within(scale).getAllByRole('heading', { level: 3 })).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Rules' })).toBeTruthy();
});
