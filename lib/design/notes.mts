/** The usage notes in `design/kinscape.tokens.json`: which tokens need one, and what is wrong with the notes. */

import type { DtcgTree } from '#ks/lib/design/types.ts';

import { coloursIn } from '#ks/lib/design/css.mts';
import {
  isTree,
  notesOf,
  resolvedText,
  tokenLeaves,
} from '#ks/lib/design/dtcg.mts';

/** Groups where every token needs a note. `type` needs one per style, `map` one per colour. */
const GROUPS = new Set([
  'breakpoint',
  'colour',
  'focus',
  'font',
  'layout',
  'radius',
  'shadow',
  'size',
  'space',
  'z',
]);

type Entry<T> = [string, T];

const valued = (tokens: DtcgTree, group: string): Entry<string>[] =>
  tokenLeaves(tokens[group] as DtcgTree, [group]).map(({ path }) => {
    const name = path.join('.');

    return [name, resolvedText(tokens, name)];
  });

/** Each token that needs a note, as `[path, value]`; a `type` style has no single value. */
const needed = (tokens: DtcgTree): Entry<string | undefined>[] =>
  Object.entries(tokens).flatMap(
    ([group, child]): Entry<string | undefined>[] => {
      // A `$description` at the root is text, not a group.
      if (!isTree(child)) {
        return [];
      }

      if (group === 'type') {
        return Object.keys(child)
          .filter(style => !style.startsWith('$'))
          .map(style => [`type.${style}`, undefined]);
      }

      if (group === 'map') {
        return valued(tokens, group).filter(
          ([, value]) => coloursIn(value).length > 0
        );
      }

      return GROUPS.has(group) ? valued(tokens, group) : [];
    }
  );

/** One message per problem: a missing, empty or value-repeating note, or a note for no token that needs one. */
export const noteProblems = (tokens: DtcgTree): string[] => {
  const written = notesOf(tokens);
  const wanted = needed(tokens);
  const paths = new Set(wanted.map(([path]) => path));

  return [
    ...wanted.flatMap(([path, value]) => {
      const note = written.get(path);

      if (note === undefined) {
        return [`${path} has no note`];
      }

      if (note.trim() === '') {
        return [`${path} has an empty note`];
      }

      return value !== undefined &&
        note.toLowerCase().includes(value.toLowerCase())
        ? [`${path}: its note repeats the value`]
        : [];
    }),
    ...[...written.keys()]
      .filter(path => !paths.has(path))
      .map(path => `${path}: a note where none is needed`),
  ];
};
