/** Local values: a custom property that holds one part's own size, with a reason from a short list. */

import type { LiteralProblem, LocalValue } from '#ks/lib/design/types.ts';

export const REASONS = ['shape', 'nudge', 'drawing'] as const;

/** True if `reason` is on the list. */
export const isListed = (reason: string): boolean =>
  (REASONS as readonly string[]).includes(reason);

const LOCAL = /\/\*\s*local:(.*?)\*\//;
const OWN = /\/\*\s*own:/;
const PROPERTY = /^\s*(--[\w-]+)\s*:\s*([^;]*?)\s*;/;

/** Each `local:` comment on a custom property line, with any reason. */
export const localValues = (css: string): LocalValue[] =>
  css.split('\n').flatMap((row, index) => {
    const reason = LOCAL.exec(row)?.[1];
    const property = PROPERTY.exec(row);

    return reason === undefined || property === null
      ? []
      : [
          {
            line: index + 1,
            name: property[1],
            reason: reason.trim(),
            value: property[2],
          },
        ];
  });

/** The problems of the local values and `own:` comments of one `.module.css` file. */
export const localProblems = (css: string): LiteralProblem[] =>
  css.split('\n').flatMap((row, index): LiteralProblem[] => {
    const line = index + 1;
    const reason = LOCAL.exec(row)?.[1]?.trim();

    if (OWN.test(row)) {
      return [
        {
          line,
          text: 'The own: comment is gone: use var(--token) or a local value',
        },
      ];
    }

    if (reason === undefined) return [];

    if (!PROPERTY.test(row)) {
      return [{ line, text: 'The local: comment is not on a custom property' }];
    }

    if (reason === '')
      return [{ line, text: 'The local: comment has no reason' }];

    return isListed(reason)
      ? []
      : [
          {
            line,
            text: `The local: reason "${reason}" is not listed: use ${REASONS.slice(0, -1).join(', ')} or ${REASONS.at(-1)}`,
          },
        ];
  });
