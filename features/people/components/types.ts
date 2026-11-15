import type {
  PersonDates,
  SpouseDates,
} from '@ks/app/components/actions/types';
import type {
  PersonFieldErrors,
  PersonView,
} from '@ks/lib/domain/persons/types.ts';
import type { Result } from '@ks/lib/domain/result/types.ts';

/** One link of the Relationships page, as the server sends it. A spouse link has no `subtype`. */
export type RelationshipEntry = {
  givenNames: string;
  /** The id of the link. */
  id: string;
  subtype?: 'adoptive' | 'biological' | 'step';
  surname: string;
} & PersonDates &
  SpouseDates;

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
