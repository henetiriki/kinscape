'use server';

import type { SaveResult } from '@ks/features/people/components/types.ts';

/**
 * Stand-ins for the save actions of the `person-*` screens. They read no input and touch no Tree,
 * so a screen shows one outcome of Save without data.
 */
export const saveFailed = async (): Promise<SaveResult> => ({
  error: 'not-found',
  ok: false,
});

export const saveConflict = async (): Promise<SaveResult> => ({
  error: 'conflict',
  ok: false,
});
