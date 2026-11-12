import { z } from 'zod';

/** A Zod field for an id: the text must pass `parse`, which brands it. */
export const idField = <T extends string>(
  parse: (text: string) => T | undefined
) =>
  z.string().transform((text, context): T => {
    const id = parse(text);

    if (id === undefined) {
      context.addIssue({ code: 'custom', message: 'not a UUID' });

      return z.NEVER;
    }

    return id;
  });
