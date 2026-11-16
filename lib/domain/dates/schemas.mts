import { z } from 'zod';

import type { FuzzyDate } from '#ks/lib/domain/dates/types.ts';

import { parseFuzzyDate } from '#ks/lib/domain/dates/fuzzy-date.mts';

/** Parse non-blank GEDCOM `text`, or add an issue and return `z.NEVER`. */
const parseText = (text: string, context: z.RefinementCtx): FuzzyDate => {
  const parsed = parseFuzzyDate(text);

  if (!parsed.ok) {
    context.addIssue({ code: 'custom', message: parsed.error });

    return z.NEVER;
  }

  return parsed.value;
};

/** A GEDCOM date as text; blank means no date. */
export const fuzzyDateText = z
  .string()
  .trim()
  .optional()
  .transform((text, context) =>
    text === undefined || text === '' ? undefined : parseText(text, context)
  )
  .optional();

/** A GEDCOM date as text; blank text and a missing value fail. */
export const requiredFuzzyDate = z
  .string()
  .trim()
  .min(1, 'required')
  .transform(parseText);
