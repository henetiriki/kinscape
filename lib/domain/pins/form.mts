import type { FuzzyDateError } from '#ks/lib/domain/dates/types.ts';
import type { CheckedPin, PinFieldErrors } from '#ks/lib/domain/pins/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';

import { pinFormSchema } from '#ks/lib/domain/pins/schemas.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';

type Fields = PinFieldErrors['fields'];

const REQUIRED = new Set([
  'date',
  'eventType',
  'latitude',
  'longitude',
  'personId',
  'place',
]);
const TOO_LONG = new Set(['address', 'notes', 'sources']);

/** Whether the client sent no value, or only blanks. */
const isBlank = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '');

/** The value that `path` names in the raw input. */
const valueAt = (raw: unknown, path: PropertyKey[]): unknown =>
  path.reduce<unknown>(
    (value, key) => (value as Record<PropertyKey, unknown>)[key],
    raw
  );

/**
 * The form field of an issue, or undefined if the issue is not one that the form can make. The
 * fields are at the top, and `latitude`, `longitude` and `precision` sit under `place`.
 */
const fieldOf = (path: PropertyKey[]): keyof Fields | undefined => {
  const [head, tail] = path;

  if (path.length === 1) {
    return head as keyof Fields;
  }

  return path.length === 2 && head === 'place'
    ? (tail as keyof Fields)
    : undefined;
};

/**
 * Adds the error kind of one issue to `fields`. Gives false for an issue that no form field owns
 * or that the form already stops.
 */
const addIssue = (
  fields: Fields,
  raw: unknown,
  issue: { code: string; message: string; path: PropertyKey[] }
): boolean => {
  const field = fieldOf(issue.path);
  const { code, message, path } = issue;

  if (field === undefined) {
    return false;
  }

  const set = fields as Record<string, string>;

  if (REQUIRED.has(field) && isBlank(valueAt(raw, path))) {
    set[field] = 'required';
  } else if (
    (field === 'eventType' || field === 'precision') &&
    code === 'invalid_value'
  ) {
    set[field] = 'unknown';
  } else if (field === 'date' && code === 'custom') {
    fields.date = message as FuzzyDateError;
  } else if (
    (field === 'latitude' || field === 'longitude') &&
    (code === 'too_big' || code === 'too_small')
  ) {
    set[field] = 'out-of-range';
  } else if (
    (field === 'latitude' || field === 'longitude') &&
    code === 'invalid_type'
  ) {
    set[field] = 'not-a-number';
  } else if (TOO_LONG.has(field) && code === 'too_big') {
    set[field] = 'too-long';
  } else {
    return false;
  }

  return true;
};

/**
 * Checks a Pin from the form (PIN-01, PIN-02, PIN-04). A required field with no value, a value
 * outside its list or range, a date that does not read or a text that is too long gives an error
 * for that field. Any other bad input gives `invalid` for the whole input. An error names a kind,
 * never the input text.
 */
export const checkPin = (
  raw: unknown
): Result<CheckedPin, 'invalid' | PinFieldErrors> => {
  const parsed = pinFormSchema.safeParse(raw);

  if (parsed.success) {
    const { place, ...rest } = parsed.data;
    const { kind, ...point } = place;

    return ok({
      pin: { ...rest, placeId: place.id },
      ...(kind === 'new' && { place: point as CheckedPin['place'] }),
    });
  }

  const fields: Fields = {};

  for (const issue of parsed.error.issues) {
    if (!addIssue(fields, raw, issue)) {
      return err('invalid');
    }
  }

  return err({ fields });
};
