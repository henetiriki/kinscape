/** The stray-literal check: a `.module.css` value that equals a token of its property's group. */

import type { DtcgTree, LiteralProblem, Rule } from '#ks/lib/design/types.ts';

import { coloursIn } from '#ks/lib/design/css.mts';
import {
  declarations,
  numbers,
  rulesFor,
  withoutVars,
} from '#ks/lib/design/groups.mts';
import { localProblems } from '#ks/lib/design/local.mts';

const literalsIn = (
  property: string,
  value: string,
  first: number,
  rule: Rule,
  tokens: DtcgTree
): LiteralProblem[] => {
  const known = rule.pick(tokens);
  const at = (offset: number) =>
    first + value.slice(0, offset).split('\n').length - 1;
  const hit = (literal: string, line: number): LiteralProblem => ({
    line,
    text: `${property}: ${literal} equals a token of its group: use var(--token)`,
  });

  if (rule.kind === 'shadow') {
    const flat = (text: string) =>
      text.trim().replaceAll(/\s+/g, ' ').toLowerCase();
    const shown = flat(withoutVars(value));

    return known.map(flat).includes(shown) ? [hit(shown, first)] : [];
  }

  if (rule.kind === 'colour') {
    const colours = new Set(known.flatMap(coloursIn));

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
    known.flatMap(token => numbers(token, durations).map(number => number.key))
  );

  return numbers(withoutVars(value), durations)
    .filter(number => keys.has(number.key))
    .map(number => hit(number.text, at(number.at)));
};

/** The problems of one `.module.css` file: a token literal, a bad local value and any `own:` comment. */
export const tokenLiterals = (
  css: string,
  tokens: DtcgTree
): LiteralProblem[] => {
  const literals = declarations(css).flatMap(({ first, property, value }) =>
    rulesFor(property).flatMap(rule =>
      literalsIn(property, value, first, rule, tokens)
    )
  );

  return [...literals, ...localProblems(css)].toSorted(
    (a, b) => a.line - b.line
  );
};
