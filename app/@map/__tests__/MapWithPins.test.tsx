import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Layer } from '@ks/features/map/types';

const shell = vi.hoisted(() => vi.fn());

vi.mock('@ks/features/map', async () => ({
  MapShell: (props: { layers: Layer[]; toast?: unknown }) => {
    shell(props);

    return (
      <div data-testid='map-shell'>
        {props.layers.map(layer => (
          <p data-layer={layer.id} key={layer.id}>
            {typeof layer.description === 'function'
              ? `${layer.description(toDay('1850-06-01'))} | ${layer.description(toDay('1860-06-01'))}`
              : layer.description}
          </p>
        ))}
        {props.toast as never}
      </div>
    );
  },
  pinsLayer: (await import('@ks/features/map/layers/pins')).pinsLayer,
  polityLayer: (await import('@ks/features/map/layers/polities')).polityLayer,
}));

import { MapWithPins } from '@ks/app/@map/MapWithPins';
import { QueryProvider } from '@ks/app/QueryProvider';
import { toDay } from '@ks/lib/domain/boundaries/model.mts';

// PIN-03, NFR-01. Data is synthetic.
const pinOf = (id: number, from: string, to: null | string) => ({
  eventType: 'residence',
  id: `01900000-0000-7000-b000-00000000000${id}`,
  latitude: -33.9,
  longitude: 18.4,
  span: { validFrom: toDay(from), validTo: to === null ? null : toDay(to) },
});
const PINS = [
  pinOf(1, '1840-01-01', '1855-01-01'),
  pinOf(2, '1900-01-01', '1910-01-01'),
  pinOf(3, '1950-01-01', null),
];
const props = {
  coverage: [],
  email: 'a@example.test',
  initial: 'A',
  onSignOut: () => Promise.resolve(),
  sources: [],
};
const fetchStub = vi.fn();

const renderMap = () =>
  render(
    <QueryProvider>
      <MapWithPins {...props} />
    </QueryProvider>
  );

beforeEach(() => {
  fetchStub.mockReset();
  shell.mockClear();
  vi.stubGlobal('fetch', fetchStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MapWithPins', () => {
  it('passes the shell its props and the Polity borders row before the Pins row', async () => {
    fetchStub.mockResolvedValue(Response.json(PINS));
    renderMap();

    expect(shell.mock.calls[0][0]).toMatchObject(props);
    expect(
      shell.mock.calls[0][0].layers.map((layer: Layer) => layer.id)
    ).toEqual(['polity-borders', 'pins']);
    await waitFor(() => {
      expect(screen.getByText(/3 true/)).toBeTruthy();
    });
  });

  it('shows "0 of 0" before the Pins load and counts them for the Map date after', async () => {
    fetchStub.mockResolvedValue(Response.json(PINS));
    renderMap();

    expect(document.querySelector('[data-layer="pins"]')?.textContent).toBe(
      '0 of 0 true on this date | 0 of 0 true on this date'
    );

    await waitFor(() => {
      expect(document.querySelector('[data-layer="pins"]')?.textContent).toBe(
        '1 of 3 true on this date | 0 of 3 true on this date'
      );
    });
  });

  it('shows "0 of 0" and no message for a Tree with no Pins', async () => {
    fetchStub.mockResolvedValue(Response.json([]));
    renderMap();

    await waitFor(() => {
      expect(fetchStub).toHaveBeenCalledOnce();
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(document.querySelector('[data-layer="pins"]')?.textContent).toBe(
      '0 of 0 true on this date | 0 of 0 true on this date'
    );
  });

  it('sends one request for the Pins', async () => {
    fetchStub.mockResolvedValue(Response.json(PINS));
    renderMap();

    await waitFor(() => {
      expect(screen.getByText(/3 true/)).toBeTruthy();
    });
    expect(fetchStub).toHaveBeenCalledExactlyOnceWith('/data/pins');
  });

  // D2: B
  it('says the Pins did not load, and loads them again on "Try again"', async () => {
    fetchStub
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(PINS));
    renderMap();

    const alert = await screen.findByRole('alert');

    expect(alert.textContent).toContain('Your pins did not load.');
    expect(alert.hasAttribute('data-placed')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => {
      expect(screen.getByText(/3 true/)).toBeTruthy();
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(fetchStub).toHaveBeenCalledTimes(2);
  });

  it('shows the message again when "Try again" fails', async () => {
    fetchStub.mockResolvedValue(new Response(null, { status: 401 }));
    renderMap();

    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => {
      expect(fetchStub).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('hides the message on Esc', async () => {
    fetchStub.mockResolvedValue(new Response(null, { status: 401 }));
    renderMap();

    fireEvent.keyDown(await screen.findByRole('alert'), { key: 'Escape' });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // NFR-05
  it('places the message above the date sheet on a phone', async () => {
    const desktop = window.matchMedia;

    window.matchMedia = (() => ({
      addEventListener: () => {},
      matches: true,
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    fetchStub.mockResolvedValue(new Response(null, { status: 401 }));
    renderMap();

    expect((await screen.findByRole('alert')).hasAttribute('data-placed')).toBe(
      true
    );
    window.matchMedia = desktop;
  });
});
