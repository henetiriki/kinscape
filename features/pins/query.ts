'use client';

import { useQuery } from '@tanstack/react-query';

import type { MapPin, PinDetails } from '@ks/lib/domain/pins/types.ts';

/**
 * The error of a response from `/data/pins` that is not OK. Its `status` lets the retry rule of
 * `QueryProvider` skip a 401 or a 404.
 */
const requestError = (status: number) =>
  Object.assign(new Error(`Pins request failed: ${status}`), { status });

/** The Pins of the Viewer's Tree from `/data/pins`. A response that is not OK throws. */
export const fetchPins = async (): Promise<MapPin[]> => {
  const response = await fetch('/data/pins');

  if (!response.ok) {
    throw requestError(response.status);
  }

  return (await response.json()) as MapPin[];
};

/**
 * The Pins of the Tree. The query loads once for the page (`staleTime: Infinity`) and keeps the
 * Pins in memory only (NFR-03). A later save reloads it by the key `['pins']`.
 */
export const usePins = () =>
  useQuery({ queryFn: fetchPins, queryKey: ['pins'], staleTime: Infinity });

/** The details of one Pin from `/data/pins/{id}`. A response that is not OK throws. */
export const fetchPinDetails = async (
  id: MapPin['id']
): Promise<PinDetails> => {
  const response = await fetch(`/data/pins/${id}`);

  if (!response.ok) {
    throw requestError(response.status);
  }

  return (await response.json()) as PinDetails;
};

/**
 * The details of one Pin. The key starts with `['pins']`, so a reload of the Pins also marks each
 * held details query as stale. The answer stays in memory only (NFR-03).
 */
export const usePinDetails = (id: MapPin['id']) =>
  useQuery({
    queryFn: () => fetchPinDetails(id),
    queryKey: ['pins', id],
    staleTime: Infinity,
  });
