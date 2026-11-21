import type { FuzzyDateError } from '#ks/lib/domain/dates/types.ts';
import type { FormIssue } from '#ks/lib/domain/forms/types.ts';
import type {
  CheckedPin,
  CheckedPinUpdate,
  PinFieldErrors,
} from '#ks/lib/domain/pins/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';

import { collectFieldErrors } from '#ks/lib/domain/forms/field-errors.mts';
import {
  pinFormSchema,
  pinUpdateSchema,
} from '#ks/lib/domain/pins/schemas.mts';
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

/** The field table of the Pin form: the field and error kind of an issue. */
const pinFieldError = (
  issue: FormIssue,
  raw: unknown
): [keyof Fields, Fields[keyof Fields]] | undefined => {
  const field = fieldOf(issue.path);
  const { code, message, path } = issue;

  if (field === undefined) {
    return undefined;
  }

  if (REQUIRED.has(field) && isBlank(valueAt(raw, path))) {
    return [field, 'required'];
  }

  if (
    (field === 'eventType' || field === 'precision') &&
    code === 'invalid_value'
  ) {
    return [field, 'unknown'];
  }

  if (field === 'date' && code === 'custom') {
    return [field, message as FuzzyDateError];
  }

  if (field === 'latitude' || field === 'longitude') {
    if (code === 'too_big' || code === 'too_small') {
      return [field, 'out-of-range'];
    }

    return [field, 'not-a-number'];
  }

  return TOO_LONG.has(field) && code === 'too_big'
    ? [field, 'too-long']
    : undefined;
};

/** The error of a failed parse: a field error for each bad field, or `invalid` for the input. */
const failure = (
  issues: FormIssue[],
  raw: unknown
): Result<never, 'invalid' | PinFieldErrors> => {
  const fields = collectFieldErrors<Fields>(issues, issue =>
    pinFieldError(issue, raw)
  );

  return fields ? err({ fields }) : err('invalid');
};

/**
 * Checks a Pin from the form (PIN-01, PIN-02, PIN-04). These inputs give an error for their field:
 * - a required field with no value
 * - a value outside its list or range
 * - a date that does not read
 * - a text that is too long
 *
 * Any other bad input gives `invalid` for the whole input. An error names a kind, never the input
 * text.
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

  return failure(parsed.error.issues, raw);
};

/**
 * Checks a Pin update (PIN-02, PIN-04) with the field rules and errors of `checkPin`. A bad
 * `version` or a wrong `place.kind` gives `invalid`. A new point gives its Place, and "stays" gives
 * none.
 */
export const checkPinUpdate = (
  raw: unknown
): Result<CheckedPinUpdate, 'invalid' | PinFieldErrors> => {
  const parsed = pinUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    return failure(parsed.error.issues, raw);
  }

  const { place, version, ...pin } = parsed.data;

  if (place.kind === 'stays') {
    return ok({ pin, version });
  }

  const { id, latitude, longitude, precision } = place;

  return ok({ pin, place: { id, latitude, longitude, precision }, version });
};
