import type { RelationshipInput } from '#ks/lib/domain/relationships/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';

import {
  DIVORCE_BEFORE_MARRIAGE,
  relationshipInputSchema,
} from '#ks/lib/domain/relationships/schemas.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';

/**
 * Checks a Relationship from the client (PPL-02). A divorce before the marriage gives
 * `divorce-before-marriage`. Any other bad input gives `invalid`.
 */
export const checkRelationshipInput = (
  raw: unknown
): Result<RelationshipInput, 'divorce-before-marriage' | 'invalid'> => {
  const parsed = relationshipInputSchema.safeParse(raw);

  if (parsed.success) {
    return ok(parsed.data);
  }

  const [issue] = parsed.error.issues;

  return err(
    parsed.error.issues.length === 1 &&
      issue.message === DIVORCE_BEFORE_MARRIAGE
      ? 'divorce-before-marriage'
      : 'invalid'
  );
};
