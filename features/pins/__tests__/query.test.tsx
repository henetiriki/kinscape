import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { MapPin } from '@ks/lib/domain/pins/types.ts';

import { QueryProvider } from '@ks/app/QueryProvider';
import { usePinDetails, usePinEdit, usePins } from '@ks/features/pins';
import {
  fetchPinDetails,
  fetchPinEdit,
  fetchPins,
} from '@ks/features/pins/query';

// PIN-02, NFR-01, NFR-03. Data is synthetic.
const PIN = {
  date1: '1850-03-04',
  eventType: 'baptism',
  id: '01900000-0000-7000-b000-0000000000d1' as MapPin['id'],
  latitude: -33.9,
  longitude: 18.4,
  qualifier: 'EXACT',
  span: { validFrom: 1, validTo: 2 },
};

const DETAILS = {
  address: '1 Church Street',
  eventType: 'baptism',
  givenNames: 'Ana',
  surname: 'Smit',
};

const DetailsProbe = ({ name }: { name: string }) => {
  const { data, isError } = usePinDetails(PIN.id);

  return (
    <p>{`${name}: ${isError ? 'error' : (data?.surname ?? 'loading')}`}</p>
  );
};

const fetchStub = vi.fn();

const Probe = ({ name }: { name: string }) => {
  const { data, isError } = usePins();

  return <p>{`${name}: ${isError ? 'error' : (data?.length ?? 'loading')}`}</p>;
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

it('retries a 503 and shows the Pins when the next response is OK', async () => {
  fetchStub
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(Response.json([PIN]));

  render(
    <QueryProvider>
      <Probe name='one' />
    </QueryProvider>
  );

  await waitFor(
    () => {
      expect(document.body.textContent).toContain('one: 1');
    },
    { timeout: 5000 }
  );
  expect(fetchStub).toHaveBeenCalledTimes(2);
});

it('shows the error state after one request when the response is 401', async () => {
  fetchStub.mockResolvedValue(new Response(null, { status: 401 }));

  render(
    <QueryProvider>
      <Probe name='one' />
    </QueryProvider>
  );

  await waitFor(() => {
    expect(document.body.textContent).toContain('one: error');
  });
  expect(fetchStub).toHaveBeenCalledTimes(1);
});

it('rejects fetchPins on a response that is not OK', async () => {
  fetchStub.mockResolvedValue(new Response(null, { status: 401 }));

  await expect(fetchPins()).rejects.toThrow('401');
});

it('gives the Pins that fetchPins reads', async () => {
  fetchStub.mockResolvedValue(Response.json([PIN]));

  await expect(fetchPins()).resolves.toEqual([PIN]);
});

it('sends one request for the details when two parts ask, and none for a late third', async () => {
  fetchStub.mockResolvedValue(Response.json(DETAILS));

  const { rerender } = render(
    <QueryProvider>
      <DetailsProbe name='one' />
      <DetailsProbe name='two' />
    </QueryProvider>
  );

  await waitFor(() => {
    expect(document.body.textContent).toContain('one: Smit');
  });
  expect(document.body.textContent).toContain('two: Smit');

  rerender(
    <QueryProvider>
      <DetailsProbe name='one' />
      <DetailsProbe name='two' />
      <DetailsProbe name='late' />
    </QueryProvider>
  );

  expect(document.body.textContent).toContain('late: Smit');
  expect(fetchStub).toHaveBeenCalledTimes(1);
  expect(fetchStub.mock.calls[0][0]).toBe(`/data/pins/${PIN.id}`);
});

it('shows the error state of the details after one request when the response is 404', async () => {
  fetchStub.mockResolvedValue(new Response(null, { status: 404 }));

  render(
    <QueryProvider>
      <DetailsProbe name='one' />
    </QueryProvider>
  );

  await waitFor(() => {
    expect(document.body.textContent).toContain('one: error');
  });
  expect(fetchStub).toHaveBeenCalledTimes(1);
});

it('rejects fetchPinDetails on a response that is not OK', async () => {
  fetchStub.mockResolvedValue(new Response(null, { status: 404 }));

  await expect(fetchPinDetails(PIN.id)).rejects.toThrow('404');
});

const EDIT = { address: '1 Church Street', version: 2 };

const EditProbe = () => {
  const { data, isError } = usePinEdit(PIN.id);

  return <p>{`edit: ${isError ? 'error' : (data?.version ?? 'loading')}`}</p>;
};

it('asks for the edit fields by the key of the Pin and shows the version', async () => {
  fetchStub.mockResolvedValue(Response.json(EDIT));

  render(
    <QueryProvider>
      <EditProbe />
    </QueryProvider>
  );

  await waitFor(() => {
    expect(document.body.textContent).toContain('edit: 2');
  });
  expect(fetchStub).toHaveBeenCalledTimes(1);
  expect(fetchStub.mock.calls[0][0]).toBe(`/data/pins/${PIN.id}/edit`);
});

it('asks again for the edit fields when the form mounts again', async () => {
  fetchStub.mockImplementation(async () => Response.json(EDIT));

  const { rerender } = render(
    <QueryProvider>
      <EditProbe />
    </QueryProvider>
  );

  await waitFor(() => {
    expect(document.body.textContent).toContain('edit: 2');
  });
  rerender(<QueryProvider>{null}</QueryProvider>);
  // `gcTime: 0` drops the query on the next timer tick.
  await new Promise(resolve => setTimeout(resolve, 10));
  rerender(
    <QueryProvider>
      <EditProbe />
    </QueryProvider>
  );
  await waitFor(() => {
    expect(document.body.textContent).toContain('edit: 2');
  });
  expect(fetchStub).toHaveBeenCalledTimes(2);
});

it('rejects fetchPinEdit on a response that is not OK', async () => {
  fetchStub.mockResolvedValue(new Response(null, { status: 404 }));

  await expect(fetchPinEdit(PIN.id)).rejects.toThrow('404');
});

it('gives the fields that fetchPinEdit reads', async () => {
  fetchStub.mockResolvedValue(Response.json(EDIT));

  await expect(fetchPinEdit(PIN.id)).resolves.toEqual(EDIT);
});

it('gives the details that fetchPinDetails reads', async () => {
  fetchStub.mockResolvedValue(Response.json(DETAILS));

  await expect(fetchPinDetails(PIN.id)).resolves.toEqual(DETAILS);
});
