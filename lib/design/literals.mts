/** The stray-literal check: a `.module.css` value that equals a token of its property's group. */

import type { Tree } from '#ks/design/types.ts';
import type { LiteralProblem } from '#ks/lib/design/types.ts';

import { isTree } from '#ks/design/tokens.mts';
import { coloursIn } from '#ks/lib/design/css.mts';

type Kind = 'colour' | 'duration' | 'number' | 'shadow';

type Rule = { kind: Kind; pick: (tokens: Tree) => unknown[] };

const OWN = /\/\*\s*own:(.*?)\*\//;

/** A number with its unit. The key drops its sign, so `-8px` equals `8px`. */
const NUMBER =
  /(?<![\w.#])(?<!\w-)-?(?<digits>\d*\.\d+|\d+)(?<unit>px|em|rem|ms|s)?(?![\w%.])/g;

const leaves = (node: unknown): string[] =>
  isTree(node) ? Object.values(node).flatMap(leaves) : [String(node)];

const field = (group: string, key: string) => (tokens: Tree) =>
  Object.values(tokens[group] as Tree).map(token => (token as Tree)[key]);

const whole = (group: string) => (tokens: Tree) => [tokens[group]];

const RULES: [RegExp, Rule][] = [
  [/^border(-[a-z]+)*-radius$/, { kind: 'number', pick: whole('radius') }],
  [/^box-shadow$/, { kind: 'shadow', pick: whole('shadow') }],
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
  [
    /^(color|background|border|outline|fill|stroke)(-|$)/,
    { kind: 'colour', pick: tokens => [tokens.colour, tokens.map] },
  ],
];

/** The key of a number: a duration in seconds becomes milliseconds, so `0.12s` equals `120ms`. */
const keyOf = (digits: string, unit = '') =>
  unit === 's'
    ? `${Number((Number(digits) * 1000).toFixed(6))}ms`
    : `${Number(digits)}${unit}`;

const numbers = (text: string, durations: boolean) =>
  [...text.matchAll(NUMBER)]
    .filter(match => durations === /^m?s$/.test(match.groups?.unit ?? ''))
    .filter(match => Number(match.groups?.digits) !== 0)
    .map(match => ({
      at: match.index,
      key: keyOf(match.groups!.digits, match.groups?.unit),
      text: match[0],
    }));

const blank = (text: string) => text.replaceAll(/[^\n]/g, ' ');

/** Blanks each `var()` and each `calc()` that holds a `var()`. */
const withoutVars = (value: string): string => {
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

const literalsIn = (
  property: string,
  value: string,
  first: number,
  rule: Rule,
  tokens: Tree
): LiteralProblem[] => {
  const known = rule.pick(tokens);
  const at = (offset: number) =>
    first + value.slice(0, offset).split('\n').length - 1;
  const hit = (literal: string, line: number): LiteralProblem => ({
    line,
    text: `${property}: ${literal} equals a token of its group: use var(--token) or add /* own: <reason> */`,
  });

  if (rule.kind === 'shadow') {
    const flat = (text: string) =>
      text.trim().replaceAll(/\s+/g, ' ').toLowerCase();
    const shown = flat(withoutVars(value));
    const tokenValues = leaves(known).map(flat);

    return tokenValues.includes(shown) ? [hit(shown, first)] : [];
  }

  if (rule.kind === 'colour') {
    const colours = new Set(
      known.flatMap(group => coloursIn(JSON.stringify(group)))
    );

    return withoutVars(value)
      .split('\n')
      .flatMap((row, index) =>
        coloursIn(row)
          .filter(colour => colours.has(colour))
          .map(colour => hit(`#${colour}`, first + index))
      );
  }

  const durations = rule.kind === 'duration';
  const keys = new Set(
    leaves(known).flatMap(token =>
      numbers(token, durations).map(number => number.key)
    )
  );

  return numbers(withoutVars(value), durations)
    .filter(number => keys.has(number.key))
    .map(number => hit(number.text, at(number.at)));
};

/** Each declaration of `css` as its property, value and first line. It blanks each comment. */
const declarations = (css: string) => {
  const clean = css.replaceAll(/\/\*[\s\S]*?\*\//g, blank);
  const found: { first: number; property: string; value: string }[] = [];

  for (const match of clean.matchAll(
    /(?<=^|[{;}\n])[ \t]*(?<property>[a-z][a-z-]*)[ \t]*:(?<value>[^;{}]*)(?=[;}]|$)/g
  )) {
    const start = match.index + match[0].length - match.groups!.value.length;

    found.push({
      first: clean.slice(0, start).split('\n').length,
      property: match.groups!.property,
      value: match.groups!.value,
    });
  }

  return found;
};

/** The problems of one `.module.css` file: a token literal with no `own:` comment, and a bad `own:` comment. */
export const tokenLiterals = (css: string, tokens: Tree): LiteralProblem[] => {
  const literals = declarations(css).flatMap(({ first, property, value }) => {
    const rule = RULES.find(([pattern]) => pattern.test(property))?.[1];

    return rule ? literalsIn(property, value, first, rule, tokens) : [];
  });
  const owns = new Map<number, string>();

  css.split('\n').forEach((row, index) => {
    const reason = OWN.exec(row)?.[1];

    if (reason !== undefined) owns.set(index + 1, reason.trim());
  });

  const problems: LiteralProblem[] = [
    ...literals.filter(literal => !owns.has(literal.line)),
    ...[...owns].flatMap(([line, reason]): LiteralProblem[] => {
      if (reason === '') {
        return [{ line, text: 'The own: comment has no reason' }];
      }

      return literals.some(literal => literal.line === line)
        ? []
        : [
            {
              line,
              text: 'The own: comment is on a line with no token literal',
            },
          ];
    }),
  ];

  return problems.toSorted((a, b) => a.line - b.line);
};
