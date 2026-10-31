/** The usage notes in `design/tokens.json`: which tokens need one, and what is wrong with the notes. */

import type { Tree } from '../../design/types.ts';

import { isTree, resolveTokens } from '../../design/tokens.mts';
import { coloursIn } from './css.mts';

/** Groups where every token needs a note. `type` needs one per style, `map` one per colour. */
const GROUPS = new Set([
  'colour',
  'focus',
  'font',
  'radius',
  'shadow',
  'size',
  'space',
]);

type Entry<T> = [string, T];

const leaves = (node: Tree, path: string[]): Entry<number | string>[] =>
  Object.entries(node).flatMap(([key, child]) =>
    isTree(child)
      ? leaves(child, [...path, key])
      : [[[...path, key].join('.'), child] as Entry<number | string>]
  );

const valued = (node: Tree, path: string[]): Entry<string>[] =>
  leaves(node, path).map(([name, value]) => [name, String(value)]);

/** Each token that needs a note, as `[path, value]`; a `type` style has no single value. */
const needed = (tokens: Tree): Entry<string | undefined>[] =>
  Object.entries(tokens).flatMap(
    ([group, child]): Entry<string | undefined>[] => {
      if (!isTree(child)) {
        return [];
      }

      if (group === 'type') {
        return Object.keys(child).map(style => [`type.${style}`, undefined]);
      }

      if (group === 'map') {
        return valued(child, [group]).filter(
          ([, value]) => coloursIn(value).length > 0
        );
      }

      return GROUPS.has(group) ? valued(child, [group]) : [];
    }
  );

/** One message per problem: a missing, empty or value-repeating note, or a note for no token that needs one. */
export const noteProblems = (tokens: Tree): string[] => {
  const { notes, ...rest } = tokens;
  const written = new Map<string, number | string>(
    isTree(notes) ? leaves(notes, []) : []
  );
  const wanted = needed(resolveTokens(rest));
  const paths = new Set(wanted.map(([path]) => path));

  return [
    ...wanted.flatMap(([path, value]) => {
      const note = written.get(path);

      if (typeof note !== 'string') {
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
      .map(path => `notes.${path} names no token that needs a note`),
  ];
};
