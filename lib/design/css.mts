/** Token names in CSS, the font stack, the map tokens that CSS shares, and the stray-colour check. */

import type { DtcgTree } from '#ks/lib/design/types.ts';

/** A colour token as `#rrggbb`. */
export const HEX_COLOUR = /^#([0-9a-f]{6})$/i;

/** The red, green and blue of a `#rrggbb` colour. */
export const hexChannels = (value: string): [number, number, number] => {
  const hex = HEX_COLOUR.exec(value)?.[1];

  if (hex === undefined) {
    throw new Error(`Not a #rrggbb colour: ${value}`);
  }

  return [0, 2, 4].map(at => Number.parseInt(hex.slice(at, at + 2), 16)) as [
    number,
    number,
    number,
  ];
};

/** The custom property for a token: colours are unprefixed, other groups keep their group. */
export const cssName = (path: string[]): string =>
  `--${(path[0] === 'colour' ? path.slice(1) : path).join('-')}`;

/** The name a token has in the design system: its `cssName` without `--`. */
export const systemName = (path: string[]): string => cssName(path).slice(2);

/** The variable `next/font` sets for a family, e.g. `--next-font-public-sans`. */
export const fontVariable = (family: string): string =>
  `--next-font-${family.toLowerCase().replaceAll(' ', '-')}`;

/** The first family of a font stack, without quotes: `'Public Sans', sans-serif` gives `Public Sans`. */
export const familyName = (stack: string): string =>
  stack.split(',')[0].replaceAll("'", '').trim();

/** A font stack that starts with the `next/font` variable of its first family. */
export const fontStack = (stack: string): string => {
  const rest = stack
    .split(',')
    .slice(1)
    .map(part => part.trim());

  return [`var(${fontVariable(familyName(stack))})`, ...rest].join(', ');
};

/**
 * The `map` tokens that HTML markers on the map draw with too: the halo of a Pin and the ring of
 * the open Pin. The map layers read them as values, and the count marker and the fan of Pins read
 * them as CSS variables. Thus each value lives in one place. The two opacities of the sign-in hero
 * and the two opacities of the fan lines and rings are CSS variables too.
 */
export const MAP_SHARED = [
  'pin-halo.colour',
  'pin-halo.opacity',
  'selected',
  'hero-shade.opacity',
  'hero-border.opacity',
  'fan-line.opacity',
  'fan-ring.opacity',
];

const HEX =
  /(?<![\w&])#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![\w-])/gi;
const FUNCTION = /rgba?\(([^)]*)\)/gi;
const ANCHOR = /(?:href\s*=\s*["']#[^"']*["']|url\(\s*["']?#[^)]*\))/gi;

const hexKey = (digits: string): string => {
  const full =
    digits.length <= 4
      ? [...digits].map(digit => digit + digit).join('')
      : digits;

  return full.slice(0, 6).toLowerCase();
};

const channelKey = (args: string): string => {
  const [r, g, b] = args
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(part => Math.round(Number.parseFloat(part)));

  return [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
};

/** Colours in `text` as lowercase `rrggbb` (opacity ignored), skipping `href="#id"` and `url(#id)`. */
export const coloursIn = (text: string): string[] => {
  const plain = text.replaceAll(ANCHOR, '');

  return [
    ...[...plain.matchAll(HEX)].map(match => hexKey(match[1])),
    ...[...plain.matchAll(FUNCTION)].map(match => channelKey(match[1])),
  ];
};

/** The colours in `text` that no token has, each listed once. */
export const strayColours = (text: string, tokens: DtcgTree): string[] => {
  const known = new Set(coloursIn(JSON.stringify(tokens)));

  return [...new Set(coloursIn(text))].filter(colour => !known.has(colour));
};
