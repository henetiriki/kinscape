import { render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import rawTokens from '@ks/design/tokens.json';

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@ks/design/tokens.json');
});

// NFR-06
it('shows six groups in board order, then the system colours', async () => {
  const { default: ColourKit } = await import('@ks/app/design-kit/colour/page');

  render(<ColourKit />);

  expect(
    screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)
  ).toEqual([
    'Brand',
    'Accent',
    'Neutrals',
    'Focus',
    'Over the map',
    'Third party',
    'System colours',
  ]);
  expect(
    ['Brand', 'Accent', 'Neutrals', 'Focus', 'Over the map', 'Third party'].map(
      name =>
        within(screen.getByRole('region', { name })).getAllByRole('code').length
    )
  ).toEqual([6, 2, 13, 2, 2, 3]);
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  expect(screen.getAllByRole('status')).toHaveLength(3);
});

it('shows value, ratio and use, with opacity for the scrim and the hatch', async () => {
  const { default: ColourKit } = await import('@ks/app/design-kit/colour/page');

  render(<ColourKit />);

  expect(screen.getByText('#163019 · 14.3:1')).toBeTruthy();
  expect(screen.getByText('#A3AAA1 · 2.4:1, disabled')).toBeTruthy();
  expect(screen.getByText('#FFFFFF · 9.4:1 on brand')).toBeTruthy();
  expect(screen.getByText('rgb(24 33 27 / 0.45) · overlay')).toBeTruthy();
  expect(screen.getByText('#8B4A1C · map only')).toBeTruthy();
  expect(screen.getByText(/at map\.hatch\.opacity \(34%\)/)).toBeTruthy();
  expect(screen.getByText('--error #7E2316 · 8.6:1 on bg')).toBeTruthy();
  expect(
    screen.getByText('--error-border-soft #E7B9B0 · sign-in alert border')
  ).toBeTruthy();
});

it('draws an edge under the white chips only', async () => {
  const { default: ColourKit } = await import('@ks/app/design-kit/colour/page');

  render(<ColourKit />);

  const chip = (name: string) =>
    screen.getByText(name).closest('div')!.previousElementSibling!.className;

  expect(chip('--surface')).toMatch(/edge/);
  expect(chip('--white')).toMatch(/edge/);
  expect(chip('--surface-2')).not.toMatch(/edge/);
});

it('follows a changed token', async () => {
  vi.doMock('@ks/design/tokens.json', () => ({
    default: {
      ...rawTokens,
      colour: { ...rawTokens.colour, 'ink-3': '#000000' },
    },
  }));

  const { default: ColourKit } = await import('@ks/app/design-kit/colour/page');

  render(<ColourKit />);

  expect(screen.getByText('#000000 · 21.0:1')).toBeTruthy();
});
