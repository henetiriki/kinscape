'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type {
  PersonFieldErrors,
  PersonView,
} from '@ks/lib/domain/persons/types.ts';
import type {
  Relationship,
  RelationshipSaveError,
} from '@ks/lib/domain/relationships/types.ts';
import type { Result } from '@ks/lib/domain/result/types.ts';

import { checkPerson } from '@ks/lib/domain/persons/form.mts';
import { checkRelationshipInput } from '@ks/lib/domain/relationships/form.mts';
import { treeAction } from '@ks/server/action.mts';

type Saved<E extends string> = Result<
  PersonView,
  'invalid' | 'not-found' | E | PersonFieldErrors
>;

/**
 * After a save, drops the cached pages under `/people`. Back to `/people/{id}` then reads the
 * saved Person, so its form holds the new `version` and the next Save is not a false conflict.
 */
const revalidated = <T extends { ok: boolean }>(saved: T): T => {
  if (saved.ok) {
    revalidatePath('/people', 'layout');
  }

  return saved;
};

/**
 * Saves a new Person from the form (PPL-01). The raw input reaches `checkPerson`, which gives an
 * error for each bad field. A repeat of the same id returns the Person saved first.
 */
export const createPersonAction = treeAction(
  z.unknown(),
  async (tree, raw): Promise<Saved<never>> => {
    const checked = checkPerson(raw);

    return checked.ok
      ? revalidated(await tree.persons.create(checked.value))
      : checked;
  }
);

/**
 * Saves a change to a Person. `version` is the one the client read; a stale one gives `conflict`.
 * A Person in another Account's Tree gives `not-found`, as a missing one does.
 */
export const updatePersonAction = treeAction(
  z.object({ person: z.unknown(), version: z.number().int().positive() }),
  async (tree, { person, version }): Promise<Saved<'conflict'>> => {
    const checked = checkPerson(person);

    return checked.ok
      ? revalidated(await tree.persons.update(checked.value, version))
      : checked;
  }
);

type RelationshipSaved = Result<Relationship, RelationshipSaveError>;

/**
 * Saves a new Relationship (PPL-02). A rule refusal, a full Tree or a bad input gives its code and
 * saves nothing. A repeat of the same id returns the Relationship saved first.
 */
export const createRelationshipAction = treeAction(
  z.unknown(),
  async (tree, raw): Promise<RelationshipSaved> => {
    const checked = checkRelationshipInput(raw);

    return checked.ok
      ? revalidated(await tree.relationships.create(checked.value))
      : checked;
  }
);

/**
 * Saves a change to a Relationship. `version` is the one the client read; a stale one gives
 * `conflict`. A change of type or of a Person, or another Account's Relationship, gives
 * `not-found`.
 */
export const updateRelationshipAction = treeAction(
  z.object({
    relationship: z.unknown(),
    version: z.number().int().positive(),
  }),
  async (tree, { relationship, version }): Promise<RelationshipSaved> => {
    const checked = checkRelationshipInput(relationship);

    return checked.ok
      ? revalidated(await tree.relationships.update(checked.value, version))
      : checked;
  }
);
