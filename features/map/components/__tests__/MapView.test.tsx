import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { buildStyle } from '@ks/features/map/style';

import { POLITY_LAYERS, polityFilters } from '@ks/features/map/style';

const maplibre = vi.hoisted(() => {
  const map = {
    addControl: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
    off: vi.fn(),
    once: vi.fn(),
    remove: vi.fn(),
    setFilter: vi.fn(),
    setLayoutProperty: vi.fn(),
    setPadding: vi.fn(),
  };

  return {
    Map: vi.fn(
      class {
        addControl = map.addControl;
        isStyleLoaded = map.isStyleLoaded;
        off = map.off;
        once = map.once;
        remove = map.remove;
        setFilter = map.setFilter;
        setLayoutProperty = map.setLayoutProperty;
        setPadding = map.setPadding;
      }
    ),
    map,
    NavigationControl: vi.fn(),
    ScaleControl: vi.fn(),
    setWorkerUrl: vi.fn(),
  };
});

vi.mock('maplibre-gl', () => maplibre);
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

import { freeArea } from '@ks/app/components/map/Stage';
import {
  FIRST_VIEW,
  MapView,
  MAX_BOUNDS,
} from '@ks/features/map/components/MapView';

const padding = freeArea(false);

// Recorded at import time, before any test can clear the mock.
const [workerUrl] = maplibre.setWorkerUrl.mock.calls[0];

describe('MapView', () => {
  beforeEach(() => {
    for (const fn of Object.values(maplibre.map)) fn.mockClear();
    maplibre.Map.mockClear();
    maplibre.map.isStyleLoaded.mockReturnValue(true);
  });

  it('points MapLibre at its worker file', () => {
    expect(workerUrl).toContain('maplibre-gl-worker.mjs');
  });

  it('opens on South Africa, Lesotho and eSwatini and keeps panning bounded', () => {
    const { container } = render(
      <MapView mapDay={5} padding={padding} showPolities />
    );

    expect(maplibre.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        attributionControl: false,
        bounds: FIRST_VIEW,
        container: container.querySelector('.map'),
        maxBounds: MAX_BOUNDS,
        maxZoom: 10,
        minZoom: 3,
      })
    );
    // The first view sits inside the bounds the user can pan within.
    expect(FIRST_VIEW[0][0]).toBeGreaterThan(MAX_BOUNDS[0][0]);
    expect(FIRST_VIEW[0][1]).toBeGreaterThan(MAX_BOUNDS[0][1]);
    expect(FIRST_VIEW[1][0]).toBeLessThan(MAX_BOUNDS[1][0]);
    expect(FIRST_VIEW[1][1]).toBeLessThan(MAX_BOUNDS[1][1]);
  });

  it('builds the style for the Map date and layer state it first renders with', () => {
    render(<MapView mapDay={5} padding={padding} showPolities={false} />);

    const [[options]] = maplibre.Map.mock.calls as unknown as [
      [{ style: ReturnType<typeof buildStyle> }],
    ];

    expect(options.style.sources.polities).toBeDefined();
    expect(
      options.style.layers.find(layer => layer.id === 'polity-fills')
    ).toMatchObject({
      filter: polityFilters(5)['polity-fills'],
      layout: { visibility: 'none' },
    });
  });

  // NFR-05
  it('fits the first view into the free area of the screen it is on', () => {
    render(<MapView mapDay={5} padding={padding} showPolities />);

    expect(maplibre.Map).toHaveBeenCalledWith(
      expect.objectContaining({ fitBoundsOptions: { padding } })
    );

    const query = window.matchMedia;

    window.matchMedia = (() => ({
      matches: true,
    })) as unknown as typeof window.matchMedia;
    maplibre.Map.mockClear();
    render(<MapView mapDay={5} padding={freeArea(true)} showPolities />);
    window.matchMedia = query;

    expect(maplibre.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        fitBoundsOptions: { padding: freeArea(true) },
      })
    );
  });

  it('moves the padding when the free area changes', () => {
    const { rerender } = render(
      <MapView mapDay={5} padding={padding} showPolities />
    );

    expect(maplibre.map.setPadding).toHaveBeenLastCalledWith(padding);
    rerender(<MapView mapDay={5} padding={freeArea(true)} showPolities />);
    expect(maplibre.map.setPadding).toHaveBeenLastCalledWith(freeArea(true));
  });

  it('adds the navigation and scale controls', () => {
    render(<MapView mapDay={5} padding={padding} showPolities />);

    expect(maplibre.map.addControl).toHaveBeenCalledTimes(2);
    expect(maplibre.NavigationControl).toHaveBeenCalledOnce();
    expect(maplibre.ScaleControl).toHaveBeenCalledOnce();
  });

  it('shows all the polity layers together', () => {
    render(<MapView mapDay={5} padding={padding} showPolities />);

    expect(maplibre.map.setLayoutProperty.mock.calls).toEqual(
      POLITY_LAYERS.map(id => [id, 'visibility', 'visible'])
    );
  });

  it('hides all the polity layers together, then restores them', () => {
    const { rerender } = render(
      <MapView mapDay={5} padding={padding} showPolities={false} />
    );

    expect(maplibre.map.setLayoutProperty.mock.calls).toEqual(
      POLITY_LAYERS.map(id => [id, 'visibility', 'none'])
    );

    maplibre.map.setLayoutProperty.mockClear();
    rerender(<MapView mapDay={5} padding={padding} showPolities />);

    expect(maplibre.map.setLayoutProperty.mock.calls).toEqual(
      POLITY_LAYERS.map(id => [id, 'visibility', 'visible'])
    );
  });

  it('refilters every polity layer when the Map date changes', () => {
    const { rerender } = render(
      <MapView mapDay={5} padding={padding} showPolities />
    );

    maplibre.map.setFilter.mockClear();
    rerender(<MapView mapDay={9} padding={padding} showPolities />);

    expect(maplibre.map.setFilter.mock.calls).toEqual(
      POLITY_LAYERS.map(id => [id, polityFilters(9)[id]])
    );
  });

  it('waits for the style to load before changing layers', () => {
    maplibre.map.isStyleLoaded.mockReturnValue(false);

    const { unmount } = render(
      <MapView mapDay={5} padding={padding} showPolities />
    );

    expect(maplibre.map.setFilter).not.toHaveBeenCalled();
    expect(maplibre.map.once).toHaveBeenCalledWith(
      'load',
      expect.any(Function)
    );

    // The first `load` listener marks the map loaded; the last applies the Map date.
    const [, apply] = maplibre.map.once.mock.calls.findLast(
      ([event]) => event === 'load'
    )!;

    apply();
    expect(maplibre.map.setFilter).toHaveBeenCalledTimes(POLITY_LAYERS.length);

    unmount();
    expect(maplibre.map.off).toHaveBeenCalledWith('load', apply);
  });

  // MAP-04: setFilter makes isStyleLoaded() false until the tiles reload, and `load` never fires again.
  it('applies a Map date change while tiles reload after the first load', () => {
    maplibre.map.isStyleLoaded.mockReturnValue(false);

    const { rerender } = render(
      <MapView mapDay={5} padding={padding} showPolities />
    );

    for (const [event, onLoad] of maplibre.map.once.mock.calls) {
      if (event === 'load') onLoad();
    }

    maplibre.map.setFilter.mockClear();
    rerender(<MapView mapDay={9} padding={padding} showPolities />);

    expect(maplibre.map.setFilter.mock.calls).toEqual(
      POLITY_LAYERS.map(id => [id, polityFilters(9)[id]])
    );
  });

  // NFR-01
  it('times each Map date change until the map is idle', () => {
    const measure = vi.spyOn(performance, 'measure');

    render(<MapView mapDay={5} padding={padding} showPolities />);

    expect(maplibre.map.once).toHaveBeenCalledWith(
      'idle',
      expect.any(Function)
    );
    expect(measure).not.toHaveBeenCalled();

    const [, onIdle] = maplibre.map.once.mock.calls.find(
      ([event]) => event === 'idle'
    )!;

    onIdle();
    expect(measure).toHaveBeenCalledWith('map-date-redraw', 'map-date-change');
    measure.mockRestore();
  });

  it('puts the map on window only in browser-test builds', () => {
    const { unmount } = render(
      <MapView mapDay={5} padding={padding} showPolities />
    );

    expect('kinscapeMap' in window).toBe(false);
    unmount();

    vi.stubEnv('NEXT_PUBLIC_E2E', '1');
    render(<MapView mapDay={5} padding={padding} showPolities />);
    expect('kinscapeMap' in window).toBe(true);
    vi.unstubAllEnvs();
    delete (window as unknown as { kinscapeMap?: unknown }).kinscapeMap;
  });

  it('removes the map on unmount', () => {
    const { unmount } = render(
      <MapView mapDay={5} padding={padding} showPolities />
    );

    expect(maplibre.map.remove).not.toHaveBeenCalled();
    unmount();
    expect(maplibre.map.remove).toHaveBeenCalledOnce();
  });
});
