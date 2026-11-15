import type { ComponentProps } from 'react';

import type { RelationshipRow } from '@ks/app/components/actions/RelationshipRow';
import type { PersonDates } from '@ks/app/components/actions/types';
import type {
  PersonFieldErrors,
  PersonView,
} from '@ks/lib/domain/persons/types.ts';
import type { Result } from '@ks/lib/domain/result/types.ts';

/**
 * One Relationship of the Relationships page, as the server sends it. A spouse Relationship has no
 * `subtype`. The `id` is a plain string, because the id crosses to the client.
 */
export type RelationshipEntry = {
  /** The id of the Relationship. */
  id: string;
} & Omit<ComponentProps<typeof RelationshipRow>, 'href' | 'state'>;

/** The Person of the Relationships page: the name and the dates under the title. */
export type RelationshipsPerson = {
  givenNames: string;
  id: string;
  surname: string;
} & PersonDates;

/** What a save action returns: the saved Person, or why nothing was saved. */
export type SaveResult = Result<
  PersonView,
  'conflict' | 'invalid' | 'not-found' | PersonFieldErrors
>;
