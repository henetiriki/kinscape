/** The named media queries of `breakpoint.$extensions.kinscape.queries`, and the marker comment of each `@media` that uses one (SC.6). */

import type { DtcgTree } from '#ks/lib/design/types.ts';

import { isTree, resolvedText } from '#ks/lib/design/dtcg.mts';

/** A condition, its marker and the `{` after it. */
const MEDIA = /@media([^{]*?)\/\* breakpoint: ([^*]*?) \*\/(\s*)\{/g;
const REFERENCES = /\{([^{}]+)\}/g;
const SIZED = /@media[^{]*\b(?:width|height)\b/g;

/** Each named query of `tokens`, with the width and height references resolved. */
export const queriesOf = (tokens: DtcgTree): Record<string, string> => {
  const queries = (
    (tokens.breakpoint as DtcgTree | undefined)?.$extensions as
      { kinscape?: { queries?: Record<string, string> } } | undefined
  )?.kinscape?.queries;

  return Object.fromEntries(
    Object.entries(isTree(queries) ? queries : {}).map(([name, query]) => [
      name,
      String(query).replace(REFERENCES, (_, path: string) =>
        resolvedText(tokens, path)
      ),
    ])
  );
};

const lineOf = (text: string, at: number): number =>
  text.slice(0, at).split('\n').length;

/** One message for each width or height `@media` in `text` that has no marker, an unknown marker, or a condition that differs from the list. */
export const mediaProblems = (
  file: string,
  text: string,
  queries: Record<string, string>
): string[] => {
  const marked = new Set<number>();
  const problems: string[] = [];

  for (const match of text.matchAll(MEDIA)) {
    marked.add(match.index);

    const [, condition, name] = match;
    const at = `${file}:${lineOf(text, match.index)}`;

    if (!(name in queries)) {
      problems.push(`${at}: unknown breakpoint marker "${name}"`);
    } else if (condition.trim() !== queries[name]) {
      problems.push(
        `${at}: the condition of breakpoint "${name}" is not "${queries[name]}"`
      );
    }
  }

  for (const match of text.matchAll(SIZED)) {
    if (!marked.has(match.index)) {
      problems.push(
        `${file}:${lineOf(text, match.index)}: @media on a width or height has no \`/* breakpoint: name */\` marker`
      );
    }
  }

  return problems;
};

/** `text` with the condition of each marked `@media` written from `queries`. */
export const withQueries = (
  text: string,
  queries: Record<string, string>
): string =>
  text.replace(MEDIA, (_, __, name: string, space: string) => {
    if (!(name in queries)) {
      throw new Error(`unknown breakpoint marker "${name}"`);
    }

    return `@media ${queries[name]} /* breakpoint: ${name} */${space}{`;
  });
