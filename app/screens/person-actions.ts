'use server';

import type { SaveResult } from '@ks/features/people/components/types.ts';

/**
 * The stand-in save action of the `person-conflict` screen. It reads no input and touches no Tree,
 * so the screen shows the conflict without data.
 */
export const saveConflict = async (): Promise<SaveResult> => ({
  error: 'conflict',
  ok: false,
});
