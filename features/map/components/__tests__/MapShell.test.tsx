import type { Ref } from 'react';

import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Layer, MapHandle } from '@ks/features/map/types';
import type { Source } from '@ks/lib/domain/boundaries/types.ts';

import { asDay, toDay } from '@ks/lib/domain/boundaries/model.mts';
import { dayOf } from '@ks/lib/domain/map/map-date.mts';

const mapView = vi.hoisted(() => vi.fn());
const handle = vi.hoisted(() => ({
  fit: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}));

vi.mock('@ks/features/map/components/MapView', async () => {
  const { useImperativeHandle } = await import('react');

  return {
    MapView: (props: {
      handle: Ref<MapHandle>;
      mapDay: number;
      visible: Record<string, boolean>;
    }) => {
      mapView(props);
      useImperativeHandle(props.handle, () => handle);

      return <div data-testid='map-view' />;
    },
  };
});

import { freeArea } from '@ks/app/components/layout/MapLayout';
import { testLayer } from '@ks/features/map/__tests__/test-layer';
import { MapShell } from '@ks/features/map/components/MapShell';
import { PINS_LAYER_ID } from '@ks/features/map/layers/pins';
import { polityLayer } from '@ks/features/map/layers/polities';

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
const layers: Layer[] = [polityLayer];

const onSignOut = vi.fn(() => Promise.resolve());
const account = { email: 'a@example.test', initial: 'A', onSignOut };

const lastProps = () => mapView.mock.calls.at(-1)?.[0];

// NFR-03
it('opens the Sources dialog from the account menu', () => {
  render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
  expect(screen.getByText('Signed in as').parentElement?.textContent).toContain(
    'a@example.test'
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(
    screen.getByRole('menuitem', { name: 'Sources and attributions' })
  );
  expect(screen.getByRole('dialog').hasAttribute('open')).toBe(true);
});

// NFR-03
it('signs out from the account menu', () => {
  render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
  expect(onSignOut).toHaveBeenCalledOnce();
});

it('shows the map for today with Polity borders on', () => {
  render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
    />
  );

  expect(screen.getByTestId('map-view')).toBeTruthy();
  expect(lastProps()).toMatchObject({
    layers,
    mapDay: dayOf(new Date()),
    padding: freeArea(false),
    visible: { [polityLayer.id]: true },
  });
});

// MAP-01
describe('the zoom card', () => {
  const renderShell = () =>
    render(
      <MapShell
        {...account}
        coverage={coverage}
        layers={layers}
        sources={sources}
      />
    );

  it('drives the map from its three buttons', () => {
    renderShell();
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fit South Africa' }));
    expect(handle.zoomIn).toHaveBeenCalledOnce();
    expect(handle.zoomOut).toHaveBeenCalledOnce();
    expect(handle.fit).toHaveBeenCalledOnce();
  });

  it('disables Zoom out and Zoom in at the limits the map reports', () => {
    renderShell();
    act(() => lastProps().onZoomLimits({ atMax: false, atMin: true }));
    expect(screen.getByRole('button', { name: 'Zoom out' }).ariaDisabled).toBe(
      'true'
    );
    expect(
      screen.getByRole('button', { name: 'Zoom in' }).ariaDisabled
    ).toBeNull();
    act(() => lastProps().onZoomLimits({ atMax: true, atMin: false }));
    expect(screen.getByRole('button', { name: 'Zoom in' }).ariaDisabled).toBe(
      'true'
    );
  });

  it('shows no card on a phone', () => {
    const query = window.matchMedia;

    window.matchMedia = (() => ({
      addEventListener: () => {},
      matches: true,
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    renderShell();
    window.matchMedia = query;
    expect(screen.queryByRole('button', { name: 'Zoom in' })).toBeNull();
  });
});

// MAP-05: a layer is one file and one line in the list.
it('gives a second layer its own row and toggle', () => {
  render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={[polityLayer, testLayer]}
      sources={sources}
    />
  );

  fireEvent.click(screen.getByRole('checkbox', { name: 'Test layer' }));
  expect(lastProps().visible).toEqual({
    [polityLayer.id]: true,
    [testLayer.id]: false,
  });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Test layer' }));
  expect(lastProps().visible[testLayer.id]).toBe(true);
});

// MAP-03
it('moves the Map date from the date dock', () => {
  render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(lastProps().mapDay).toBeLessThan(dayOf(new Date()));
});

// PIN-03
it('gives a layer the Map date for its row text, and again when the date moves', () => {
  const dated: Layer = {
    ...testLayer,
    description: day => `Shows day ${day}`,
  };

  render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={[dated]}
      sources={sources}
    />
  );
  // The row text is the description of the checkbox.
  const rowText = () =>
    document.getElementById(
      screen
        .getByRole('checkbox', { name: 'Test layer' })
        .getAttribute('aria-describedby')!
    )?.textContent;

  expect(rowText()).toBe(`Shows day ${dayOf(new Date())}`);
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(rowText()).toBe(`Shows day ${lastProps().mapDay}`);
  expect(lastProps().mapDay).toBeLessThan(dayOf(new Date()));
});

// PIN-03
it('shows what the page puts in the toast slot', () => {
  const { rerender } = render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
    />
  );

  expect(screen.queryByText('Your pins did not load.')).toBeNull();
  rerender(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
      toast={<p>Your pins did not load.</p>}
    />
  );
  expect(screen.getByText('Your pins did not load.').tagName).toBe('P');
});

// MAP-02
it('hides and restores the Polity borders from the Layers panel', () => {
  render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
    />
  );

  const row = screen.getByRole('checkbox', { name: /Polity borders/ });

  fireEvent.click(row);
  expect(lastProps().visible[polityLayer.id]).toBe(false);
  fireEvent.click(row);
  expect(lastProps().visible[polityLayer.id]).toBe(true);
});

it('opens and closes the sources dialog from the credits line', () => {
  render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
    />
  );

  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Attributions' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

// NFR-05, NFR-08
it('collapses the credits to one line on desktop', () => {
  render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
    />
  );

  expect(
    screen
      .getByRole('button', { name: 'Credits' })
      .getAttribute('aria-expanded')
  ).toBe('false');
});

// PIN-01
it('puts `action` in the action slot and `panel` in the place of the Layers panel', () => {
  const { container, rerender } = render(
    <MapShell
      {...account}
      action={<button type='button'>Add a pin</button>}
      coverage={coverage}
      layers={layers}
      panel={<p>The form panel</p>}
      sources={sources}
    />
  );

  expect(container.querySelector('[data-slot="action"]')?.textContent).toBe(
    'Add a pin'
  );
  expect(container.querySelector('[data-slot="panel"]')?.textContent).toBe(
    'The form panel'
  );

  rerender(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
    />
  );
  expect(container.querySelector('[data-slot="action"]')).toBeNull();
  expect(container.querySelector('[data-slot="panel"]')?.textContent).toContain(
    'Polities'
  );
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
  it('draws no panel, even when the caller gives one', () => {
    const { container } = render(
      <MapShell
        {...account}
        coverage={coverage}
        layers={layers}
        panel={<p>The form panel</p>}
        sources={sources}
      />
    );

    expect(container.querySelector('[data-slot="panel"]')).toBeNull();
  });

  // NFR-03
  it('puts the account menu in the search pill', () => {
    render(
      <MapShell
        {...account}
        coverage={coverage}
        layers={layers}
        sources={sources}
      />
    );

    expect(
      within(screen.getByRole('search')).getAllByRole('button', {
        name: 'Account menu',
      })
    ).toHaveLength(1);
  });

  // NFR-05
  it('draws the date sheet, the Layers button and the credits, and no panel or dock', () => {
    render(
      <MapShell
        {...account}
        coverage={coverage}
        layers={layers}
        sources={sources}
      />
    );

    expect(screen.getByRole('region', { name: 'Map date' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Layers and filters' })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Attributions' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Credits' })).toBeNull();
    expect(screen.queryByRole('complementary', { name: 'Layers' })).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(lastProps().padding).toEqual(freeArea(true));
  });

  // MAP-03
  it('expands the sheet to the slider, which moves the Map date', () => {
    render(
      <MapShell
        {...account}
        coverage={coverage}
        layers={layers}
        sources={sources}
      />
    );
    expect(screen.queryByRole('slider')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expand the sheet' }));

    const slider = screen.getByRole('slider', { name: 'Map date' });

    fireEvent.keyDown(slider, { key: 'ArrowLeft', shiftKey: true });
    expect(lastProps().mapDay).toBeLessThan(dayOf(new Date()));
  });

  // MAP-02
  it('opens Layers in a sheet, turns the Polities off and closes it', () => {
    render(
      <MapShell
        {...account}
        coverage={coverage}
        layers={layers}
        sources={sources}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Layers and filters' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Polity borders/ }));
    expect(lastProps().visible[polityLayer.id]).toBe(false);
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
  render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
    />
  );
  fireEvent.click(screen.getByRole('radio', { name: 'Day' }));
  typeDate('1995-06-15');
  expect(lastProps().mapDay).toBe(toDay('1995-06-15'));
  expect(
    (screen.getByRole('slider', { name: 'Map date' }) as HTMLInputElement).value
  ).toBe(String(toDay('1995-06-15')));
});

it('keeps an impossible day in the field and the map where it was', () => {
  render(
    <MapShell
      {...account}
      coverage={coverage}
      layers={layers}
      sources={sources}
    />
  );
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
    render(
      <MapShell
        {...account}
        coverage={spans}
        layers={layers}
        sources={sources}
      />
    );
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

// PIN-02
describe('the Pin popup', () => {
  const today = dayOf(new Date());
  const open = { id: 'p1', position: [18.4, -33.9] as [number, number] };
  const popup = vi.fn((form: string, place?: { x: number; y: number }) => (
    <div data-testid={`popup-${form}`}>
      {place ? `${place.x},${place.y}` : 'no place'}
    </div>
  ));
  const renderPin = (
    props: Partial<Parameters<typeof MapShell>[0]> = {},
    span = { validFrom: asDay(today - 100), validTo: null }
  ) =>
    render(
      <MapShell
        {...account}
        coverage={coverage}
        layers={layers}
        pin={{ open, popup, span }}
        sources={sources}
        {...props}
      />
    );

  beforeEach(() => {
    popup.mockClear();
  });

  it('gives the map the open Pin and reports a click on a Pin or on empty map', () => {
    const onClosePin = vi.fn();
    const onOpenPin = vi.fn();

    renderPin({ onClosePin, onOpenPin });
    expect(lastProps().open).toEqual(open);
    lastProps().onOpenPin('p2');
    expect(onOpenPin).toHaveBeenCalledWith('p2');
    lastProps().onEmptyClick();
    expect(onClosePin).toHaveBeenCalledOnce();
  });

  it('takes a click on a Pin when the page gives no handler', () => {
    renderPin();
    expect(() => lastProps().onOpenPin('p2')).not.toThrow();
  });

  it('places the popup at the point of the Pin on a desktop, once the map reports it', () => {
    renderPin();
    expect(screen.queryByTestId('popup-floating')).toBeNull();

    act(() => lastProps().onOpenPoint({ x: 400, y: 300 }));
    expect(screen.getByTestId('popup-floating').textContent).toBe('400,300');
    expect(screen.queryByTestId('popup-inline')).toBeNull();
    act(() => lastProps().onOpenPoint({ x: 410, y: 310 }));
    expect(screen.getByTestId('popup-floating').textContent).toBe('410,310');
    act(() => lastProps().onOpenPoint(null));
    expect(screen.queryByTestId('popup-floating')).toBeNull();
  });

  it('draws no popup and no map open Pin when no Pin is open', () => {
    renderPin({ pin: undefined });
    expect(lastProps().open).toBeUndefined();
    expect(popup).not.toHaveBeenCalled();
  });

  it('closes the popup on Esc', () => {
    const onClosePin = vi.fn();

    renderPin({ onClosePin });
    fireEvent.keyDown(document, { key: 'a' });
    expect(onClosePin).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClosePin).toHaveBeenCalledOnce();
  });

  it('keeps the popup when a dialog owns the Esc', () => {
    const onClosePin = vi.fn();

    renderPin({ onClosePin });
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
    fireEvent.click(
      screen.getByRole('menuitem', { name: 'Sources and attributions' })
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClosePin).not.toHaveBeenCalled();
  });

  it('keeps the popup when another handler prevented the Esc', () => {
    const onClosePin = vi.fn();
    const press = createEvent.keyDown(document, { key: 'Escape' });

    renderPin({ onClosePin });
    press.preventDefault();
    fireEvent(document, press);
    expect(onClosePin).not.toHaveBeenCalled();
  });

  it('listens for Esc only while a Pin is open', () => {
    const onClosePin = vi.fn();

    renderPin({ onClosePin, pin: undefined });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClosePin).not.toHaveBeenCalled();
  });

  it('closes the popup when the Map date hides its Pin, and not before', () => {
    const onClosePin = vi.fn();

    renderPin({ onClosePin });
    expect(onClosePin).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onClosePin).toHaveBeenCalledOnce();
  });

  it('keeps the popup while the Map date still shows its Pin', () => {
    const onClosePin = vi.fn();

    renderPin({ onClosePin }, { validFrom: asDay(0), validTo: null });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onClosePin).not.toHaveBeenCalled();
  });

  it('closes the popup when the Pins row is switched off, and for no other row', () => {
    const onClosePin = vi.fn();
    const pins = { ...testLayer, id: PINS_LAYER_ID, label: 'Pins' };

    renderPin({ layers: [polityLayer, testLayer, pins], onClosePin });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Test layer' }));
    expect(onClosePin).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pins' }));
    expect(onClosePin).toHaveBeenCalledOnce();
  });

  // NFR-05
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

    it('puts the details in the date sheet, and floats none', () => {
      renderPin();

      expect(
        within(screen.getByRole('region', { name: 'Map date' })).getByTestId(
          'popup-inline'
        ).textContent
      ).toBe('no place');
      act(() => lastProps().onOpenPoint({ x: 400, y: 300 }));
      expect(screen.queryByTestId('popup-floating')).toBeNull();
      expect(popup).toHaveBeenCalledWith('inline');
    });

    it('expands the sheet when a Pin opens, and keeps it expanded after a close', () => {
      const onOpenPin = vi.fn();
      const { rerender } = renderPin({ onOpenPin, pin: undefined });
      const grabber = () =>
        screen.getByRole('button', { name: 'Expand the sheet' });

      expect(grabber().getAttribute('aria-expanded')).toBe('false');
      act(() => lastProps().onOpenPin('p1'));
      expect(onOpenPin).toHaveBeenCalledWith('p1');
      expect(grabber().getAttribute('aria-expanded')).toBe('true');
      rerender(
        <MapShell
          {...account}
          coverage={coverage}
          layers={layers}
          onOpenPin={onOpenPin}
          sources={sources}
        />
      );
      expect(grabber().getAttribute('aria-expanded')).toBe('true');
    });

    it('leaves the sheet as it was with no Pin open', () => {
      renderPin({ pin: undefined });
      expect(screen.queryByTestId('popup-inline')).toBeNull();
      expect(
        screen
          .getByRole('button', { name: 'Expand the sheet' })
          .getAttribute('aria-expanded')
      ).toBe('false');
    });
  });
});
