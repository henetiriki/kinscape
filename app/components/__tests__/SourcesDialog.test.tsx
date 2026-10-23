import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import type { Source } from '@/lib/boundaries/model.mts';

import { SourcesDialog } from '../SourcesDialog';

const sources: Source[] = [
  {
    attribution: 'Made with Natural Earth',
    author: 'Natural Earth authors',
    dateChecked: '2026-10-19',
    id: 'one',
    layer: 'Land',
    licence: 'Public domain',
    licenceLink: 'https://example.com/licence',
    processing: 'Simplified to 500 m.',
    title: 'Natural Earth land',
  },
  {
    attribution: 'MapLibre',
    author: 'MapLibre contributors',
    dateChecked: '2026-10-18',
    id: 'two',
    layer: 'Map renderer',
    licence: 'BSD-3-Clause',
    licenceLink: 'https://example.com/bsd',
    title: 'MapLibre GL JS',
  },
];

const renderDialog = (onClose = vi.fn(), open = true) =>
  render(<SourcesDialog onClose={onClose} open={open} sources={sources} />);

// NFR-08
it('lists each source with its layer, licence link and date checked', () => {
  renderDialog();

  const rows = screen.getAllByRole('row', { hidden: true }).slice(1);

  expect(rows).toHaveLength(2);
  expect(rows[0].textContent).toContain('Land');
  expect(rows[0].textContent).toContain('Natural Earth land');
  expect(rows[0].textContent).toContain('Natural Earth authors');
  expect(rows[0].textContent).toContain('Simplified to 500 m.');
  expect(rows[0].textContent).toContain('2026-10-19');
  expect(rows[1].textContent).not.toContain('Simplified');
  expect(
    screen
      .getAllByRole('link', { hidden: true, name: 'Public domain' })
      .map(link => link.getAttribute('href'))
  ).toEqual(['https://example.com/licence', 'https://example.com/licence']);
  expect(
    screen
      .getAllByRole('link', { hidden: true, name: 'BSD-3-Clause' })
      .map(link => link.getAttribute('href'))
  ).toEqual(['https://example.com/bsd', 'https://example.com/bsd']);
  expect(
    screen.getByRole('dialog', {
      hidden: true,
      name: 'Sources and attributions',
    })
  ).toBeTruthy();
});

it('says the board 07 words and has a list for a phone beside the table', () => {
  renderDialog();

  expect(
    screen.getByText(
      "Where every layer on the map comes from, and the licence it's used under."
    )
  ).toBeTruthy();
  expect(screen.getByText(/A source isn't used until/)).toBeTruthy();
  expect(
    screen
      .getAllByRole('columnheader', { hidden: true })
      .map(header => header.textContent)
  ).toEqual(['Layer', 'Source', 'Licence', 'Checked']);

  const items = screen.getAllByRole('listitem', { hidden: true });

  expect(items).toHaveLength(2);
  expect(within(items[0]).getByText('Checked 2026-10-19')).toBeTruthy();
  expect(within(items[0]).getByText('Natural Earth land')).toBeTruthy();
});

it('is closed until open, and closes from the button', () => {
  const close = vi.fn();
  const { rerender } = renderDialog(close, false);

  expect(
    screen.getByRole('dialog', { hidden: true }).hasAttribute('open')
  ).toBe(false);
  rerender(<SourcesDialog onClose={close} open sources={sources} />);
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(close).toHaveBeenCalledTimes(1);
});
