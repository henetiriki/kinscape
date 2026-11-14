import type { FuzzyDateError } from '#ks/lib/domain/dates/types.ts';
import type {
  PersonFieldErrors,
  PersonInput,
} from '#ks/lib/domain/persons/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';

import { personFormSchema } from '#ks/lib/domain/persons/schemas.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';

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
