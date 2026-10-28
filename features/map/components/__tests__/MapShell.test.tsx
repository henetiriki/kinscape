import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Source } from '@/lib/domain/boundaries/types.ts';

import { toDay } from '@/lib/domain/boundaries/model.mts';
import { dayOf } from '@/lib/domain/map/map-date';

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

const coverage = [{ validFrom: toDay('1994-04-27'), validTo: null }];

const lastProps = () => mapView.mock.calls.at(-1)?.[0];

it('shows the map for today with Polity borders on', () => {
  render(<MapShell coverage={coverage} sources={sources} />);

  expect(screen.getByTestId('map-view')).toBeTruthy();
  expect(lastProps()).toEqual({
    mapDay: dayOf(new Date()),
    padding: freeArea(false),
    showPolities: true,
  });
});

// MAP-03
it('moves the Map date from the date dock', () => {
  render(<MapShell coverage={coverage} sources={sources} />);
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(lastProps().mapDay).toBeLessThan(dayOf(new Date()));
});

// MAP-02
it('hides and restores the Polity borders from the Layers panel', () => {
  render(<MapShell coverage={coverage} sources={sources} />);

  const row = screen.getByRole('checkbox', { name: /Polity borders/ });

  fireEvent.click(row);
  expect(lastProps().showPolities).toBe(false);
  fireEvent.click(row);
  expect(lastProps().showPolities).toBe(true);
});

it('opens and closes the sources dialog from the credits line', () => {
  render(<MapShell coverage={coverage} sources={sources} />);

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
    render(<MapShell coverage={coverage} sources={sources} />);

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
    render(<MapShell coverage={coverage} sources={sources} />);
    expect(screen.queryByRole('slider')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expand the sheet' }));

    const slider = screen.getByRole('slider', { name: 'Map date' });

    fireEvent.keyDown(slider, { key: 'ArrowLeft', shiftKey: true });
    expect(lastProps().mapDay).toBeLessThan(dayOf(new Date()));
  });

  // MAP-02
  it('opens Layers in a sheet, turns the Polities off and closes it', () => {
    render(<MapShell coverage={coverage} sources={sources} />);
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
  render(<MapShell coverage={coverage} sources={sources} />);
  fireEvent.click(screen.getByRole('radio', { name: 'Day' }));
  typeDate('1995-06-15');
  expect(lastProps().mapDay).toBe(toDay('1995-06-15'));
  expect(
    (screen.getByRole('slider', { name: 'Map date' }) as HTMLInputElement).value
  ).toBe(String(toDay('1995-06-15')));
});

it('keeps an impossible day in the field and the map where it was', () => {
  render(<MapShell coverage={coverage} sources={sources} />);
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

describe('the pre-boundary notice', () => {
  const first = [{ validFrom: toDay('1910-05-31'), validTo: null }];
  const title = (year: string) =>
    screen.queryByText(`No borders are mapped for ${year} yet`);

  const renderOn = (spans = first) => {
    render(<MapShell coverage={spans} sources={sources} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Day' }));
  };

  // MAP-03
  it('shows the card with the first year before the first date', () => {
    renderOn();
    typeDate('1900-06-01');
    expect(title('1900')).toBeTruthy();
    expect(screen.getByText('The map has borders from 1910.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Jump to 1910' })).toBeTruthy();
  });

  // MAP-03
  it('shows on 1910-05-30 and not on 1910-05-31', () => {
    renderOn();
    typeDate('1910-05-30');
    expect(title('1910')).toBeTruthy();
    typeDate('1910-05-31');
    expect(title('1910')).toBeNull();
  });

  // MAP-03
  it('jumps to the first date, dropping the card and the warning', () => {
    renderOn();
    typeDate('1750-01-01');
    expect(
      screen.getByText('No borders are mapped for 1750 yet.')
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Jump to 1910' }));
    expect(lastProps().mapDay).toBe(toDay('1910-05-31'));
    expect(title('1910')).toBeNull();
    expect(
      screen.queryByText('No borders are mapped for 1750 yet.')
    ).toBeNull();
  });

  it('names whatever the first date is', () => {
    renderOn(coverage);
    typeDate('1900-06-01');
    expect(screen.getByRole('button', { name: 'Jump to 1994' })).toBeTruthy();
  });

  // MAP-02
  it('shows no card with Polity borders off', () => {
    renderOn();
    typeDate('1900-06-01');
    fireEvent.click(screen.getByRole('checkbox', { name: /Polity borders/ }));
    expect(title('1900')).toBeNull();
  });

  it('shows no card when there are no Boundary versions', () => {
    renderOn([]);
    typeDate('1900-06-01');
    expect(title('1900')).toBeNull();
  });

  // MAP-03
  it('shows the card but no warning when the slider moves to 1900', () => {
    renderOn();
    fireEvent.change(screen.getByRole('slider', { name: 'Map date' }), {
      target: { value: String(toDay('1900-01-01')) },
    });
    expect(title('1900')).toBeTruthy();
    expect(
      screen.queryByText('No borders are mapped for 1900 yet.')
    ).toBeNull();
  });

  it('warns of a typed date without borders, not as an error', () => {
    renderOn();
    typeDate('1750-01-01');
    expect(lastProps().mapDay).toBe(toDay('1750-01-01'));
    expect(
      screen
        .getByRole('textbox', { name: 'Date shown' })
        .getAttribute('aria-invalid')
    ).not.toBe('true');
    expect(
      screen
        .getByText('No borders are mapped for 1750 yet.')
        .getAttribute('role')
    ).toBe('status');
  });
});
