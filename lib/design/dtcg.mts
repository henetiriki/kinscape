/** DTCG 2025.10 tokens (`design/kinscape.tokens.json`): the CSS text of each value, and the format check. */

import type {
  DtcgColour,
  DtcgDimension,
  DtcgDuration,
  DtcgShadowLayer,
  DtcgToken,
  DtcgTransition,
  DtcgTree,
} from '#ks/lib/design/types.ts';

import { hexChannels, isTree, referenceIn } from '#ks/design/tokens.mts';

/** A see-through colour is `rgb(r g b / a)`, the form the design export reads. */
export const cssColour = (colour: DtcgColour): string => {
  if (colour.hex === undefined) {
    throw new Error(`A colour has no hex: ${JSON.stringify(colour)}`);
  }

  if (colour.alpha === undefined || colour.alpha === 1) {
    return colour.hex;
  }

  return `rgb(${hexChannels(colour.hex).join(' ')} / ${colour.alpha})`;
};

export const cssDimension = ({ unit, value }: DtcgDimension): string =>
  value === 0 ? '0' : `${value}${unit}`;

const cssDuration = ({ unit, value }: DtcgDuration): string =>
  `${value}${unit}`;

const layer = (shadow: DtcgShadowLayer): string =>
  [
    ...(shadow.inset === true ? ['inset'] : []),
    cssDimension(shadow.offsetX),
    cssDimension(shadow.offsetY),
    cssDimension(shadow.blur),
    ...(shadow.spread.value === 0 ? [] : [cssDimension(shadow.spread)]),
    cssColour(shadow.color),
  ].join(' ');

export const cssShadow = (
  shadow: DtcgShadowLayer | DtcgShadowLayer[]
): string => (Array.isArray(shadow) ? shadow : [shadow]).map(layer).join(', ');

/** The CSS keyword of each cubic Bézier that has one. */
const EASINGS: Record<string, string> = {
  '0,0,0.58,1': 'ease-out',
  '0,0,1,1': 'linear',
  '0.25,0.1,0.25,1': 'ease',
  '0.42,0,0.58,1': 'ease-in-out',
  '0.42,0,1,1': 'ease-in',
};

export const cssTransition = ({
  delay,
  duration,
  timingFunction,
}: DtcgTransition): string =>
  [
    cssDuration(duration),
    EASINGS[timingFunction.join(',')] ??
      `cubic-bezier(${timingFunction.join(', ')})`,
    ...(delay.value === 0 ? [] : [cssDuration(delay)]),
  ].join(' ');

/** A letter spacing is a share of the font size (#1193 D1). A zero stays a bare `0` (#1193 D6). */
export const cssTracking = (share: number): string =>
  share === 0 ? '0' : `${share}em`;

const GENERIC_FAMILIES = new Set([
  'cursive',
  'emoji',
  'fantasy',
  'math',
  'monospace',
  'sans-serif',
  'serif',
  'system-ui',
  'ui-monospace',
  'ui-rounded',
  'ui-sans-serif',
  'ui-serif',
]);

/** A DTCG `fontFamily` as a CSS stack: `'Public Sans', system-ui, sans-serif`. */
export const fontStackOf = (families: string | string[]): string =>
  (Array.isArray(families) ? families : [families])
    .map(family => (GENERIC_FAMILIES.has(family) ? family : `'${family}'`))
    .join(', ');

const isTracking = (path: string[]): boolean =>
  path[0] === 'type' && path.at(-1) === 'tracking';

/** The CSS text of a resolved token value. The font stack is the plain stack, with no `next/font` variable. */
export const cssText = ({ $type, $value, path }: DtcgToken): string => {
  switch ($type) {
    case 'color':
      return cssColour($value as DtcgColour);
    case 'dimension':
      return cssDimension($value as DtcgDimension);
    case 'duration':
      return cssDuration($value as DtcgDuration);
    case 'fontFamily':
      return fontStackOf($value as string | string[]);
    case 'fontWeight':
      return String($value);
    case 'number':
      return isTracking(path) ? cssTracking($value as number) : String($value);
    case 'shadow':
      return cssShadow($value as DtcgShadowLayer | DtcgShadowLayer[]);
    case 'transition':
      return cssTransition($value as DtcgTransition);
    default:
      throw new Error(`${path.join('.')}: no CSS for $type ${$type}`);
  }
};

/** Each token under `node`, in file order. `path` is the path of `node`. */
export const tokenLeaves = (node: DtcgTree, path: string[] = []): DtcgToken[] =>
  Object.entries(node).flatMap(([key, child]) => {
    if (key.startsWith('$')) {
      return [];
    }

    const at = [...path, key];
    const group = child as DtcgTree;

    return '$value' in group
      ? [{ ...group, path: at } as DtcgToken]
      : tokenLeaves(group, at);
  });

/** A reference as `{path}`, as `design/tokens.json` held it; any other value as its CSS text. */
export const tokenText = (token: DtcgToken): string => {
  const reference = referenceIn(token.$value);

  return reference === undefined ? cssText(token) : `{${reference}}`;
};

/** The CSS text of the token at `path` (`colour.brand`), after each reference it names. */
export const resolvedText = (tree: DtcgTree, path: string): string => {
  const keys = path.split('.');
  const node = keys.reduce<unknown>(
    (at, key) => (isTree(at) ? at[key] : undefined),
    tree
  );

  if (!isTree(node) || !('$value' in node)) {
    throw new Error(`Unknown token reference {${path}}`);
  }

  const reference = referenceIn(node.$value);

  return reference === undefined
    ? cssText({ ...node, path: keys } as DtcgToken)
    : resolvedText(tree, reference);
};

/** Each `$description` of a group or a token, with the path it sits at, in file order. */
export const descriptions = (
  node: DtcgTree,
  path: string[] = []
): [string[], string][] =>
  Object.entries(node).flatMap(([key, child]): [string[], string][] => {
    if (key === '$description') {
      return [[path, String(child)]];
    }

    return key.startsWith('$')
      ? []
      : descriptions(child as DtcgTree, [...path, key]);
  });

type Leaf = { path: string[]; token: Record<string, unknown> };

/** The tokens that a walk found, and the problems on its way. */
type Walk = { leaves: Leaf[]; problems: string[] };

const BAD_NAME = /[.{}]/;

const hasNote = (node: Record<string, unknown>): boolean =>
  '$description' in node;

const walk = (node: Record<string, unknown>, path: string[]): Walk =>
  Object.entries(node).reduce<Walk>(
    (found, [key, child]) => {
      if (key.startsWith('$')) {
        return found;
      }

      const at = [...path, key];

      if (!isTree(child)) {
        found.problems.push(`${at.join('.')}: not a group or a token`);

        return found;
      }

      if ('$value' in child) {
        found.leaves.push({ path: at, token: child });

        return found;
      }

      const inner = walk(child, at);

      // The notes of design/tokens.json hold one text at each path, so a group note hides the notes under it.
      if (hasNote(child) && inner.leaves.some(({ token }) => hasNote(token))) {
        found.problems.push(
          `${at.join('.')}: a group note and a token note under it`
        );
      }

      found.leaves.push(...inner.leaves);
      found.problems.push(...inner.problems);

      return found;
    },
    { leaves: [], problems: [] }
  );

/** The references at any depth inside a composite value: an object or a list. */
const nestedReferences = (value: unknown): string[] =>
  isTree(value)
    ? Object.values(value).flatMap(child => {
        const reference = referenceIn(child);

        return reference === undefined ? nestedReferences(child) : [reference];
      })
    : [];

const tokenProblems = ({ path, token }: Leaf, names: Set<string>): string[] => {
  const name = path.join('.');
  const reference = referenceIn(token.$value);

  return [
    ...(path.some(key => BAD_NAME.test(key))
      ? [`${name}: the name has ".", "{" or "}"`]
      : []),
    ...(token.$value === null ? [`${name}: $value is null`] : []),
    ...(reference === undefined || names.has(reference)
      ? []
      : [`${name}: {${reference}} names no token`]),
    // Style Dictionary does not resolve a reference inside a composite value for the CSS.
    ...nestedReferences(token.$value).map(
      inner => `${name}: {${inner}} is inside a composite value`
    ),
    ...('$type' in token ? [] : [`${name}: no $type`]),
  ];
};

/**
 * What breaks the DTCG 2025.10 rules or the build: a member that is not a group or a token, a token
 * with no `$type` or a null `$value`, a name with `.`, `{` or `}`, a reference to no token or inside a
 * composite value, and a group note over a token note. Each problem names its path.
 */
export const dtcgProblems = (tree: Record<string, unknown>): string[] => {
  const { leaves, problems } = walk(tree, []);
  const names = new Set(leaves.map(({ path }) => path.join('.')));

  return [
    ...(hasNote(tree) ? ['(root): a note at the root'] : []),
    ...problems,
    ...leaves.flatMap(leaf => tokenProblems(leaf, names)),
  ].toSorted();
};
