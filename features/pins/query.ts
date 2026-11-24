'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type {
  MapPin,
  PinDetails,
  PinEditFields,
} from '@ks/lib/domain/pins/types.ts';

import { withMapPin } from '@ks/lib/domain/pins/map-pins.mts';
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
 * Pins in memory only (NFR-03). A save writes its Pin here at once, then reloads the query
 * (`useWritePin`).
 */
export const usePins = () =>
  useQuery({ queryFn: fetchPins, queryKey: ['pins'], staleTime: Infinity });

/**
 * A function that puts a saved Pin in the cached Pins, then loads the Pins again in the
 * background (PIN-01, PIN-02). With no cached Pins it writes nothing, so the cache never holds a
 * partial list. The reload marks each held `['pins', id]` query as stale. The reload excludes the
 * query of the edit fields: its panel is still mounted, and a reload asks again (NFR-10).
 */
export const useWritePin = () => {
  const client = useQueryClient();

  return useCallback(
    (pin: MapPin) => {
      client.setQueryData<MapPin[]>(
        ['pins'],
        pins => pins && withMapPin(pins, pin)
      );
      void client.invalidateQueries({
        predicate: ({ queryKey }) => queryKey[2] !== 'edit',
        queryKey: ['pins'],
      });
    },
    [client]
  );
};

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
 * The details of one Pin. The key starts with `['pins']`, so a save marks each held details query
 * as stale (`useWritePin`). The answer stays in memory only (NFR-03).
 */
export const usePinDetails = (id: MapPin['id']) =>
  useQuery({
    queryFn: () => fetchPinDetails(id),
    queryKey: ['pins', id],
    staleTime: Infinity,
  });
