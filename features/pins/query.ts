'use client';

import { useQuery } from '@tanstack/react-query';

import type {
  MapPin,
  PinDetails,
  PinEditFields,
} from '@ks/lib/domain/pins/types.ts';

import { requestError } from '@ks/lib/domain/requests/request-error.mts';

/** The JSON of one Pins route. A response that is not OK throws. */
const fetchPinsJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path);

  if (!response.ok) {
    throw requestError('Pins', response.status);
  }

  return (await response.json()) as T;
};

/** The Pins of the Viewer's Tree from `/data/pins`. A response that is not OK throws. */
export const fetchPins = (): Promise<MapPin[]> =>
  fetchPinsJson<MapPin[]>('/data/pins');

/**
 * The Pins of the Tree. The query loads once for the page (`staleTime: Infinity`) and keeps the
 * Pins in memory only (NFR-03). A later save reloads it by the key `['pins']`.
 */
export const usePins = () =>
  useQuery({ queryFn: fetchPins, queryKey: ['pins'], staleTime: Infinity });

/** The fields of one Pin for the edit form from `/data/pins/{id}/edit`. A response that is not OK throws. */
export const fetchPinEdit = (id: MapPin['id']): Promise<PinEditFields> =>
  fetchPinsJson<PinEditFields>(`/data/pins/${id}/edit`);

/**
 * The fields of one Pin for the edit form. `gcTime: 0` drops the answer when the form closes, so
 * each "Edit" asks again and reads the current `version`. The key starts with `['pins']`.
 */
export const usePinEdit = (id: MapPin['id']) =>
  useQuery({
    gcTime: 0,
    queryFn: () => fetchPinEdit(id),
    queryKey: ['pins', id, 'edit'],
    staleTime: Infinity,
  });

/** The details of one Pin from `/data/pins/{id}`. A response that is not OK throws. */
export const fetchPinDetails = (id: MapPin['id']): Promise<PinDetails> =>
  fetchPinsJson<PinDetails>(`/data/pins/${id}`);

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
