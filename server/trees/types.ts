import type { SessionStore } from '@ks/lib/domain/auth/types.ts';
import type { PersonId, RelationshipId } from '@ks/lib/domain/ids/types.ts';
import type { PersonInput, PersonView } from '@ks/lib/domain/persons/types.ts';
import type {
  Refusal,
  Relationship,
  RelationshipInput,
} from '@ks/lib/domain/relationships/types.ts';
import type { Result } from '@ks/lib/domain/result/types.ts';
import type { Tree, TreeStore, Viewer } from '@ks/lib/domain/trees/types.ts';

/** The Persons of the opened Tree. Each read passes `personView`. */
export type PersonGroup = {
  /** Saves a new Person; a repeat of an id returns the Person saved first. */
  create: (person: PersonInput) => Promise<Result<PersonView, 'not-found'>>;
  get: (id: PersonId) => Promise<PersonView | undefined>;
  list: () => Promise<PersonView[]>;
  /** `version` is the one the client read; a stale one gives `conflict`. */
  update: (
    person: PersonInput,
    version: number
  ) => Promise<Result<PersonView, 'conflict' | 'not-found'>>;
};

/** The Relationships of the opened Tree. Each write runs `checkRelationship` first (PPL-02). */
export type RelationshipGroup = {
  /** Saves a new Relationship; a repeat of an id returns the one saved first. */
  create: (
    relationship: RelationshipInput
  ) => Promise<Result<Relationship, 'not-found' | 'tree-full' | Refusal>>;
  get: (id: RelationshipId) => Promise<Relationship | undefined>;
  list: () => Promise<Relationship[]>;
  /**
   * `version` is the one the client read. A rule refusal shows before `conflict` or `not-found`.
   * `tree-full`: the Tree holds `MAX_RELATIONSHIPS`, so the rules cannot see every row.
   */
  update: (
    relationship: RelationshipInput,
    version: number
  ) => Promise<
    Result<Relationship, 'conflict' | 'not-found' | 'tree-full' | Refusal>
  >;
};

/** Maps a row to what the Viewer may see: the one place NFR-10 acts. Each group's reads pass through one. */
export type ToView<Row, View> = (viewer: Viewer, row: Row) => View;

/** What `openTree` needs; `appAdapters()` fits. `now` defaults to the clock. */
export type TreeDeps = {
  now?: () => Date;
  sessions: SessionStore;
  store: TreeStore;
};

/**
 * A Tree opened for a Viewer. Entity Specs add a group each, built in `openTree` over the store,
 * so every read passes a `ToView`.
 */
export type TreeRepository = {
  persons: PersonGroup;
  relationships: RelationshipGroup;
  tree: Tree;
  viewer: Viewer;
};
