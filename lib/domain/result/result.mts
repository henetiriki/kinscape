import type { Result } from './types.ts';

export const ok = <T,>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <const E,>(error: E): Result<never, E> => ({
  error,
  ok: false,
});
