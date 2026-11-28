/** The control sizes (`size.control-*`): each holds a line, an inset step and a border in `$extensions.kinscape.control` (SC.13 plan D11). */

import type { ControlParts, DtcgTree } from '#ks/lib/design/types.ts';

import { cssName } from '#ks/lib/design/css.mts';
import {
  referenceIn,
  resolvedText,
  tokenLeaves,
} from '#ks/lib/design/dtcg.mts';
import { REM_PX } from '#ks/lib/design/groups.mts';

/** The parts of a control size, or `undefined` for a token that is not one. */
export const controlOf = (token: {
  [key: string]: unknown;
  $extensions?: unknown;
}): ControlParts | undefined =>
  (token.$extensions as { kinscape?: { control?: ControlParts } } | undefined)
    ?.kinscape?.control;

const nameOf = (reference: string): string =>
  cssName(referenceIn(reference)!.split('.'));

/** The height as CSS: it follows the reader's text size. */
export const controlCss = ({ border, inset, line }: ControlParts): string =>
  `calc(var(${nameOf(line)}) + 2 * var(${nameOf(inset)}) + 2 * var(${nameOf(border)}))`;

const px = (tree: DtcgTree, reference: string): number => {
  const text = resolvedText(tree, referenceIn(reference)!);

  return text.endsWith('rem')
    ? Number.parseFloat(text) * REM_PX
    : Number.parseFloat(text);
};

/** The height in px at a 16px root. */
const heightOf = (tree: DtcgTree, { border, inset, line }: ControlParts) =>
  px(tree, line) + 2 * px(tree, inset) + 2 * px(tree, border);

/** The control-size tokens under `size`, with the path of each. */
const sizesOf = (tree: DtcgTree) =>
  tokenLeaves(tree).flatMap(token => {
    const parts = controlOf(token);

    return parts === undefined ? [] : [{ parts, token }];
  });

/** The tree with the `$value` of each control size written as the px sum of its parts. A part that names no token throws. */
export const withControlSizes = (tree: DtcgTree): DtcgTree => {
  const written = structuredClone(tree);

  for (const { parts, token } of sizesOf(tree)) {
    const node = token.path.reduce<DtcgTree>(
      (at, key) => at[key] as DtcgTree,
      written
    );

    node.$value = { unit: 'px', value: heightOf(tree, parts) };
  }

  return written;
};

/** A control size whose `$value` is not the sum of its parts, or whose part names no token. */
export const controlProblems = (tree: DtcgTree): string[] =>
  sizesOf(tree).flatMap(({ parts, token }) => {
    const name = token.path.join('.');

    try {
      const wanted = heightOf(tree, parts);
      const have = token.$value as { value: number };

      return have.value === wanted
        ? []
        : [`${name}: $value is ${have.value}px, the parts give ${wanted}px`];
    } catch (error) {
      return [`${name}: ${(error as Error).message}`];
    }
  });
