import type {
  AccountId,
  PersonId,
  RelationshipId,
  TreeId,
} from '#ks/lib/domain/ids/types.ts';

/** Postgres throws on a malformed `uuid`, so an id is checked before it reaches a query. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The Account id for `text`, or undefined if it isn't a UUID. */
export const parseAccountId = (text: string): AccountId | undefined =>
  UUID.test(text) ? (text as AccountId) : undefined;

/** The Person id for `text` in lower case, as Postgres returns it, or undefined if it isn't a UUID. */
export const parsePersonId = (text: string): PersonId | undefined =>
  UUID.test(text) ? (text.toLowerCase() as PersonId) : undefined;

/** The Relationship id for `text` in lower case, as Postgres returns it, or undefined if it isn't a UUID. */
export const parseRelationshipId = (
  text: string
): RelationshipId | undefined =>
  UUID.test(text) ? (text.toLowerCase() as RelationshipId) : undefined;

/** A UUIDv7 for `time` (ms since the epoch): the form makes a Person id before it saves. */
export const uuidV7 = (time: number = Date.now()): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  for (let index = 0; index < 6; index += 1) {
    bytes[index] = Math.floor(time / 2 ** (8 * (5 - index))) % 256;
  }

  bytes[6] = 0x70 | (bytes[6] & 0x0f);
  bytes[8] = 0x80 | (bytes[8] & 0x3f);

  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));

  return [
    hex.slice(0, 4),
    hex.slice(4, 6),
    hex.slice(6, 8),
    hex.slice(8, 10),
    hex.slice(10),
  ]
    .map(part => part.join(''))
    .join('-');
};

/** The Tree id for `text`, or undefined if it isn't a UUID. */
export const parseTreeId = (text: string): TreeId | undefined =>
  UUID.test(text) ? (text as TreeId) : undefined;
