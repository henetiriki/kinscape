import { render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import rawTokens from '../../../../design/tokens.json';

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('../../../../design/tokens.json');
});

// NFR-06
it('shows the five sections in board order, and the nineteen icons', async () => {
  const { default: FoundationsKit } = await import('../page');

  render(<FoundationsKit />);

  expect(
    screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)
  ).toEqual(['Spacing', 'Corner radius', 'Elevation', 'Icons', 'Motion']);

  const icons = screen.getByRole('region', { name: 'Icons' });
  const tiles = icons.querySelectorAll('svg');

  expect(tiles).toHaveLength(19);
  expect([...tiles].map(svg => svg.parentElement!.textContent)).toEqual([
    'search',
    'zoom in',
    'zoom out',
    'fit',
    'layers',
    'back',
    'forward',
    'chevron down',
    'play',
    'close',
    'copy',
    'place',
    'alert',
    'done',
    'export',
    'document',
    'sign out',
    'eye',
    'eye off',
  ]);
  expect(tiles[0].getAttribute('width')).toBe('24');
  expect(
    within(screen.getByRole('region', { name: 'Spacing' })).getByText('64px')
  ).toBeTruthy();
  expect(
    within(screen.getByRole('region', { name: 'Corner radius' })).getByText(
      'full'
    )
  ).toBeTruthy();
  expect(
    within(screen.getByRole('region', { name: 'Elevation' })).getByText(
      '0 10px 40px rgb(24 33 27 / 0.3)'
    )
  ).toBeTruthy();
  expect(
    within(screen.getByRole('region', { name: 'Motion' })).getByText(
      '600ms ease-out'
    )
  ).toBeTruthy();
  expect(screen.getByText('none')).toBeTruthy();
});

it('follows changed tokens', async () => {
  vi.doMock('../../../../design/tokens.json', () => ({
    default: {
      ...rawTokens,
      motion: { ...rawTokens.motion, press: '90ms linear' },
      radius: { ...rawTokens.radius, control: '5px' },
      shadow: { ...rawTokens.shadow, modal: '0 2px 3px red' },
      space: { ...rawTokens.space, '4': '5px' },
    },
  }));

  const { default: FoundationsKit } = await import('../page');

  render(<FoundationsKit />);

  // The space step and the control radius.
  expect(screen.getAllByText('5px')).toHaveLength(2);
  expect(screen.getByText('0 2px 3px red')).toBeTruthy();
  expect(screen.getByText('90ms linear')).toBeTruthy();
});
