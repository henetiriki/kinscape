import { z } from 'zod';

/** Postgres `text` refuses a NUL character, so the schema refuses it for both stores. */
export const textField = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(value => !value.includes('\0'), 'contains a NUL character');
