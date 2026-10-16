import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const maplibre = vi.hoisted(() => {
  const map = { addControl: vi.fn(), remove: vi.fn() };

  return {
    Map: vi.fn(
      class {
        addControl = map.addControl;
        remove = map.remove;
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

import { MapView } from '../MapView';

// Recorded at import time, before any test can clear the mock.
const [workerUrl] = maplibre.setWorkerUrl.mock.calls[0];

describe('MapView', () => {
  beforeEach(() => {
    maplibre.Map.mockClear();
    maplibre.map.addControl.mockClear();
    maplibre.map.remove.mockClear();
  });

  it('points MapLibre at its worker file', () => {
    expect(workerUrl).toContain('maplibre-gl-worker.mjs');
  });

  it('builds a blank map centred on South Africa in its container', () => {
    const { container } = render(<MapView />);

    expect(maplibre.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [25, -29],
        container: container.querySelector('.map'),
        style: expect.objectContaining({
          layers: [expect.objectContaining({ id: 'background' })],
        }),
        zoom: 4.5,
      })
    );
  });

  it('adds the navigation and scale controls', () => {
    render(<MapView />);

    expect(maplibre.map.addControl).toHaveBeenCalledTimes(2);
    expect(maplibre.NavigationControl).toHaveBeenCalledOnce();
    expect(maplibre.ScaleControl).toHaveBeenCalledOnce();
  });

  it('removes the map on unmount', () => {
    const { unmount } = render(<MapView />);

    expect(maplibre.map.remove).not.toHaveBeenCalled();
    unmount();
    expect(maplibre.map.remove).toHaveBeenCalledOnce();
  });
});
