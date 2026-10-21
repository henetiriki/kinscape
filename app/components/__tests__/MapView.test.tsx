import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildStyle, POLITY_LAYERS, polityFilters } from '@/lib/map/style';

const maplibre = vi.hoisted(() => {
  const map = {
    addControl: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
    off: vi.fn(),
    once: vi.fn(),
    remove: vi.fn(),
    setFilter: vi.fn(),
    setLayoutProperty: vi.fn(),
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

import { FIRST_VIEW, MapView, MAX_BOUNDS } from '../MapView';

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
    const { container } = render(<MapView mapDay={5} showPolities />);

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
    render(<MapView mapDay={5} showPolities={false} />);

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

  it('adds the navigation and scale controls', () => {
    render(<MapView mapDay={5} showPolities />);

    expect(maplibre.map.addControl).toHaveBeenCalledTimes(2);
    expect(maplibre.NavigationControl).toHaveBeenCalledOnce();
    expect(maplibre.ScaleControl).toHaveBeenCalledOnce();
  });

  it('shows all the polity layers together', () => {
    render(<MapView mapDay={5} showPolities />);

    expect(maplibre.map.setLayoutProperty.mock.calls).toEqual(
      POLITY_LAYERS.map(id => [id, 'visibility', 'visible'])
    );
  });

  it('hides all the polity layers together, then restores them', () => {
    const { rerender } = render(<MapView mapDay={5} showPolities={false} />);

    expect(maplibre.map.setLayoutProperty.mock.calls).toEqual(
      POLITY_LAYERS.map(id => [id, 'visibility', 'none'])
    );

    maplibre.map.setLayoutProperty.mockClear();
    rerender(<MapView mapDay={5} showPolities />);

    expect(maplibre.map.setLayoutProperty.mock.calls).toEqual(
      POLITY_LAYERS.map(id => [id, 'visibility', 'visible'])
    );
  });

  it('refilters every polity layer when the Map date changes', () => {
    const { rerender } = render(<MapView mapDay={5} showPolities />);

    maplibre.map.setFilter.mockClear();
    rerender(<MapView mapDay={9} showPolities />);

    expect(maplibre.map.setFilter.mock.calls).toEqual(
      POLITY_LAYERS.map(id => [id, polityFilters(9)[id]])
    );
  });

  it('waits for the style to load before changing layers', () => {
    maplibre.map.isStyleLoaded.mockReturnValue(false);

    const { unmount } = render(<MapView mapDay={5} showPolities />);

    expect(maplibre.map.setFilter).not.toHaveBeenCalled();
    expect(maplibre.map.once).toHaveBeenCalledWith(
      'load',
      expect.any(Function)
    );

    const [, apply] = maplibre.map.once.mock.calls[0];

    apply();
    expect(maplibre.map.setFilter).toHaveBeenCalledTimes(POLITY_LAYERS.length);

    unmount();
    expect(maplibre.map.off).toHaveBeenCalledWith('load', apply);
  });

  // NFR-01
  it('times each Map date change until the map is idle', () => {
    const measure = vi.spyOn(performance, 'measure');

    render(<MapView mapDay={5} showPolities />);

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
    const { unmount } = render(<MapView mapDay={5} showPolities />);

    expect('kinscapeMap' in window).toBe(false);
    unmount();

    vi.stubEnv('NEXT_PUBLIC_E2E', '1');
    render(<MapView mapDay={5} showPolities />);
    expect('kinscapeMap' in window).toBe(true);
    vi.unstubAllEnvs();
    delete (window as unknown as { kinscapeMap?: unknown }).kinscapeMap;
  });

  it('removes the map on unmount', () => {
    const { unmount } = render(<MapView mapDay={5} showPolities />);

    expect(maplibre.map.remove).not.toHaveBeenCalled();
    unmount();
    expect(maplibre.map.remove).toHaveBeenCalledOnce();
  });
});
