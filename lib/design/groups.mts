/** What the literals check and the size check share: the property-to-group table and the CSS scan. */

import type { DtcgTree, Rule } from '#ks/lib/design/types.ts';

import { isTree, stepText, tokenLeaves } from '#ks/lib/design/dtcg.mts';

/** A number with its unit. The key drops its sign, so `-8px` equals `8px`. */
const NUMBER =
  /(?<![\w.#])(?<!\w-)-?(?<digits>\d*\.\d+|\d+)(?<unit>px|em|rem|ms|s)?(?![\w%.])/g;

/** The text of each token of `group`, or of the tokens that `keep` takes by path. */
const texts = (
  tokens: DtcgTree,
  group: string,
  keep: (path: string[]) => boolean = () => true
): string[] => {
  const node = tokens[group];

  return isTree(node)
    ? tokenLeaves(node, [group])
        .filter(({ path }) => keep(path))
        .map(token => stepText(tokens, token))
    : [];
};

/** The `key` token of each `type` style: `type.<style>.<key>`. */
const field = (group: string, key: string) => (tokens: DtcgTree) =>
  texts(tokens, group, path => path.length === 3 && path[2] === key);

const whole = (group: string) => (tokens: DtcgTree) => texts(tokens, group);

/** The `map` tokens that hold an opacity: `opacity` and `*-opacity`. */
const mapOpacities = (tokens: DtcgTree) =>
  texts(tokens, 'map', path => /(^|-)opacity$/.test(path.at(-1)!));

/** The `motion` offsets: `press-offset` and `rise-offset`. */
const motionOffsets = (tokens: DtcgTree) =>
  texts(tokens, 'motion', path => path.at(-1)!.endsWith('-offset'));

const RULES: [RegExp, Rule][] = [
  [/^border(-[a-z]+)*-radius$/, { kind: 'number', pick: whole('radius') }],
  [/^(box|text)-shadow$/, { kind: 'shadow', pick: whole('shadow') }],
  [/^z-index$/, { kind: 'number', pick: whole('z') }],
  [/^(transition|animation)/, { kind: 'duration', pick: whole('motion') }],
  [/^font-size$/, { kind: 'number', pick: field('type', 'size') }],
  [/^line-height$/, { kind: 'number', pick: field('type', 'line') }],
  [/^letter-spacing$/, { kind: 'number', pick: field('type', 'tracking') }],
  [/^font-weight$/, { kind: 'number', pick: field('type', 'weight') }],
  [
    /^(gap|row-gap|column-gap|padding|margin|inset|top|right|bottom|left)(-|$)/,
    { kind: 'number', pick: whole('space') },
  ],
  [
    /^(width|height|min-|max-|flex-basis|block-size|inline-size)/,
    { kind: 'number', pick: whole('size') },
  ],
  [/^outline(-width|-offset)?$/, { kind: 'number', pick: whole('focus') }],
  [
    /^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?$/,
    {
      kind: 'number',
      pick: tokens => [
        ...texts(tokens, 'border'),
        ...texts(tokens, 'focus', path => path.at(-1) === 'width'),
      ],
    },
  ],
  [/^opacity$/, { kind: 'number', pick: mapOpacities }],
  [/^(transform|translate)$/, { kind: 'number', pick: motionOffsets }],
  [/^@media$/, { kind: 'number', pick: whole('breakpoint') }],
  [
    /^(color|background|border|outline|fill|stroke)(-|$)/,
    {
      kind: 'colour',
      pick: tokens => [...texts(tokens, 'colour'), ...texts(tokens, 'map')],
    },
  ],
];

/** Each rule of a property. A property can match more than one: `outline` takes a width and a colour. */
export const rulesFor = (property: string): Rule[] =>
  RULES.filter(([pattern]) => pattern.test(property)).map(([, rule]) => rule);

/** The px of 1rem: the browser default root text size. */
export const REM_PX = 16;

/** The key of a number: a duration in seconds becomes milliseconds, so `0.12s` equals `120ms`. A rem length becomes px (1rem is 16px), so `16px` equals `1rem`. */
export const keyOf = (digits: string, unit = '') =>
  unit === 's'
    ? `${Number((Number(digits) * 1000).toFixed(6))}ms`
    : unit === 'rem'
      ? `${Number((Number(digits) * REM_PX).toFixed(6))}px`
      : `${Number(digits)}${unit}`;

export const numbers = (text: string, durations: boolean) =>
  [...text.matchAll(NUMBER)]
    .filter(match => durations === /^m?s$/.test(match.groups?.unit ?? ''))
    .filter(match => Number(match.groups?.digits) !== 0)
    .map(match => ({
      at: match.index,
      key: keyOf(match.groups!.digits, match.groups?.unit),
      text: match[0],
    }));

export const blank = (text: string) => text.replaceAll(/[^\n]/g, ' ');

/** An `own:` comment with its reason in group 1. */
export const OWN = /\/\*\s*own:(.*?)\*\//;

/** The text of `css` with each comment blanked. */
export const uncommented = (css: string) =>
  css.replaceAll(/\/\*[\s\S]*?\*\//g, blank);

/** Blanks each `var()` and each `calc()` that holds a `var()`. */
export const withoutVars = (value: string): string => {
  let out = value;

  for (const name of ['calc(', 'var(']) {
    let from = out.indexOf(name);

    while (from !== -1) {
      let depth = 0;
      let end = from + name.length - 1;

      for (; end < out.length; end++) {
        depth += out[end] === '(' ? 1 : out[end] === ')' ? -1 : 0;
        if (depth === 0) break;
      }

      const span = out.slice(from, end + 1);

      if (name === 'var(' || span.includes('var(')) {
        out = out.slice(0, from) + blank(span) + out.slice(end + 1);
      }

      from = out.indexOf(name, from + 1);
    }
  }

  return out;
};

/** Each declaration of `css` as its property, value, first line and the offset of its value. It blanks each comment. */
export const declarations = (css: string) => {
  const clean = uncommented(css);
  const found: {
    base: number;
    first: number;
    property: string;
    value: string;
  }[] = [];

  for (const match of clean.matchAll(
    /(?<=^|[{;}\n])[ \t]*(?<property>-{0,2}[a-z][a-z-]*)[ \t]*:(?<value>[^;{}]*)(?=[;}]|$)/g
  )) {
    const start = match.index + match[0].length - match.groups!.value.length;

    found.push({
      base: start,
      first: clean.slice(0, start).split('\n').length,
      property: match.groups!.property,
      value: match.groups!.value,
    });
  }

  return found;
};
