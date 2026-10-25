import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type Source, toDay } from '@/lib/boundaries/model.mts';
import { dayOf } from '@/lib/map/filter';

const mapView = vi.hoisted(() => vi.fn());

vi.mock('@/app/components/map/MapView', () => ({
  MapView: (props: { mapDay: number; showPolities: boolean }) => {
    mapView(props);

    return <div data-testid='map-view' />;
  },
}));

import { MapShell } from '@/app/components/map/MapShell';
import { freeArea } from '@/app/components/map/Stage';

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
    padding: freeArea(false),
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

describe('on a phone', () => {
  const desktop = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = (() => ({
      addEventListener: () => {},
      matches: true,
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = desktop;
  });

  // NFR-05
  it('draws the date sheet, the Layers button and the credits, and no panel or dock', () => {
    render(<MapShell sources={sources} />);

    expect(screen.getByRole('region', { name: 'Map date' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Layers and filters' })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Attributions' })).toBeTruthy();
    expect(screen.queryByRole('complementary', { name: 'Layers' })).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(lastProps().padding).toEqual(freeArea(true));
  });

  // MAP-03
  it('expands the sheet to the slider, which moves the Map date', () => {
    render(<MapShell sources={sources} />);
    expect(screen.queryByRole('slider')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expand the sheet' }));

    const slider = screen.getByRole('slider', { name: 'Map date' });

    fireEvent.keyDown(slider, { key: 'ArrowLeft', shiftKey: true });
    expect(lastProps().mapDay).toBeLessThan(dayOf(new Date()));
  });

  // MAP-02
  it('opens Layers in a sheet, turns the Polities off and closes it', () => {
    render(<MapShell sources={sources} />);
    fireEvent.click(screen.getByRole('button', { name: 'Layers and filters' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Polity borders/ }));
    expect(lastProps().showPolities).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(
      (
        screen
          .getByRole('heading', { hidden: true, name: 'Layers' })
          .closest('dialog') as HTMLDialogElement
      ).open
    ).toBe(false);
  });
});

const typeDate = (text: string) => {
  const field = screen.getByRole('textbox', { name: 'Date shown' });

  fireEvent.change(field, { target: { value: text } });
  fireEvent.keyDown(field, { key: 'Enter' });
};

// MAP-03
it('moves the Map date, slider and map to a typed day', () => {
  render(<MapShell sources={sources} />);
  fireEvent.click(screen.getByRole('radio', { name: 'Day' }));
  typeDate('1995-06-15');
  expect(lastProps().mapDay).toBe(toDay('1995-06-15'));
  expect(
    (screen.getByRole('slider', { name: 'Map date' }) as HTMLInputElement).value
  ).toBe(String(toDay('1995-06-15')));
});

it('keeps an impossible day in the field and the map where it was', () => {
  render(<MapShell sources={sources} />);
  fireEvent.click(screen.getByRole('radio', { name: 'Day' }));
  typeDate('1901-02-28');

  const before = lastProps().mapDay;

  typeDate('1901-02-30');
  expect(screen.getByText('February 1901 has 28 days.')).toBeTruthy();
  expect(
    (screen.getByRole('textbox', { name: 'Date shown' }) as HTMLInputElement)
      .value
  ).toBe('1901-02-30');
  expect(lastProps().mapDay).toBe(before);
});
