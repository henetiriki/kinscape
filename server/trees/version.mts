const MAX_VERSION = 2_147_483_647;

/** Whether `version` fits the `int4` column: Postgres throws on any other number. */
export const isVersion = (version: number): boolean =>
  Number.isInteger(version) && version >= 1 && version <= MAX_VERSION;
