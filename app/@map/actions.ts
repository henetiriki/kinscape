'use server';

import { z } from 'zod';

import type { Pin, PinFieldErrors } from '@ks/lib/domain/pins/types.ts';
import type { Result } from '@ks/lib/domain/result/types.ts';

import { checkPin, checkPinUpdate } from '@ks/lib/domain/pins/form.mts';
import { err } from '@ks/lib/domain/result/result.mts';
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

/**
 * Updates a Pin from the form (PIN-02, PIN-04). The raw input reaches `checkPinUpdate`. "Place
 * stays" keeps the saved Place and its precision. A new point saves its Place and the update
 * together, or neither. A Person or Pin in another Account's Tree gives `not-found`, as a missing
 * one does. A stale `version` gives `conflict`, so a repeat of a saved update saves no second Place.
 */
export const updatePinAction = treeAction(
  z.unknown(),
  async (
    tree,
    raw
  ): Promise<
    Result<Pin, 'conflict' | 'invalid' | 'not-found' | PinFieldErrors>
  > => {
    const checked = checkPinUpdate(raw);

    if (!checked.ok) {
      return checked;
    }

    const { pin, place, version } = checked.value;

    if (place !== undefined) {
      return tree.pins.updateAt({ ...pin, placeId: place.id }, place, version);
    }

    const saved = await tree.pins.get(pin.id);

    return saved === undefined
      ? err('not-found')
      : tree.pins.update({ ...pin, placeId: saved.placeId }, version);
  }
);
