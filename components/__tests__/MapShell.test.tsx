import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import type { Source } from '@/lib/boundaries/model.mts';

import { dayOf } from '@/lib/map/filter';

const mapView = vi.hoisted(() => vi.fn());

vi.mock('../MapView', () => ({
  MapView: (props: { mapDay: number; showPolities: boolean }) => {
    mapView(props);

    return <div data-testid='map-view' />;
  },
}));

import { MapShell } from '../MapShell';

const sources: Source[] = [
  {
    attribution: 'Made with Natural Earth',
    author: 'a',
    dateChecked: '2026-10-19',
    id: 'one',
    layer: 'Polity borders',
    licence: 'Public domain',
    licenceLink: 'https://example.com',
    title: 'Natural Earth admin-1',
  },
];

const lastProps = () => mapView.mock.calls.at(-1)?.[0];

it('shows the map for today with Polity borders on', () => {
  render(<MapShell sources={sources} />);

  expect(screen.getByTestId('map-view')).toBeTruthy();
  expect(lastProps()).toEqual({
    mapDay: dayOf(new Date()),
    showPolities: true,
  });
});

// MAP-03
it('moves the Map date from the date dock', () => {
  render(<MapShell sources={sources} />);
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(lastProps().mapDay).toBeLessThan(dayOf(new Date()));
});

// MAP-02
it('hides and restores the Polity borders from the Layers panel', () => {
  render(<MapShell sources={sources} />);

  const row = screen.getByRole('checkbox', { name: /Polity borders/ });

  fireEvent.click(row);
  expect(lastProps().showPolities).toBe(false);
  fireEvent.click(row);
  expect(lastProps().showPolities).toBe(true);
});

it('opens and closes the sources dialog from the credits line', () => {
  render(<MapShell sources={sources} />);

  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Attributions' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});
