import { fireEvent, render, within } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { buildStyle } from '@ks/features/map/style';
import type { Layer, MapHandle } from '@ks/features/map/types';

import { testLayer } from '@ks/features/map/__tests__/test-layer';
import { polityLayer } from '@ks/features/map/layers/polities';

const maplibre = vi.hoisted(() => {
  const source = { setData: vi.fn() };
  const map = {
    addControl: vi.fn(),
    addImage: vi.fn(),
    fitBounds: vi.fn(),
    getMinZoom: vi.fn(() => 3),
    getSource: vi.fn(() => source),
    getZoom: vi.fn(() => 5),
    isStyleLoaded: vi.fn(() => true),
    off: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    project: vi.fn(() => ({ x: 0, y: 0 })),
    queryRenderedFeatures: vi.fn(() => [] as unknown[]),
    remove: vi.fn(),
    setFilter: vi.fn(),
    setLayoutProperty: vi.fn(),
    setMinZoom: vi.fn(),
    setMissingStyleImageResolver: vi.fn(),
    setPadding: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  };

  const markers: {
    element: HTMLElement;
    lngLat?: [number, number];
    remove: ReturnType<typeof vi.fn<() => void>>;
  }[] = [];

  return {
    Map: vi.fn(
      class {
        addControl = map.addControl;
        addImage = map.addImage;
        fitBounds = map.fitBounds;
        getMinZoom = map.getMinZoom;
        getSource = map.getSource;
        getZoom = map.getZoom;
        isStyleLoaded = map.isStyleLoaded;
        off = map.off;
        on = map.on;
        once = map.once;
        project = map.project;
        queryRenderedFeatures = map.queryRenderedFeatures;
        remove = map.remove;
        setFilter = map.setFilter;
        setLayoutProperty = map.setLayoutProperty;
        setMinZoom = map.setMinZoom;
        setMissingStyleImageResolver = map.setMissingStyleImageResolver;
        setPadding = map.setPadding;
        zoomIn = map.zoomIn;
        zoomOut = map.zoomOut;
      }
    ),
    map,
    Marker: vi.fn(
      class {
        element: HTMLElement;
        entry: (typeof markers)[number];

        // eslint-disable-next-line no-restricted-syntax -- MapLibre news a Marker, so the fake is a class with a constructor
        constructor({ element }: { element: HTMLElement }) {
          this.element = element;
          this.entry = { element, remove: vi.fn<() => void>() };
          markers.push(this.entry);
        }

        addTo = () => this;
        getElement = () => this.element;
        remove = () => this.entry.remove();
        setLngLat = (lngLat: [number, number]) => {
          this.entry.lngLat = lngLat;

          return this;
        };
      }
    ),
    markers,
    ScaleControl: vi.fn(),
    setWorkerUrl: vi.fn(),
    source,
  };
});

vi.mock('maplibre-gl', () => maplibre);
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));
vi.mock('@ks/features/map/icons', () => ({
  iconImage: vi.fn((path: string, ratio: number) => ({
    data: new Uint8ClampedArray(4),
    height: ratio,
    width: path.length,
  })),
}));

import { freeArea } from '@ks/app/components/layout/MapLayout';
import { MapView, MAX_BOUNDS } from '@ks/features/map/components/MapView';
import { iconImage } from '@ks/features/map/icons';
import { asDay } from '@ks/lib/domain/boundaries/model.mts';
import { FIRST_VIEW } from '@ks/lib/domain/map/view.mts';
import { coverZoom } from '@ks/lib/domain/map/zoom.mts';

const FIVE = asDay(5);
const NINE = asDay(9);
const padding = freeArea(false);
const layers = [polityLayer];
const POLITY_IDS = [
  'polity-fills',
  'polity-borders',
  'polity-borders-low',
  'polity-labels',
];

const on = {};
const off = { [polityLayer.id]: false };
const TEST_IDS = testLayer.layers.map(layer => layer.id);

// Recorded at import time, before any test can clear the mock.
const [workerUrl] = maplibre.setWorkerUrl.mock.calls[0];

describe('MapView', () => {
  beforeEach(() => {
    for (const fn of Object.values(maplibre.map)) fn.mockClear();
    maplibre.source.setData.mockClear();
    maplibre.Map.mockClear();
    maplibre.map.isStyleLoaded.mockReturnValue(true);
  });

  it('points MapLibre at its worker file', () => {
    expect(workerUrl).toContain('maplibre-gl-worker.mjs');
  });

  it('opens on South Africa, Lesotho and eSwatini and keeps panning bounded', () => {
    const { container } = render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    expect(maplibre.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        attributionControl: false,
        bounds: FIRST_VIEW,
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the MapLibre container is a div with no role
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
    render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={off} />
    );

    const [[options]] = maplibre.Map.mock.calls as unknown as [
      [{ style: ReturnType<typeof buildStyle> }],
    ];

    expect(options.style.sources.polities).toBeDefined();
    expect(
      options.style.layers.find(layer => layer.id === 'polity-fills')
    ).toMatchObject({
      filter: polityLayer.filters(FIVE)['polity-fills'],
      layout: { visibility: 'none' },
    });
  });

  // NFR-05
  it('fits the first view into the free area of the screen it is on', () => {
    render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    expect(maplibre.Map).toHaveBeenCalledWith(
      expect.objectContaining({ fitBoundsOptions: { padding } })
    );

    const query = window.matchMedia;

    window.matchMedia = (() => ({
      matches: true,
    })) as unknown as typeof window.matchMedia;
    maplibre.Map.mockClear();
    render(
      <MapView
        layers={layers}
        mapDay={FIVE}
        padding={freeArea(true)}
        visible={on}
      />
    );
    window.matchMedia = query;

    expect(maplibre.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        fitBoundsOptions: { padding: freeArea(true) },
      })
    );
  });

  it('moves the padding when the free area changes', () => {
    const { rerender } = render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    expect(maplibre.map.setPadding).toHaveBeenLastCalledWith(padding);
    rerender(
      <MapView
        layers={layers}
        mapDay={FIVE}
        padding={freeArea(true)}
        visible={on}
      />
    );
    expect(maplibre.map.setPadding).toHaveBeenLastCalledWith(freeArea(true));
  });

  it('adds only the scale control: the zoom card replaces the navigation control', () => {
    render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    expect(maplibre.map.addControl).toHaveBeenCalledOnce();
    expect(maplibre.ScaleControl).toHaveBeenCalledOnce();
  });

  // MAP-01
  it('drives the map through its handle', () => {
    const handle = createRef<MapHandle>();

    render(
      <MapView
        handle={handle}
        layers={layers}
        mapDay={FIVE}
        padding={padding}
        visible={on}
      />
    );
    handle.current!.zoomIn();
    handle.current!.zoomOut();
    handle.current!.fit();

    expect(maplibre.map.zoomIn).toHaveBeenCalledOnce();
    expect(maplibre.map.zoomOut).toHaveBeenCalledOnce();
    expect(maplibre.map.fitBounds).toHaveBeenCalledWith(FIRST_VIEW);
  });

  // MAP-01
  it('reports whether the zoom is at a limit after each zoom and resize', () => {
    const onZoomLimits = vi.fn();

    render(
      <MapView
        layers={layers}
        mapDay={FIVE}
        onZoomLimits={onZoomLimits}
        padding={padding}
        visible={on}
      />
    );

    const events = maplibre.map.on.mock.calls.map(([event]) => event);

    expect(events).toEqual(['zoomend', 'resize', 'click']);

    const [, report] = maplibre.map.on.mock.calls[0];

    report();
    expect(onZoomLimits).toHaveBeenLastCalledWith({
      atMax: false,
      atMin: false,
    });
    maplibre.map.getZoom.mockReturnValue(3);
    report();
    expect(onZoomLimits).toHaveBeenLastCalledWith({
      atMax: false,
      atMin: true,
    });
    maplibre.map.getZoom.mockReturnValue(10);
    report();
    expect(onZoomLimits).toHaveBeenLastCalledWith({
      atMax: true,
      atMin: false,
    });
    maplibre.map.getZoom.mockReturnValue(5);
  });

  // MAP-01
  it('keeps MIN_ZOOM as the minimum when the window is too small to need more', () => {
    render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    const [, report] = maplibre.map.on.mock.calls[0];

    report();
    expect(maplibre.map.setMinZoom).toHaveBeenLastCalledWith(3);
  });

  // MAP-01
  it('raises the minimum zoom to the cover zoom of a large window', () => {
    const size = vi
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockReturnValue(1440);
    const height = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(900);

    render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    const [, report] = maplibre.map.on.mock.calls[0];

    report();
    expect(maplibre.map.setMinZoom).toHaveBeenLastCalledWith(
      coverZoom(MAX_BOUNDS, 1440, 900)
    );
    expect(coverZoom(MAX_BOUNDS, 1440, 900)).toBeGreaterThan(3);
    size.mockRestore();
    height.mockRestore();
  });

  it('shows all the polity layers together', () => {
    render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    expect(maplibre.map.setLayoutProperty.mock.calls).toEqual(
      POLITY_IDS.map(id => [id, 'visibility', 'visible'])
    );
  });

  it('hides all the polity layers together, then restores them', () => {
    const { rerender } = render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={off} />
    );

    expect(maplibre.map.setLayoutProperty.mock.calls).toEqual(
      POLITY_IDS.map(id => [id, 'visibility', 'none'])
    );

    maplibre.map.setLayoutProperty.mockClear();
    rerender(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    expect(maplibre.map.setLayoutProperty.mock.calls).toEqual(
      POLITY_IDS.map(id => [id, 'visibility', 'visible'])
    );
  });

  it('refilters every polity layer when the Map date changes', () => {
    const { rerender } = render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    maplibre.map.setFilter.mockClear();
    rerender(
      <MapView layers={layers} mapDay={NINE} padding={padding} visible={on} />
    );

    expect(maplibre.map.setFilter.mock.calls).toEqual(
      POLITY_IDS.map(id => [id, polityLayer.filters(NINE)[id]])
    );
  });

  // AR.12: a layer's filters apply without MapView naming it.
  it('applies the filters of any layer it is given when the Map date changes', () => {
    const filter = (day: number) => ['==', ['literal', day], 9];
    const test: Layer = {
      description: 'd',
      filters: day => ({ 'test-fills': filter(day) as never }),
      id: 'test',
      label: 'Test',
      layers: [{ id: 'test-fills', source: 'test', type: 'fill' }],
      sources: { test: { data: '/test.geojson', type: 'geojson' } },
    };
    const { rerender } = render(
      <MapView layers={[test]} mapDay={FIVE} padding={padding} visible={on} />
    );

    maplibre.map.setFilter.mockClear();
    rerender(
      <MapView layers={[test]} mapDay={NINE} padding={padding} visible={on} />
    );

    expect(maplibre.map.setFilter.mock.calls).toEqual([
      ['test-fills', filter(9)],
    ]);
  });

  it('shows and hides a drawing layer that has no filter, and clears any earlier one', () => {
    const bare: Layer = {
      description: 'd',
      filters: () => ({}),
      id: 'bare',
      label: 'Bare',
      layers: [{ id: 'bare-fills', source: 'bare', type: 'fill' }],
      sources: { bare: { data: '/bare.geojson', type: 'geojson' } },
    };

    render(
      <MapView
        layers={[bare]}
        mapDay={FIVE}
        padding={padding}
        visible={{ bare: false }}
      />
    );

    expect(maplibre.map.setFilter.mock.calls).toEqual([['bare-fills', null]]);
    expect(maplibre.map.setLayoutProperty).toHaveBeenCalledWith(
      'bare-fills',
      'visibility',
      'none'
    );
  });

  describe('Pins', () => {
    const picking: Layer = {
      description: 'd',
      filters: (day, open) => ({
        'pick-ring': ['==', ['literal', `${day}:${open}`], 'x'] as never,
      }),
      id: 'pick',
      label: 'Pick',
      layers: [
        { id: 'pick-ring', source: 'pick', type: 'circle' },
        { id: 'pick-symbols', source: 'pick', type: 'symbol' },
      ],
      select: ['pick-symbols'],
      sources: { pick: { data: '/pick.geojson', type: 'geojson' } },
    };
    const handler = (event: string) =>
      maplibre.map.on.mock.calls.find(([name]) => name === event)![1];
    const view = (props: Partial<Parameters<typeof MapView>[0]> = {}) =>
      render(
        <MapView
          layers={[picking]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
          {...props}
        />
      );

    describe('markers', () => {
      // A marker for each day up to 9, at a point that moves with the day; day 9 has none.
      const marking: Layer = {
        ...picking,
        markers: (day, open, onOpen) =>
          day >= NINE
            ? []
            : [
                {
                  key: 'farm',
                  node: (
                    <button onClick={() => onOpen('p2')} type='button'>
                      {`Farm on ${day}, open ${open}`}
                    </button>
                  ),
                  position: [26.1, -29.1],
                },
              ],
      };

      beforeEach(() => {
        maplibre.markers.length = 0;
        maplibre.Marker.mockClear();
      });

      // PIN-06
      it('places each marker of a layer at its point and draws its node there', () => {
        view({ layers: [marking], open: { id: 'p1', position: [0, 0] } });

        expect(maplibre.markers).toHaveLength(1);
        expect(maplibre.markers[0].lngLat).toEqual([26.1, -29.1]);
        expect(maplibre.markers[0].element.textContent).toBe(
          `Farm on ${FIVE}, open p1`
        );
      });

      it('keeps a marker from day to day, and removes it when the day has none', () => {
        const { rerender } = view({ layers: [marking] });
        const at = (mapDay: typeof FIVE) => (
          <MapView
            layers={[marking]}
            mapDay={mapDay}
            padding={padding}
            visible={on}
          />
        );

        rerender(at(asDay(6)));
        expect(maplibre.Marker).toHaveBeenCalledOnce();
        expect(maplibre.markers[0].element.textContent).toBe(
          'Farm on 6, open undefined'
        );

        rerender(at(NINE));
        expect(maplibre.markers[0].remove).toHaveBeenCalledOnce();
      });

      it('places no marker of a layer that is switched off', () => {
        view({ layers: [marking], visible: { [picking.id]: false } });

        expect(maplibre.markers).toHaveLength(0);
      });

      // PIN-02
      it('opens the Pin a marker asks for', () => {
        const onOpenPin = vi.fn();

        view({ layers: [marking], onOpenPin });
        fireEvent.click(
          within(maplibre.markers[0].element).getByRole('button')
        );

        expect(onOpenPin).toHaveBeenCalledExactlyOnceWith('p2');
      });

      // PIN-06: a fold removes the clicked Pin, so the map must not read the click as one on empty map.
      it('keeps the clicks of a marker from the map, and lets its presses and touches bubble', () => {
        view({ layers: [marking] });

        const { element } = maplibre.markers[0];
        const parent = document.createElement('div');
        const heard: string[] = [];

        parent.append(element);

        for (const type of [
          'click',
          'dblclick',
          'mousedown',
          'touchstart',
          'touchend',
          'pointerdown',
        ]) {
          parent.addEventListener(type, () => heard.push(type));
          element.dispatchEvent(new Event(type, { bubbles: true }));
        }

        expect(heard).toEqual([
          'mousedown',
          'touchstart',
          'touchend',
          'pointerdown',
        ]);
      });
    });

    // PIN-02
    it('reports the id of the Pin under a click', () => {
      const onOpenPin = vi.fn();
      const onEmptyClick = vi.fn();

      view({ onEmptyClick, onOpenPin });
      maplibre.map.queryRenderedFeatures.mockReturnValueOnce([
        { properties: { id: 'p1' } },
      ]);
      handler('click')({
        originalEvent: { target: document.body },
        point: { x: 3, y: 4 },
      });

      expect(maplibre.map.queryRenderedFeatures).toHaveBeenCalledWith(
        { x: 3, y: 4 },
        { layers: ['pick-symbols'] }
      );
      expect(onOpenPin).toHaveBeenCalledWith('p1');
      expect(onEmptyClick).not.toHaveBeenCalled();
    });

    it('reports a click on empty map, and ignores a click when nothing listens', () => {
      const onEmptyClick = vi.fn();
      const { rerender } = view({ onEmptyClick });

      handler('click')({
        originalEvent: { target: document.body },
        point: { x: 1, y: 1 },
      });
      expect(onEmptyClick).toHaveBeenCalledOnce();

      maplibre.map.queryRenderedFeatures.mockReturnValueOnce([
        { properties: { id: 'p1' } },
      ]);
      expect(() =>
        handler('click')({
          originalEvent: { target: document.body },
          point: { x: 1, y: 1 },
        })
      ).not.toThrow();
      rerender(
        <MapView
          layers={[picking]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
        />
      );
      expect(() =>
        handler('click')({
          originalEvent: { target: document.body },
          point: { x: 1, y: 1 },
        })
      ).not.toThrow();
    });

    it('asks no layer when no layer can be picked', () => {
      view({ layers });
      handler('click')({
        originalEvent: { target: document.body },
        point: { x: 1, y: 1 },
      });

      expect(maplibre.map.queryRenderedFeatures).not.toHaveBeenCalled();
    });

    // PIN-02: the popup stays at its Pin
    it('reports the pixel point of the open Pin now and after each move, then none', () => {
      const onOpenPoint = vi.fn();
      const open = { id: 'p1', position: [18.4, -33.9] as [number, number] };

      maplibre.map.project.mockReturnValue({ x: 10, y: 20 });

      const { rerender } = view({ onOpenPoint, open });

      expect(maplibre.map.project).toHaveBeenCalledWith([18.4, -33.9]);
      expect(onOpenPoint).toHaveBeenLastCalledWith({ x: 10, y: 20 });

      maplibre.map.project.mockReturnValue({ x: 30, y: 40 });
      handler('move')();
      expect(onOpenPoint).toHaveBeenLastCalledWith({ x: 30, y: 40 });

      rerender(
        <MapView
          layers={[picking]}
          mapDay={FIVE}
          onOpenPoint={onOpenPoint}
          padding={padding}
          visible={on}
        />
      );
      expect(maplibre.map.off).toHaveBeenCalledWith(
        'move',
        expect.any(Function)
      );
      expect(onOpenPoint).toHaveBeenLastCalledWith(null);
      maplibre.map.project.mockReturnValue({ x: 0, y: 0 });
    });

    // PIN-02
    it('gives the open Pin to the filters, so the ring follows it', () => {
      const { rerender } = view({
        open: { id: 'p1', position: [18.4, -33.9] },
      });

      expect(maplibre.map.setFilter).toHaveBeenCalledWith('pick-ring', [
        '==',
        ['literal', `${FIVE}:p1`],
        'x',
      ]);

      maplibre.map.setFilter.mockClear();
      rerender(
        <MapView
          layers={[picking]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
        />
      );
      expect(maplibre.map.setFilter).toHaveBeenCalledWith('pick-ring', [
        '==',
        ['literal', `${FIVE}:undefined`],
        'x',
      ]);
    });
  });

  // MAP-05
  it('hides only the layer that is switched off', () => {
    const both = [polityLayer, testLayer];
    const { rerender } = render(
      <MapView
        layers={both}
        mapDay={FIVE}
        padding={padding}
        visible={{ [polityLayer.id]: false }}
      />
    );

    expect(maplibre.map.setLayoutProperty.mock.calls).toEqual([
      ...POLITY_IDS.map(id => [id, 'visibility', 'none']),
      ...TEST_IDS.map(id => [id, 'visibility', 'visible']),
    ]);

    maplibre.map.setLayoutProperty.mockClear();
    rerender(
      <MapView
        layers={both}
        mapDay={FIVE}
        padding={padding}
        visible={{ [testLayer.id]: false }}
      />
    );

    expect(maplibre.map.setLayoutProperty.mock.calls).toEqual([
      ...POLITY_IDS.map(id => [id, 'visibility', 'visible']),
      ...TEST_IDS.map(id => [id, 'visibility', 'none']),
    ]);
  });

  it('waits for the style to load before changing layers', () => {
    maplibre.map.isStyleLoaded.mockReturnValue(false);

    const { unmount } = render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
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
    expect(maplibre.map.setFilter).toHaveBeenCalledTimes(POLITY_IDS.length);

    unmount();
    expect(maplibre.map.off).toHaveBeenCalledWith('load', apply);
  });

  // MAP-04: setFilter makes isStyleLoaded() false until the tiles reload, and `load` never fires again.
  it('applies a Map date change while tiles reload after the first load', () => {
    maplibre.map.isStyleLoaded.mockReturnValue(false);

    const { rerender } = render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    for (const [event, onLoad] of maplibre.map.once.mock.calls) {
      if (event === 'load') onLoad();
    }

    maplibre.map.setFilter.mockClear();
    rerender(
      <MapView layers={layers} mapDay={NINE} padding={padding} visible={on} />
    );

    expect(maplibre.map.setFilter.mock.calls).toEqual(
      POLITY_IDS.map(id => [id, polityLayer.filters(NINE)[id]])
    );
  });

  // NFR-01
  it('times each Map date change until the map is idle', () => {
    const measure = vi.spyOn(performance, 'measure');

    render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

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

  // NFR-01, PIN-02
  it('marks a Map date change, and not an open Pin or a layer toggle', () => {
    const mark = vi.spyOn(performance, 'mark');
    const open = { id: 'p1', position: [18.4, -33.9] as [number, number] };
    const view = (day: number, extra = {}, visible = on) => (
      <MapView
        layers={layers}
        mapDay={day as typeof FIVE}
        padding={padding}
        visible={visible}
        {...extra}
      />
    );
    const { rerender } = render(view(FIVE));
    const first = mark.mock.calls.length;

    expect(first).toBeGreaterThan(0);
    rerender(view(FIVE, { open }));
    rerender(view(FIVE, { open }, { ...on, [polityLayer.id]: false }));
    rerender(view(FIVE));
    expect(mark).toHaveBeenCalledTimes(first);
    rerender(view(NINE));
    expect(mark).toHaveBeenCalledTimes(first + 1);
    mark.mockRestore();
  });

  // PIN-03
  describe('icons', () => {
    const iconLayer: Layer = {
      ...testLayer,
      icons: { 'pin-birth': 'M0 0H24V24Z' },
    };
    const missing = () =>
      maplibre.map.setMissingStyleImageResolver.mock.calls.findLast(
        ([resolver]) => resolver !== null
      )![0] as (id: string) => Promise<void>;

    it('draws a missing image of a layer as an SDF image at the device pixel ratio', async () => {
      render(
        <MapView
          layers={[iconLayer]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
        />
      );
      await missing()('pin-birth');

      expect(iconImage).toHaveBeenCalledWith(
        'M0 0H24V24Z',
        window.devicePixelRatio
      );
      expect(maplibre.map.addImage).toHaveBeenCalledExactlyOnceWith(
        'pin-birth',
        expect.objectContaining({ width: 'M0 0H24V24Z'.length }),
        { pixelRatio: window.devicePixelRatio, sdf: true }
      );
    });

    it('ignores an image that no layer names', async () => {
      render(
        <MapView
          layers={[iconLayer, polityLayer]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
        />
      );
      await missing()('basemap-sprite');

      expect(maplibre.map.addImage).not.toHaveBeenCalled();
    });

    it('stops resolving images on unmount', () => {
      const { unmount } = render(
        <MapView
          layers={[iconLayer]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
        />
      );

      unmount();
      expect(
        maplibre.map.setMissingStyleImageResolver
      ).toHaveBeenLastCalledWith(null);
    });
  });

  // NFR-01
  describe('source data', () => {
    const dataLayer = (data: object): Layer => ({
      ...testLayer,
      sources: { 'test-layer': { data, type: 'geojson' } as never },
    });
    const FIRST = { features: [], type: 'FeatureCollection' };
    const SECOND = { features: [], type: 'FeatureCollection' };

    it('does not send the data the style was built with', () => {
      render(
        <MapView
          layers={[dataLayer(FIRST)]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
        />
      );

      expect(maplibre.source.setData).not.toHaveBeenCalled();
    });

    it('sends new data once, and not again for a Map date change', () => {
      const { rerender } = render(
        <MapView
          layers={[dataLayer(FIRST)]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
        />
      );
      const next = [dataLayer(SECOND)];

      rerender(
        <MapView layers={next} mapDay={FIVE} padding={padding} visible={on} />
      );
      expect(maplibre.map.getSource).toHaveBeenCalledWith('test-layer');
      expect(maplibre.source.setData).toHaveBeenCalledExactlyOnceWith(SECOND);

      rerender(
        <MapView layers={next} mapDay={NINE} padding={padding} visible={on} />
      );
      rerender(
        <MapView
          layers={[dataLayer(SECOND)]}
          mapDay={NINE}
          padding={padding}
          visible={on}
        />
      );
      expect(maplibre.source.setData).toHaveBeenCalledOnce();
    });

    it('leaves a source that has a URL alone', () => {
      const { rerender } = render(
        <MapView
          layers={[polityLayer]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
        />
      );

      rerender(
        <MapView
          layers={[{ ...polityLayer }]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
        />
      );
      expect(maplibre.source.setData).not.toHaveBeenCalled();
    });

    it('waits for the style to load before it sends data', () => {
      maplibre.map.isStyleLoaded.mockReturnValue(false);

      const { rerender, unmount } = render(
        <MapView
          layers={[dataLayer(FIRST)]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
        />
      );

      rerender(
        <MapView
          layers={[dataLayer(SECOND)]}
          mapDay={FIVE}
          padding={padding}
          visible={on}
        />
      );
      expect(maplibre.source.setData).not.toHaveBeenCalled();

      for (const [event, onLoad] of maplibre.map.once.mock.calls) {
        if (event === 'load') onLoad();
      }

      expect(maplibre.source.setData).toHaveBeenCalledExactlyOnceWith(SECOND);
      unmount();
    });
  });

  it('puts the map on window only in browser-test builds', () => {
    const { unmount } = render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    expect('kinscapeMap' in window).toBe(false);
    unmount();

    vi.stubEnv('NEXT_PUBLIC_E2E', '1');
    render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );
    expect('kinscapeMap' in window).toBe(true);
    vi.unstubAllEnvs();
    delete (window as unknown as { kinscapeMap?: unknown }).kinscapeMap;
  });

  it('removes the map on unmount', () => {
    const { unmount } = render(
      <MapView layers={layers} mapDay={FIVE} padding={padding} visible={on} />
    );

    expect(maplibre.map.remove).not.toHaveBeenCalled();
    unmount();
    expect(maplibre.map.remove).toHaveBeenCalledOnce();
  });
});
