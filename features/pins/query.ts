'use client';

import { useQuery } from '@tanstack/react-query';

import type { MapPin } from '@ks/lib/domain/pins/types.ts';

/** The most times a failed Pins request repeats. */
const MAX_RETRIES = 3;

/** The error of a response from `/data/pins` that is not OK. A dropped connection has no status. */
export const pinsRequestError = (status: number) =>
  Object.assign(new Error(`Pins request failed: ${status}`), { status });

/** The Pins of the Viewer's Tree from `/data/pins`. A response that is not OK throws. */
export const fetchPins = async (): Promise<MapPin[]> => {
  const response = await fetch('/data/pins');

  if (!response.ok) {
    throw pinsRequestError(response.status);
  }

  return (await response.json()) as MapPin[];
};

/**
 * Whether a failed request repeats. A 4xx answer, such as the 401 of an ended session, gives the
 * same answer again, so it shows the error state at once. A 5xx answer or a dropped connection can
 * pass later, so each repeats up to `MAX_RETRIES` times.
 */
export const retryPins = (
  failureCount: number,
  error: { status?: number } & Error
): boolean =>
  failureCount < MAX_RETRIES &&
  (error.status === undefined || error.status >= 500);

/**
 * The Pins of the Tree. The query loads once for the page (`staleTime: Infinity`) and keeps the
 * Pins in memory only (NFR-03). A later save reloads it by the key `['pins']`.
 */
export const usePins = () =>
  useQuery({
    queryFn: fetchPins,
    queryKey: ['pins'],
    retry: retryPins,
    staleTime: Infinity,
  });
