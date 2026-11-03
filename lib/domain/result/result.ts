import type { Result } from '@ks/lib/domain/result/types.ts';

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <const E>(error: E): Result<never, E> => ({
  error,
  ok: false,
});
