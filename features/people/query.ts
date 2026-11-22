'use client';

import { useQuery } from '@tanstack/react-query';

import type { PersonSummary } from '@ks/lib/domain/persons/types.ts';

import { requestError } from '@ks/lib/domain/requests/request-error.mts';

/** The Persons of the Viewer's Tree from `/data/people`. A response that is not OK throws. */
export const fetchPeople = async (): Promise<PersonSummary[]> => {
  const response = await fetch('/data/people');

  if (!response.ok) {
    throw requestError('People', response.status);
  }

  return (await response.json()) as PersonSummary[];
};

/**
 * The Persons of the Tree. The query asks once each time a form opens (`staleTime: Infinity`).
 * With `gcTime: 0` it drops the Persons when its last reader unmounts, so the next reader asks again.
 * The Persons stay in memory only (NFR-03).
 */
export const usePeople = () =>
  useQuery({
    gcTime: 0,
    queryFn: fetchPeople,
    queryKey: ['people'],
    staleTime: Infinity,
  });
