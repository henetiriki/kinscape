/** DTCG 2025.10 tokens (`design/kinscape.tokens.json`): the CSS text of each value, and the format check. */

import type {
  DtcgColour,
  DtcgDimension,
  DtcgDuration,
  DtcgShadowLayer,
  DtcgToken,
  DtcgTransition,
} from '#ks/lib/design/types.ts';

import { hexChannels, isTree, REFERENCE } from '#ks/design/tokens.mts';

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

type Leaf = { path: string[]; token: Record<string, unknown> };

const tokensIn = (node: Record<string, unknown>, path: string[]): Leaf[] =>
  Object.entries(node).flatMap(([key, child]): Leaf[] => {
    if (key.startsWith('$') || !isTree(child)) {
      return [];
    }

    const at = [...path, key];

    return '$value' in child
      ? [{ path: at, token: child }]
      : tokensIn(child, at);
  });

const BAD_NAME = /[.{}]/;

const referencesIn = (value: unknown): string[] => {
  if (typeof value === 'string') {
    const reference = REFERENCE.exec(value)?.[1];

    return reference === undefined ? [] : [reference];
  }

  return isTree(value) ? Object.values(value).flatMap(referencesIn) : [];
};

/** What breaks the DTCG 2025.10 rules: a token with no `$type`, a name with `.`, `{` or `}`, or a reference to no token. */
export const dtcgProblems = (tree: Record<string, unknown>): string[] => {
  const leaves = tokensIn(tree, []);
  const names = new Set(leaves.map(({ path }) => path.join('.')));

  return leaves
    .flatMap(({ path, token }) => {
      const name = path.join('.');

      return [
        ...(path.some(key => BAD_NAME.test(key))
          ? [`${name}: the name has ".", "{" or "}"`]
          : []),
        ...referencesIn(token.$value)
          .filter(reference => !names.has(reference))
          .map(reference => `${name}: {${reference}} names no token`),
        ...('$type' in token ? [] : [`${name}: no $type`]),
      ];
    })
    .toSorted();
};
