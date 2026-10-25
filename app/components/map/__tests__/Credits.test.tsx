import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import type { Source } from '@/lib/boundaries/model.mts';

import { Credits, sourcesOnScreen } from '@/app/components/map/Credits';

const source = (id: string, layer: string, attribution: string): Source => ({
  attribution,
  author: 'a',
  dateChecked: '2026-10-19',
  id,
  layer,
  licence: 'l',
  licenceLink: 'https://example.com',
  title: 't',
});

const sources = [
  source('land', 'Land', 'Made with Natural Earth'),
  source('admin', 'Polity borders', 'Made with Natural Earth'),
  source('font', 'Polity borders', 'Public Sans'),
  source('lib', 'Map renderer', 'MapLibre'),
];

// NFR-08
it('joins the credits of what is on screen, once each, ending in a link', () => {
  const { container } = render(
    <Credits onOpenAttributions={vi.fn()} showPolities sources={sources} />
  );

  expect(container.textContent).toBe(
    'Made with Natural Earth · Public Sans · MapLibre · Attributions'
  );
});

it('drops the credits of Polity borders while that layer is off', () => {
  const { container } = render(
    <Credits
      onOpenAttributions={vi.fn()}
      showPolities={false}
      sources={sources}
    />
  );

  expect(container.textContent).toBe(
    'Made with Natural Earth · MapLibre · Attributions'
  );
  expect(sourcesOnScreen(sources, false).map(s => s.id)).toEqual([
    'land',
    'lib',
  ]);
});

it('opens the dialog from the Attributions link', () => {
  const open = vi.fn();

  render(<Credits onOpenAttributions={open} showPolities sources={sources} />);
  fireEvent.click(screen.getByRole('button', { name: 'Attributions' }));

  expect(open).toHaveBeenCalledOnce();
});
