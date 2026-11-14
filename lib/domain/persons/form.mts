import type { FuzzyDateError } from '#ks/lib/domain/dates/types.ts';
import type {
  PersonFieldErrors,
  PersonInput,
} from '#ks/lib/domain/persons/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';

import { fuzzyDateMessage } from '#ks/lib/domain/dates/fuzzy-date-text.mts';
import { personFormSchema } from '#ks/lib/domain/persons/schemas.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';

/**
 * The message of each field error. A date message reads the field's text in `texts`, because the
 * error kind does not say which month or dates the text names.
 */
export const personFieldMessages = (
  fields: PersonFieldErrors['fields'],
  texts: { birth: string; death: string }
): Partial<Record<keyof PersonFieldErrors['fields'], string>> => ({
  ...(fields.birth && { birth: fuzzyDateMessage(fields.birth, texts.birth) }),
  ...(fields.death && { death: fuzzyDateMessage(fields.death, texts.death) }),
  ...(fields.givenNames && { givenNames: 'Enter the given names.' }),
  ...(fields.surname && { surname: 'Enter the surname.' }),
  ...(fields.variants && { variants: 'Use at most 20 spellings.' }),
});

/**
 * Checks a Person from the form (PPL-01). A blank name, too many spelling variants or a bad date
 * gives an error for that field. Any other bad input gives `invalid` for the whole input. An
 * error names a kind, never the input text.
 */
export const checkPerson = (
  raw: unknown
): Result<PersonInput, 'invalid' | PersonFieldErrors> => {
  const parsed = personFormSchema.safeParse(raw);

  if (parsed.success) {
    return ok(parsed.data);
  }

  const fields: PersonFieldErrors['fields'] = {};

  for (const { code, message, path } of parsed.error.issues) {
    const [field] = path;

    if (
      path.length === 1 &&
      (field === 'givenNames' || field === 'surname') &&
      message === 'required'
    ) {
      fields[field] = 'required';
      continue;
    }

    if (path.length === 1 && field === 'variants' && code === 'too_big') {
      fields.variants = 'too-many';
      continue;
    }

    if (
      path.length === 1 &&
      (field === 'birth' || field === 'death') &&
      code === 'custom'
    ) {
      fields[field] = message as FuzzyDateError;
      continue;
    }

    return err('invalid');
  }

  return err({ fields });
};
