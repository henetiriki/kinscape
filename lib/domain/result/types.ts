/** An expected outcome: a value, or a named failure. Expected failures don't throw. */
export type Result<T, E> = { error: E; ok: false } | { ok: true; value: T };
