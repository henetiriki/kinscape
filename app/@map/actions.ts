'use server';

import { z } from 'zod';

import type { Pin, PinFieldErrors } from '@ks/lib/domain/pins/types.ts';
import type { Result } from '@ks/lib/domain/result/types.ts';

import { checkPin } from '@ks/lib/domain/pins/form.mts';
import { treeAction } from '@ks/server/action.mts';

/**
 * Saves a new Pin from the form (PIN-01, PIN-02). The raw input reaches `checkPin`, which gives an
 * error for each bad field. A new point saves its Place and the Pin together, or neither. A Person
 * or a Place in another Account's Tree gives `not-found`, as a missing one does. A repeat of the
 * same ids returns the Pin saved first.
 */
export const createPinAction = treeAction(
  z.unknown(),
  async (
    tree,
    raw
  ): Promise<Result<Pin, 'invalid' | 'not-found' | PinFieldErrors>> => {
    const checked = checkPin(raw);

    if (!checked.ok) {
      return checked;
    }

    const { pin, place } = checked.value;

    return place === undefined
      ? tree.pins.create(pin)
      : tree.pins.createAt(pin, place);
  }
);
