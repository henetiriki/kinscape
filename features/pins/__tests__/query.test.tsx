import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { QueryProvider } from '@ks/app/QueryProvider';
import { fetchPins, usePins } from '@ks/features/pins';

// PIN-02, NFR-01, NFR-03. Data is synthetic.
const PIN = {
  eventType: 'baptism',
  id: '01900000-0000-7000-b000-0000000000d1',
  latitude: -33.9,
  longitude: 18.4,
  span: { validFrom: 1, validTo: 2 },
};

const fetchStub = vi.fn();

const Probe = ({ name }: { name: string }) => {
  const { data } = usePins();

  return <p>{`${name}: ${data?.length ?? 'loading'}`}</p>;
};

beforeEach(() => {
  fetchStub.mockReset();
  vi.stubGlobal('fetch', fetchStub);
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('sends one request when two parts of the page ask for the Pins', async () => {
  fetchStub.mockResolvedValue(Response.json([PIN]));

  render(
    <QueryProvider>
      <Probe name='one' />
      <Probe name='two' />
    </QueryProvider>
  );

  await waitFor(() => {
    expect(document.body.textContent).toContain('one: 1');
  });
  expect(document.body.textContent).toContain('two: 1');
  expect(fetchStub).toHaveBeenCalledTimes(1);
  expect(fetchStub.mock.calls[0][0]).toBe('/data/pins');
});

it('loads the Pins once for the life of the page', async () => {
  fetchStub.mockResolvedValue(Response.json([PIN]));

  const { rerender } = render(
    <QueryProvider>
      <Probe name='one' />
    </QueryProvider>
  );

  await waitFor(() => {
    expect(document.body.textContent).toContain('one: 1');
  });

  rerender(
    <QueryProvider>
      <Probe name='one' />
      <Probe name='late' />
    </QueryProvider>
  );

  expect(document.body.textContent).toContain('late: 1');
  expect(fetchStub).toHaveBeenCalledTimes(1);
});

it('leaves no Pin in local storage or session storage', async () => {
  fetchStub.mockResolvedValue(Response.json([PIN]));

  render(
    <QueryProvider>
      <Probe name='one' />
    </QueryProvider>
  );

  await waitFor(() => {
    expect(document.body.textContent).toContain('one: 1');
  });
  expect(localStorage).toHaveLength(0);
  expect(sessionStorage).toHaveLength(0);
});

it('rejects fetchPins on a response that is not OK', async () => {
  fetchStub.mockResolvedValue(new Response(null, { status: 401 }));

  await expect(fetchPins()).rejects.toThrow('401');
});

it('gives the Pins that fetchPins reads', async () => {
  fetchStub.mockResolvedValue(Response.json([PIN]));

  await expect(fetchPins()).resolves.toEqual([PIN]);
});
