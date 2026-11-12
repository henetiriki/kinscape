/** An Account's id: a UUID, made only by `parseAccountId`. */
export type AccountId = { brand: 'AccountId' } & string;

/** A Person's id: a UUIDv7 the client sends, made only by `parsePersonId`. */
export type PersonId = { brand: 'PersonId' } & string;

/** A Tree's id: a UUID, made only by `parseTreeId`. */
export type TreeId = { brand: 'TreeId' } & string;
