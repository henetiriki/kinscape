import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { QueryProvider } from '@ks/app/QueryProvider';
import { usePeople } from '@ks/features/people/query';
import { fetchPeople } from '@ks/features/people/query';

// PIN-01, NFR-03. Data is synthetic.
const PERSON = {
  givenNames: 'Ana',
  id: '01900000-0000-7000-8000-0000000000a1',
  surname: 'Smit',
};

const fetchStub = vi.fn();

const Probe = ({ name }: { name: string }) => {
  const { data, isError } = usePeople();

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

it('asks /data/people once when two readers mount together', async () => {
  fetchStub.mockImplementation(async () => Response.json([PERSON]));

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
  expect(fetchStub.mock.calls[0][0]).toBe('/data/people');
});

it('sends no request for a late reader while a reader stays mounted', async () => {
  fetchStub.mockImplementation(async () => Response.json([PERSON]));

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

it('asks again when a new reader mounts after the last one unmounted', async () => {
  fetchStub.mockImplementation(async () => Response.json([PERSON]));

  const { rerender } = render(
    <QueryProvider>
      <Probe name='one' />
    </QueryProvider>
  );

  await waitFor(() => {
    expect(document.body.textContent).toContain('one: 1');
  });

  rerender(<QueryProvider>{null}</QueryProvider>);
  // `gcTime: 0` removes the query on the next timer tick.
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
  });
  rerender(
    <QueryProvider>
      <Probe name='again' />
    </QueryProvider>
  );

  await waitFor(() => {
    expect(fetchStub).toHaveBeenCalledTimes(2);
  });
  expect(fetchStub.mock.calls[1][0]).toBe('/data/people');
});

it('leaves no Person in local storage or session storage', async () => {
  fetchStub.mockImplementation(async () => Response.json([PERSON]));

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

it('rejects fetchPeople with the status of a response that is not OK', async () => {
  fetchStub.mockResolvedValue(new Response(null, { status: 401 }));

  await expect(fetchPeople()).rejects.toMatchObject({ status: 401 });
});

it('gives the Persons that fetchPeople reads', async () => {
  fetchStub.mockResolvedValue(Response.json([PERSON]));

  await expect(fetchPeople()).resolves.toEqual([PERSON]);
});
