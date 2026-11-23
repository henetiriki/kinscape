import type { ComponentProps } from 'react';

import type { RelationshipRow } from '@ks/app/components/actions/RelationshipRow';
import type { PersonDates } from '@ks/app/components/actions/types';
import type {
  PersonFieldErrors,
  PersonView,
} from '@ks/lib/domain/persons/types.ts';
import type { Place } from '@ks/lib/domain/places/types.ts';
import type {
  Relationship,
  RelationshipSaveError,
} from '@ks/lib/domain/relationships/types.ts';
import type { Result } from '@ks/lib/domain/result/types.ts';

/** A result code that shows an alert. `invalid` shows the error toast instead. */
export type AlertCode = Exclude<RelationshipSaveError, 'invalid'>;

/** The Place that "Add a pin here" fixes in the Pin form: its id, its point and its precision. */
export type FixedPlace = Pick<
  Place,
  'id' | 'latitude' | 'longitude' | 'precision'
>;

/** The text of an alert. `action` is a button under it. */
export type Message = {
  action?: 'Go to People' | 'Reload';
  line: string;
  title: string;
};

/** The other end of a Relationship: the Person that the dialog fixes, with the dates of a row. */
export type OtherPerson = {
  givenNames: string;
  id: string;
  surname: string;
} & PersonDates;

/** The error text under each field of the Pin form that has one. */
export type PinMessages = {
  address?: string;
  coordinates?: string;
  date?: string;
  eventType?: string;
  notes?: string;
  personId?: string;
  precision?: string;
  sources?: string;
};

/** The two Relationship actions, as the page passes them to the dialog. */
export type RelationshipActions = {
  create: (input: unknown) => Promise<RelationshipSaveResult>;
  update: (input: {
    relationship: unknown;
    version: number;
  }) => Promise<RelationshipSaveResult>;
};

/**
 * One Relationship of the Relationships page, as the server sends it. A spouse Relationship has no
 * `subtype`. The `id` is a plain string, because the id crosses to the client.
 */
export type RelationshipEntry = {
  /** The id of the Relationship. */
  id: string;
  /** The saved Relationship, with the `version` that the page read, for "Edit". */
  relationship: Relationship;
} & Omit<ComponentProps<typeof RelationshipRow>, 'href' | 'state'>;

/** What a Relationship action returns: the saved Relationship, or why nothing was saved. */
export type RelationshipSaveResult = Result<
  Relationship,
  RelationshipSaveError
>;

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
