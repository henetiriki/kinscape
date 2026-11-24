'use server';

import { z } from 'zod';

import type { MapPin, Pin, PinFieldErrors } from '@ks/lib/domain/pins/types.ts';
import type { Result } from '@ks/lib/domain/result/types.ts';
import type { TreeRepository } from '@ks/server/trees/types.ts';

import { checkPin, checkPinUpdate } from '@ks/lib/domain/pins/form.mts';
import { mapPins } from '@ks/lib/domain/pins/map-pins.mts';
import { spanOf } from '@ks/lib/domain/pins/span.mts';
import { err, ok } from '@ks/lib/domain/result/result.mts';
import { treeAction } from '@ks/server/action.mts';

/**
 * The saved Pin as the map holds it. It reads the Person and the Place by id and builds the entry
 * with `spanOf` and `mapPins`, as `/data/pins` does, so the answer and the list cannot differ. A
 * missing Person or Place gives `not-found`.
 */
const mapPinOf = async (
  tree: TreeRepository,
  pin: Pin
): Promise<Result<MapPin, 'not-found'>> => {
  const [person, place] = await Promise.all([
    tree.persons.get(pin.personId),
    tree.places.get(pin.placeId),
  ]);
  const [mapped] =
    person === undefined || place === undefined
      ? []
      : mapPins([{ ...pin, span: spanOf(pin.date, person) }], [place]);

  return mapped === undefined ? err('not-found') : ok(mapped);
};

/**
 * Saves a new Pin from the form (PIN-01, PIN-02). The raw input reaches `checkPin`, which gives an
 * error for each bad field. A new point saves its Place and the Pin together, or neither. A Person
 * or a Place in another Account's Tree gives `not-found`, as a missing one does. A repeat of the
 * same ids returns the Pin saved first. The answer is the `MapPin` of the saved Pin.
 */
export const createPinAction = treeAction(
  z.unknown(),
  async (
    tree,
    raw
  ): Promise<Result<MapPin, 'invalid' | 'not-found' | PinFieldErrors>> => {
    const checked = checkPin(raw);

    if (!checked.ok) {
      return checked;
    }

    const { pin, place } = checked.value;
    const saved = await (place === undefined
      ? tree.pins.create(pin)
      : tree.pins.createAt(pin, place));

    return saved.ok ? mapPinOf(tree, saved.value) : saved;
  }
);

/**
 * Updates a Pin from the form (PIN-02, PIN-04). The raw input reaches `checkPinUpdate`. "Place
 * stays" keeps the saved Place and its precision. A new point saves its Place and the update
 * together, or neither. A Person or Pin in another Account's Tree gives `not-found`, as a missing
 * one does. A stale `version` gives `conflict`, so a repeat of a saved update saves no second Place.
 * The answer is the `MapPin` of the saved Pin.
 */
export const updatePinAction = treeAction(
  z.unknown(),
  async (
    tree,
    raw
  ): Promise<
    Result<MapPin, 'conflict' | 'invalid' | 'not-found' | PinFieldErrors>
  > => {
    const checked = checkPinUpdate(raw);

    if (!checked.ok) {
      return checked;
    }

    const { pin, place, version } = checked.value;
    let saved: Result<
      Pin,
      'conflict' | 'invalid' | 'not-found' | PinFieldErrors
    >;

    if (place !== undefined) {
      saved = await tree.pins.updateAt(
        { ...pin, placeId: place.id },
        place,
        version
      );
    } else {
      const current = await tree.pins.get(pin.id);

      saved =
        current === undefined
          ? err('not-found')
          : await tree.pins.update(
              { ...pin, placeId: current.placeId },
              version
            );
    }

    return saved.ok ? mapPinOf(tree, saved.value) : saved;
  }
);
