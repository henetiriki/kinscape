/** WCAG contrast of design tokens: `#rrggbb` and `rgb(r g b / a)` values, ratios and their display. */

import type { DtcgTree } from '#ks/lib/design/types.ts';

import { HEX_COLOUR, hexChannels } from '#ks/lib/design/css.mts';
import { resolvedText } from '#ks/lib/design/dtcg.mts';

type Rgb = [number, number, number];

const FUNCTION = /^rgb\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[/,][^)]*)?\)$/i;

/** The red, green and blue of `#rrggbb` or `rgb(r g b / a)` (opacity ignored). */
export const parseColour = (value: string): Rgb => {
  if (HEX_COLOUR.test(value)) {
    return hexChannels(value);
  }

  const channels = FUNCTION.exec(value);

  if (channels === null) {
    throw new Error(`Not a colour: ${value}`);
  }

  return channels.slice(1, 4).map(Number) as Rgb;
};

const linear = (channel: number): number => {
  const s = channel / 255;

  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (value: string): number => {
  const [r, g, b] = parseColour(value).map(linear);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The WCAG contrast ratio of two opaque colours, unrounded, from 1 to 21. */
export const contrastRatio = (a: string, b: string): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);

  return (light + 0.05) / (dark + 0.05);
};

/** A ratio rounded to the nearest 0.1, as the role sentence of a design token shows it: `4.6:1`. */
export const formatRatio = (ratio: number): string => `${ratio.toFixed(1)}:1`;

/** The resolved value at a token path such as `colour.brand` or `map.hatch.colour`. */
export const valueAt = (tokens: DtcgTree, path: string): string =>
  resolvedText(tokens, path);

/** The token that a contrast uses when a role names none. */
export const DEFAULT_ON = 'colour.surface';

/** The unrounded contrast of a token on another (`DEFAULT_ON` unless `on` says). */
export const ratioOf = (
  tokens: DtcgTree,
  path: string,
  on = DEFAULT_ON
): number => contrastRatio(valueAt(tokens, path), valueAt(tokens, on));
