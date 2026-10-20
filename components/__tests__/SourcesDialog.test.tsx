import { fireEvent, render, screen } from '@testing-library/react';
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

// NFR-08
it('lists each source with its layer, licence link and date checked', () => {
  render(<SourcesDialog onClose={vi.fn()} sources={sources} />);

  const rows = screen.getAllByRole('row').slice(1);

  expect(rows).toHaveLength(2);
  expect(rows[0].textContent).toContain('Land');
  expect(rows[0].textContent).toContain('Natural Earth land');
  expect(rows[0].textContent).toContain('Simplified to 500 m.');
  expect(rows[0].textContent).toContain('2026-10-19');
  expect(screen.getByRole('link', { name: 'Public domain' })).toHaveProperty(
    'href',
    'https://example.com/licence'
  );
  expect(rows[1].textContent).not.toContain('Simplified');
  expect(screen.getByRole('dialog', { name: 'Sources and attributions' }));
});

it('closes from the button and from Escape', () => {
  const close = vi.fn();

  render(<SourcesDialog onClose={close} sources={sources} />);
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.keyDown(screen.getByRole('button', { name: 'Close' }), {
    key: 'Escape',
  });
  fireEvent.keyDown(screen.getByRole('button', { name: 'Close' }), {
    key: 'a',
  });

  expect(close).toHaveBeenCalledTimes(2);
});

it('focuses the close button, then returns focus to where it was', () => {
  const opener = document.createElement('button');

  document.body.append(opener);
  opener.focus();

  const { unmount } = render(
    <SourcesDialog onClose={vi.fn()} sources={sources} />
  );

  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Close' })
  );
  unmount();
  expect(document.activeElement).toBe(opener);

  // Nothing to return to when nothing had focus.
  opener.remove();
  vi.spyOn(document, 'activeElement', 'get').mockReturnValue(null);
  render(<SourcesDialog onClose={vi.fn()} sources={sources} />).unmount();
  vi.restoreAllMocks();
});
