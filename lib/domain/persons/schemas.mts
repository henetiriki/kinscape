import { z } from 'zod';

import { fuzzyDateText } from '#ks/lib/domain/dates/schemas.mts';
import { parsePersonId } from '#ks/lib/domain/ids/ids.mts';
import { idField } from '#ks/lib/domain/ids/schemas.mts';

/** The most Persons a list returns: the NFR sizing of a Tree, so a response has a cap. */
export const MAX_LISTED = 2000;

/** The caps of a name and of notes, so a form can stop typing at the same point. */
export const MAX_NAME = 200;
export const MAX_NOTES = 10_000;
const MAX_VARIANTS = 20;

/** Postgres `text` refuses a NUL character, so the schema refuses it for both stores. */
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(value => !value.includes('\0'), 'contains a NUL character');

const name = text(MAX_NAME).default('');

/** What a client may save (PPL-01): no field is required, and the schema trims and caps text. */
export const personInputSchema = z.object({
  birth: fuzzyDateText,
  death: fuzzyDateText,
  deceased: z.boolean().default(false),
  givenNames: name,
  id: idField(parsePersonId),
  maidenName: name,
  notes: text(MAX_NOTES).default(''),
  sex: z.enum(['F', 'M', 'U', 'X']).default('U'),
  surname: name,
  variants: z.array(text(MAX_NAME)).max(MAX_VARIANTS).default([]),
});

const requiredName = name.refine(value => value !== '', 'required');

/** What the form saves (PPL-01): `personInputSchema` with given names and surname required. */
export const personFormSchema = personInputSchema.extend({
  givenNames: requiredName,
  surname: requiredName,
});
