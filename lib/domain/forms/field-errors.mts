import type { FormIssue } from '#ks/lib/domain/forms/types.ts';

/**
 * Gathers the field errors of a failed parse. `fieldError` is the field table of one form: it gives
 * the field and error kind of an issue, or undefined for an issue that no form field owns. Gives
 * undefined if any issue has no field, so the caller can stop the whole input.
 */
export const collectFieldErrors = <Fields extends object>(
  issues: readonly FormIssue[],
  fieldError: (
    issue: FormIssue
  ) => [keyof Fields, Fields[keyof Fields]] | undefined
): Fields | undefined => {
  const fields: Partial<Fields> = {};

  for (const issue of issues) {
    const entry = fieldError(issue);

    if (entry === undefined) {
      return undefined;
    }

    const [field, kind] = entry;

    fields[field] = kind;
  }

  return fields as Fields;
};
