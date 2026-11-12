import { z } from 'zod';

import { parseFuzzyDate } from '#ks/lib/domain/dates/fuzzy-date.mts';

/** A GEDCOM date as text; blank means no date. */
export const fuzzyDateText = z
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
