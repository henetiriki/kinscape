import type { FuzzyDate } from '@ks/lib/domain/dates/types.ts';
import type { PersonId } from '@ks/lib/domain/ids/types.ts';

/** A saved Person. `version` counts saves; an update names the one it read. */
export type Person = { version: number } & PersonInput;

/** What a client saves. A name or note with nothing in it is the empty string. */
export type PersonInput = {
  birth?: FuzzyDate;
  death?: FuzzyDate;
  deceased: boolean;
  givenNames: string;
  id: PersonId;
  maidenName: string;
  notes: string;
  sex: Sex;
  surname: string;
  variants: string[];
};

/** A Person as a Viewer sees it. `living` is derived on read, never stored. */
export type PersonView = { living: boolean } & Person;

/** GEDCOM 7 codes: male, female, intersex (X) and unknown. */
export type Sex = 'F' | 'M' | 'U' | 'X';
