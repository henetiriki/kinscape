'use server';

import type { RelationshipSaveResult } from '@ks/features/people/components/types.ts';

/**
 * Stand-in for the Relationship actions of the `relationship-*` screens. It reads no input and
 * touches no Tree, so a screen never saves.
 */
export const saveNothing = async (): Promise<RelationshipSaveResult> => ({
  error: 'invalid',
  ok: false,
});
