/** An Account's id: a UUID, made only by `parseAccountId`. */
export type AccountId = { brand: 'AccountId' } & string;

/** A Tree's id: a UUID, made only by `parseTreeId`. */
export type TreeId = { brand: 'TreeId' } & string;
