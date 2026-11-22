import type { ReactNode } from 'react';

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Layer } from '@ks/features/map/types';

const shell = vi.hoisted(() => vi.fn());

vi.mock('@ks/features/map', async () => ({
  MapShell: (props: {
    layers: Layer[];
    pin?: {
      popup: (
        form: 'floating' | 'inline',
        place?: { x: number; y: number }
      ) => ReactNode;
    };
    toast?: unknown;
  }) => {
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
        {props.pin?.popup('floating', { x: 10, y: 20 })}
      </div>
    );
  },
  pinsLayer: (await import('@ks/features/map/layers/pins')).pinsLayer,
  polityLayer: (await import('@ks/features/map/layers/polities')).polityLayer,
}));

const addPin = vi.hoisted(() => vi.fn());

vi.mock('@ks/app/@map/useAddPin', () => ({ useAddPin: addPin }));

import { MapWithPins } from '@ks/app/@map/MapWithPins';
import { QueryProvider } from '@ks/app/QueryProvider';
import { toDay } from '@ks/lib/domain/boundaries/model.mts';

// PIN-03, NFR-01. Data is synthetic.
const pinOf = (id: number, from: string, to: null | string) => ({
  date1: from.slice(0, 4),
  date2: to === null ? undefined : String(Number(to.slice(0, 4)) - 1),
  eventType: 'residence',
  id: `01900000-0000-7000-b000-00000000000${id}`,
  latitude: -33.9,
  longitude: 18.4,
  qualifier: to === null ? 'EXACT' : 'FROM',
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
// The row text of the Pins layer at 1850 and at 1860.
const captions = () =>
  // eslint-disable-next-line testing-library/no-node-access -- the mock layer row is a bare p with no role or label; the test reads its text
  document.querySelector('[data-layer="pins"]')?.textContent;
const EMPTY = '0 of 0 true on this date | 0 of 0 true on this date';
const LOADED = '1 of 3 true on this date | 0 of 3 true on this date';

const renderMap = () =>
  render(
    <QueryProvider>
      <MapWithPins {...props} />
    </QueryProvider>
  );

beforeEach(() => {
  fetchStub.mockReset();
  shell.mockClear();
  addPin.mockReset();
  addPin.mockReturnValue({});
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
      expect(captions()).toBe(LOADED);
    });
  });

  // PIN-01
  it('passes the action and the panel of the add-pin hook, and loads the Pins again after a save', async () => {
    fetchStub.mockResolvedValue(Response.json(PINS));
    addPin.mockReturnValue({ action: 'ACTION', panel: 'PANEL' });
    renderMap();

    expect(shell.mock.calls[0][0]).toMatchObject({
      action: 'ACTION',
      panel: 'PANEL',
    });
    await waitFor(() => {
      expect(captions()).toBe(LOADED);
    });
    expect(fetchStub).toHaveBeenCalledTimes(1);

    await act(async () => {
      addPin.mock.calls.at(-1)![0].onSaved();
    });
    await waitFor(() => {
      expect(fetchStub).toHaveBeenCalledTimes(2);
    });
  });

  it('shows "0 of 0" before the Pins load and counts them for the Map date after', async () => {
    fetchStub.mockResolvedValue(Response.json(PINS));
    renderMap();

    expect(captions()).toBe(EMPTY);

    await waitFor(() => {
      expect(captions()).toBe(LOADED);
    });
  });

  it('shows "0 of 0" and no message for a Tree with no Pins', async () => {
    fetchStub.mockResolvedValue(Response.json([]));
    renderMap();

    await waitFor(() => {
      expect(fetchStub).toHaveBeenCalledOnce();
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(captions()).toBe(EMPTY);
  });

  it('sends one request for the Pins', async () => {
    fetchStub.mockResolvedValue(Response.json(PINS));
    renderMap();

    await waitFor(() => {
      expect(captions()).toBe(LOADED);
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
      expect(captions()).toBe(LOADED);
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
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Your pins did not load.'
    );
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

// PIN-02, #861 D3. Data is synthetic.
describe('the Pin popup', () => {
  const [FIRST, SECOND] = PINS;
  const DETAILS = {
    address: 'Farm Example, district Example',
    eventType: 'residence',
    givenNames: 'Example',
    surname: 'Person',
  };
  const answer = (url: string) => {
    if (url === '/data/pins') return Promise.resolve(Response.json(PINS));

    return Promise.resolve(
      url === `/data/pins/${FIRST.id}`
        ? Response.json(DETAILS)
        : Response.json({ ...DETAILS, givenNames: 'Other' })
    );
  };
  const lastShell = () => shell.mock.calls.at(-1)![0];
  const click = async (id: string) => {
    await waitFor(() => {
      expect(captions()).toBe(LOADED);
    });
    act(() => lastShell().onOpenPin(id));
  };

  it('sends no request for details until a Pin is clicked, then one for that Pin', async () => {
    fetchStub.mockImplementation(answer);
    renderMap();
    await waitFor(() => {
      expect(captions()).toBe(LOADED);
    });
    expect(fetchStub).toHaveBeenCalledExactlyOnceWith('/data/pins');
    expect(lastShell().pin).toBeUndefined();

    await click(FIRST.id);
    await screen.findByText('Farm Example, district Example');
    expect(fetchStub.mock.calls.map(([url]) => url)).toEqual([
      '/data/pins',
      `/data/pins/${FIRST.id}`,
    ]);
  });

  it('shows the Person, event type, both dates and the address', async () => {
    fetchStub.mockImplementation(answer);
    renderMap();
    await click(FIRST.id);

    await screen.findByRole('heading', { name: 'Example Person' });
    expect(screen.getByText('Residence').textContent).toBe('Residence');
    expect(screen.getByText('From 1840 to 1854').textContent).toBe(
      'From 1840 to 1854'
    );
    expect(screen.getByText('FROM 1840 TO 1854').textContent).toBe(
      'FROM 1840 TO 1854'
    );
    screen.getByText('Farm Example, district Example');
    expect(lastShell().pin.open).toEqual({
      id: FIRST.id,
      position: [18.4, -33.9],
    });
    expect(lastShell().pin.span).toEqual(FIRST.span);
  });

  it('shows the event type and both date lines before the details arrive', async () => {
    fetchStub.mockImplementation((url: string) =>
      url === '/data/pins' ? answer(url) : new Promise(() => {})
    );
    renderMap();
    await click(FIRST.id);

    expect(screen.getByText('Residence').textContent).toBe('Residence');
    expect(screen.getByText('From 1840 to 1854').textContent).toBe(
      'From 1840 to 1854'
    );
    expect(screen.getByText('FROM 1840 TO 1854').textContent).toBe(
      'FROM 1840 TO 1854'
    );
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('says the details did not load, and asks again on "Try again"', async () => {
    let failing = true;

    fetchStub.mockImplementation((url: string) =>
      url !== '/data/pins' && failing
        ? Promise.resolve(new Response(null, { status: 404 }))
        : answer(url)
    );
    renderMap();
    await click(FIRST.id);

    within(await screen.findByRole('alert')).getByText(
      "Couldn't load this Pin"
    );
    expect(screen.getByText('From 1840 to 1854').textContent).toBe(
      'From 1840 to 1854'
    );

    failing = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('heading', { name: 'Example Person' });
    expect(
      fetchStub.mock.calls.filter(([url]) => url === `/data/pins/${FIRST.id}`)
    ).toHaveLength(2);
  });

  it('replaces the popup when another Pin is clicked', async () => {
    fetchStub.mockImplementation(answer);
    renderMap();
    await click(FIRST.id);
    await screen.findByRole('heading', { name: 'Example Person' });

    act(() => lastShell().onOpenPin(SECOND.id));
    await screen.findByRole('heading', { name: 'Other Person' });
    expect(
      screen.queryByRole('heading', { name: 'Example Person' })
    ).toBeNull();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('closes the popup, and ignores a click on a Pin the Tree does not hold', async () => {
    fetchStub.mockImplementation(answer);
    renderMap();
    await click(FIRST.id);
    await screen.findByRole('heading', { name: 'Example Person' });

    act(() => lastShell().onClosePin());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(lastShell().pin).toBeUndefined();

    act(() => lastShell().onOpenPin('missing'));
    expect(lastShell().pin).toBeUndefined();
  });

  it('closes from the Close button of the popup', async () => {
    fetchStub.mockImplementation(answer);
    renderMap();
    await click(FIRST.id);
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  // NFR-05
  it('draws the inline form when the shell gives no place', async () => {
    fetchStub.mockImplementation(answer);
    renderMap();
    await click(FIRST.id);

    const { popup } = lastShell().pin;

    render(<div data-testid='inline'>{popup('inline')}</div>, {
      wrapper: QueryProvider,
    });
    await within(screen.getByTestId('inline')).findByRole('group', {
      name: 'Pin details',
    });
  });
});
