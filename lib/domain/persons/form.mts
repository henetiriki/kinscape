import type { FuzzyDateError } from '#ks/lib/domain/dates/types.ts';
import type { FormIssue } from '#ks/lib/domain/forms/types.ts';
import type {
  PersonFieldErrors,
  PersonInput,
} from '#ks/lib/domain/persons/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';

import { fuzzyDateMessage } from '#ks/lib/domain/dates/fuzzy-date-text.mts';
import { collectFieldErrors } from '#ks/lib/domain/forms/field-errors.mts';
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

type Fields = PersonFieldErrors['fields'];

/** The field table of the Person form: the field and error kind of an issue. */
const personFieldError = ({
  code,
  message,
  path,
}: FormIssue): [keyof Fields, Fields[keyof Fields]] | undefined => {
  const [field] = path;

  if (path.length !== 1) {
    return undefined;
  }

  if (
    (field === 'givenNames' || field === 'surname') &&
    message === 'required'
  ) {
    return [field, 'required'];
  }

  if (field === 'variants' && code === 'too_big') {
    return ['variants', 'too-many'];
  }

  return (field === 'birth' || field === 'death') && code === 'custom'
    ? [field, message as FuzzyDateError]
    : undefined;
};

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

  const fields = collectFieldErrors<PersonFieldErrors['fields']>(
    parsed.error.issues,
    personFieldError
  );

  return fields ? err({ fields }) : err('invalid');
};
