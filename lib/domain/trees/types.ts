import type { Day } from '@ks/lib/domain/boundaries/types.ts';
import type {
  AccountId,
  PersonId,
  PinId,
  PlaceId,
  RelationshipId,
  TreeId,
} from '@ks/lib/domain/ids/types.ts';
import type { Person, PersonInput } from '@ks/lib/domain/persons/types.ts';
import type { Pin, PinInput, SpannedPin } from '@ks/lib/domain/pins/types.ts';
import type { Place, PlaceInput } from '@ks/lib/domain/places/types.ts';
import type {
  Relationship,
  RelationshipInput,
} from '@ks/lib/domain/relationships/types.ts';
import type { Result } from '@ks/lib/domain/result/types.ts';

/** A synthetic Account for `memoryStore`; `trees` may be empty. */
export type SeedAccount = {
  id: AccountId;
  issuer: string;
  subject: string;
  trees: SeedTree[];
};

export type Tree = { id: TreeId; name: string };

/** Whose Tree a method reads or writes. Every method checks that the Account may access the Tree. */
export type TreeScope = { accountId: AccountId; treeId: TreeId };

/** Every read takes the Account id and joins `tree_account`, so no read skips the check. */
export type TreeStore = {
  /** Creates the Account, a Tree and the link in one step; `exists` if the identity has an Account. */
  addAccount: (
    input: NewAccount
  ) => Promise<Result<{ accountId: AccountId; treeId: TreeId }, 'exists'>>;
  /**
   * Saves a new Person at version 1 and returns it. A second call with the same id changes
   * nothing and returns the Person already saved. Undefined if the Account may not access the Tree.
   */
  addPerson: (
    input: { person: PersonInput } & TreeScope
  ) => Promise<Person | undefined>;
  /**
   * Saves a new Pin at version 1 and returns it. A second call with the same id changes nothing and
   * returns the Pin already saved. `not-found` if the Person or the Place is not in the Tree, or the
   * Account may not access the Tree, or an id is not a UUID.
   */
  addPin: (
    input: { pin: PinInput } & TreeScope
  ) => Promise<Result<Pin, 'not-found'>>;
  /**
   * Saves a new Place and a Pin at it, or neither. The Pin joins `place`, whatever `pin.placeId`
   * says. A second call with the same ids changes nothing and returns the Pin already saved.
   * `not-found` if the Person is not in the Tree, or the Account may not access the Tree, or an id
   * is not a UUID. A Place saved before the call stays.
   */
  addPinAt: (
    input: { pin: PinInput; place: PlaceInput } & TreeScope
  ) => Promise<Result<Pin, 'not-found'>>;
  /**
   * Saves a new Place at version 1 and returns it. A second call with the same id changes nothing
   * and returns the Place already saved. `not-found` if the Account may not access the Tree or the
   * id is not a UUID.
   */
  addPlace: (
    input: { place: PlaceInput } & TreeScope
  ) => Promise<Result<Place, 'not-found'>>;
  /**
   * Saves a new Relationship at version 1 and returns it. A second call with the same id changes
   * nothing and returns the Relationship already saved. `not-found` if either Person is not in the
   * Tree, or the Account may not access the Tree, or an id is not a UUID.
   */
  addRelationship: (
    input: { relationship: RelationshipInput } & TreeScope
  ) => Promise<Result<Relationship, 'not-found'>>;
  /** The Account for a sign-in identity, or undefined. */
  findAccount: (
    issuer: string,
    subject: string
  ) => Promise<Account | undefined>;
  /** The Person, or undefined if missing, in another Tree or in a Tree the Account may not access. */
  findPerson: (
    input: { personId: PersonId } & TreeScope
  ) => Promise<Person | undefined>;
  /** The Pin, or undefined if missing, in another Tree or in a Tree the Account may not access. */
  findPin: (input: { pinId: PinId } & TreeScope) => Promise<Pin | undefined>;
  /** The Place, or undefined if missing, in another Tree or in a Tree the Account may not access. */
  findPlace: (
    input: { placeId: PlaceId } & TreeScope
  ) => Promise<Place | undefined>;
  /** The Relationship, or undefined if missing, in another Tree or in a Tree the Account may not access. */
  findRelationship: (
    input: { relationshipId: RelationshipId } & TreeScope
  ) => Promise<Relationship | undefined>;
  /** The Tree only if the Account may access it; otherwise undefined, as for a missing Tree or an id that isn't a UUID. */
  findTree: (ids: {
    accountId: AccountId;
    treeId: TreeId;
  }) => Promise<Tree | undefined>;
  /** The Account's Trees ordered by id; empty for an Account with none, an unknown id or an id that isn't a UUID. */
  findTrees: (accountId: AccountId) => Promise<Tree[]>;
  /**
   * At most `MAX_LISTED` Persons, ordered by surname, given names, then id. Empty if the Account
   * may not access the Tree.
   */
  listPersons: (scope: TreeScope) => Promise<Person[]>;
  /**
   * At most `MAX_PINS` of the Tree's Pins, ordered by id, each with its span (PIN-04). Empty if the
   * Account may not access the Tree.
   */
  listPins: (scope: TreeScope) => Promise<SpannedPin[]>;
  /**
   * At most `MAX_PINS` Pins whose span holds `day` under `isCurrentOn`, ordered by id. Both reads
   * use the Person as saved. Empty if the Account may not access the Tree.
   */
  listPinsOn: (input: { day: Day } & TreeScope) => Promise<Pin[]>;
  /** At most `MAX_PLACES` of the Tree's Places, ordered by id. Empty if the Account may not access the Tree. */
  listPlaces: (scope: TreeScope) => Promise<Place[]>;
  /** At most `MAX_RELATIONSHIPS` of the Tree's Relationships, ordered by id. Empty if the Account may not access the Tree. */
  listRelationships: (scope: TreeScope) => Promise<Relationship[]>;
  /**
   * Replaces the Person if `version` is the one saved. `conflict` for a stale version; `not-found`
   * for a missing Person, another Account's Tree or an id that isn't a UUID.
   */
  updatePerson: (
    input: { person: PersonInput; version: number } & TreeScope
  ) => Promise<Result<Person, 'conflict' | 'not-found'>>;
  /**
   * Replaces every field of the Pin, including its Person and Place, if `version` is the one saved.
   * `conflict` for a stale version.
   * `not-found` for a missing Pin, a Person or Place that is not in the Tree, another Account's
   * Tree or an id that isn't a UUID.
   */
  updatePin: (
    input: { pin: PinInput; version: number } & TreeScope
  ) => Promise<Result<Pin, 'conflict' | 'not-found'>>;
  /**
   * Saves a new Place and the update of a Pin at it, or neither. The Pin joins `place`, whatever
   * `pin.placeId` says, as in `addPinAt`. Results as `updatePin`. A Place saved before the call
   * stays, so a repeat of an update that saved gives `conflict` and saves no second Place.
   */
  updatePinAt: (
    input: { pin: PinInput; place: PlaceInput; version: number } & TreeScope
  ) => Promise<Result<Pin, 'conflict' | 'not-found'>>;
  /**
   * Replaces the latitude, longitude and precision if `version` is the one saved. `conflict` for a
   * stale version; `not-found` for a missing Place, another Account's Tree or an id that isn't a UUID.
   */
  updatePlace: (
    input: { place: PlaceInput; version: number } & TreeScope
  ) => Promise<Result<Place, 'conflict' | 'not-found'>>;
  /**
   * Replaces the subtype or the dates if `version` is the one saved. The saved row must have the
   * same type and Persons as the input. `conflict` for a stale version; `not-found` for a missing
   * Relationship, one with other Persons or another type, another Account's Tree or an id that isn't a UUID.
   */
  updateRelationship: (
    input: { relationship: RelationshipInput; version: number } & TreeScope
  ) => Promise<Result<Relationship, 'conflict' | 'not-found'>>;
};

/** Whoever reads a Tree: an Account now; publishing adds anyone (NFR-10). Only `openTree` makes one. */
export type Viewer = { accountId: AccountId };

type Account = { id: AccountId };

type NewAccount = {
  issuer: string;
  subject: string;
  treeName: string;
};

/** A Tree with preset rows, saved at version 1. A Relationship's Persons must be in `persons`. */
type SeedTree = {
  persons?: PersonInput[];
  relationships?: RelationshipInput[];
} & Tree;
