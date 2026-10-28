/** Design tokens as CSS: `design/tokens.json` written as custom properties, plus the stray-colour check. */

import type { Tree } from '../../design/types.ts';

import { isTree, REFERENCE } from '../../design/tokens.mts';

export const GENERATED_HEADER =
  '/* Generated from design/tokens.json by `npm run tokens`. Do not edit. */';

/** The custom property for a token: colours are unprefixed, other groups keep their group. */
export const cssName = (path: string[]): string =>
  `--${(path[0] === 'colour' ? path.slice(1) : path).join('-')}`;

/** The variable `next/font` sets for a family, e.g. `--next-font-public-sans`. */
export const fontVariable = (family: string): string =>
  `--next-font-${family.toLowerCase().replaceAll(' ', '-')}`;

const fontStack = (stack: string): string => {
  const [first, ...rest] = stack.split(',').map(part => part.trim());
  const family = first.replaceAll("'", '');

  return [`var(${fontVariable(family)})`, ...rest].join(', ');
};

const cssValue = (path: string[], value: string): string => {
  const reference = REFERENCE.exec(value)?.[1];

  if (reference !== undefined) {
    return `var(${cssName(reference.split('.'))})`;
  }

  return path[0] === 'font' ? fontStack(value) : value;
};

const walk = (node: Tree, path: string[]): [string, string][] =>
  Object.entries(node).flatMap(([key, child]) =>
    isTree(child)
      ? walk(child, [...path, key])
      : [[cssName([...path, key]), cssValue([...path, key], String(child))]]
  );

/** Every token outside `map`, as `[--name, value]` pairs. */
export const cssVariables = (tokens: Tree): [string, string][] =>
  Object.entries(tokens)
    .filter(([group]) => group !== 'map')
    .flatMap(([group, child]) => (isTree(child) ? walk(child, [group]) : []));

/** The text of `app/tokens.css`. */
export const renderCss = (tokens: Tree): string =>
  [
    GENERATED_HEADER,
    ':root {',
    ...cssVariables(tokens).map(([name, value]) => `  ${name}: ${value};`),
    '}',
    '',
  ].join('\n');

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
export const strayColours = (text: string, tokens: Tree): string[] => {
  const known = new Set(coloursIn(JSON.stringify(tokens)));

  return [...new Set(coloursIn(text))].filter(colour => !known.has(colour));
};
