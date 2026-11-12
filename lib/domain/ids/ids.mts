import type { AccountId, PersonId, TreeId } from '#ks/lib/domain/ids/types.ts';

/** Postgres throws on a malformed `uuid`, so an id is checked before it reaches a query. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The Account id for `text`, or undefined if it isn't a UUID. */
export const parseAccountId = (text: string): AccountId | undefined =>
  UUID.test(text) ? (text as AccountId) : undefined;

/** The Person id for `text` in lower case, as Postgres returns it, or undefined if it isn't a UUID. */
export const parsePersonId = (text: string): PersonId | undefined =>
  UUID.test(text) ? (text.toLowerCase() as PersonId) : undefined;

/** The Tree id for `text`, or undefined if it isn't a UUID. */
export const parseTreeId = (text: string): TreeId | undefined =>
  UUID.test(text) ? (text as TreeId) : undefined;
