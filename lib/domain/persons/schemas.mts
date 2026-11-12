import { z } from 'zod';

import type { PersonId } from '#ks/lib/domain/ids/types.ts';

import { parseFuzzyDate } from '#ks/lib/domain/dates/fuzzy-date.mts';
import { parsePersonId } from '#ks/lib/domain/ids/ids.mts';

/** The most Persons a list returns: the NFR sizing of a Tree, so a response has a cap. */
export const MAX_LISTED = 2000;

const MAX_NAME = 200;
const MAX_VARIANTS = 20;
const MAX_NOTES = 10_000;

const name = z.string().trim().max(MAX_NAME).default('');

/** A GEDCOM date as text; blank means no date. */
const date = z
  .string()
  .trim()
  .optional()
  .transform((text, context) => {
    if (text === undefined || text === '') {
      return undefined;
    }

    const parsed = parseFuzzyDate(text);

    if (!parsed.ok) {
      context.addIssue({ code: 'custom', message: parsed.error });

      return z.NEVER;
    }

    return parsed.value;
  })
  .optional();

/** What a client may save (PPL-01): no field is required, and the schema trims and caps text. */
export const personInputSchema = z.object({
  birth: date,
  death: date,
  deceased: z.boolean().default(false),
  givenNames: name,
  id: z.string().transform((text, context): PersonId => {
    const id = parsePersonId(text);

    if (id === undefined) {
      context.addIssue({ code: 'custom', message: 'not a UUID' });

      return z.NEVER;
    }

    return id;
  }),
  maidenName: name,
  notes: z.string().trim().max(MAX_NOTES).default(''),
  sex: z.enum(['F', 'M', 'U', 'X']).default('U'),
  surname: name,
  variants: z
    .array(z.string().trim().max(MAX_NAME))
    .max(MAX_VARIANTS)
    .default([]),
});
