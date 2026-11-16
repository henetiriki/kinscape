/** An Account's id: a UUID, made only by `parseAccountId`. */
export type AccountId = { brand: 'AccountId' } & string;

/** A Person's id: a UUIDv7 the client sends, made only by `parsePersonId`. */
export type PersonId = { brand: 'PersonId' } & string;

/** A Pin's id: a UUID the client sends. Only `parsePinId` makes it. */
export type PinId = { brand: 'PinId' } & string;

/** A Place's id: a UUID the client sends. Only `parsePlaceId` makes it. */
export type PlaceId = { brand: 'PlaceId' } & string;

/** A Relationship's id: a UUID the client sends. Only `parseRelationshipId` makes it. */
export type RelationshipId = { brand: 'RelationshipId' } & string;

/** A Tree's id: a UUID, made only by `parseTreeId`. */
export type TreeId = { brand: 'TreeId' } & string;
