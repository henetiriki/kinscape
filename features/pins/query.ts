'use client';

import { useQuery } from '@tanstack/react-query';

import type { MapPin } from '@ks/lib/domain/pins/types.ts';

/** The Pins of the Viewer's Tree from `/data/pins`. A response that is not OK throws. */
export const fetchPins = async (): Promise<MapPin[]> => {
  const response = await fetch('/data/pins');

  if (!response.ok) {
    throw new Error(`Pins request failed: ${response.status}`);
  }

  return (await response.json()) as MapPin[];
};

/**
 * The Pins of the Tree. The query loads once for the page (`staleTime: Infinity`) and keeps the
 * Pins in memory only (NFR-03). A later save reloads it by the key `['pins']`. A failed load does
 * not retry: the error state shows at once, and a person retries it.
 */
export const usePins = () =>
  useQuery({
    queryFn: fetchPins,
    queryKey: ['pins'],
    retry: false,
    staleTime: Infinity,
  });
