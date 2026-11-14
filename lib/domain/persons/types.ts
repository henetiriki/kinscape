import type { z } from 'zod';

import type { FuzzyDateError } from '@ks/lib/domain/dates/types.ts';
import type { personInputSchema } from '@ks/lib/domain/persons/schemas.mts';

/** A saved Person. `version` counts saves; an update names the one it read. */
export type Person = { version: number } & PersonInput;

/** The error kind of each form field that failed. A kind never holds input text. */
export type PersonFieldErrors = {
  fields: {
    birth?: FuzzyDateError;
    death?: FuzzyDateError;
    givenNames?: 'required';
    surname?: 'required';
    variants?: 'too-many';
  };
};

/** What a client saves. A name or note with nothing in it is the empty string. */
export type PersonInput = z.output<typeof personInputSchema>;

/**
 * One row of the People list. The server shortens the dates to text and leaves out the notes, so
 * a notes text never reaches the browser.
 */
export type PersonSummary = {
  /** Short text for the birth date, or "—". */
  born: string;
  deceased: boolean;
  /** Short text for the death date, or the empty string. */
  died: string;
  givenNames: string;
  id: string;
  maidenName: string;
  surname: string;
  variants: string[];
};

/** A Person as a Viewer sees it. The server derives `living` on read and never stores it. */
export type PersonView = { living: boolean } & Person;

/** GEDCOM 7 codes: male, female, intersex (X) and unknown. */
export type Sex = PersonInput['sex'];
