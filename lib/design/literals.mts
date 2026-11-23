/** The stray-literal check: a `.module.css` value that equals a token of its property's group. */

import type { Tree } from '#ks/design/types.ts';
import type { LiteralProblem, Rule } from '#ks/lib/design/types.ts';

import { coloursIn } from '#ks/lib/design/css.mts';
import {
  declarations,
  leaves,
  numbers,
  rulesFor,
  withoutVars,
} from '#ks/lib/design/groups.mts';
import { sizesIn } from '#ks/lib/design/sizes.mts';

const OWN = /\/\*\s*own:(.*?)\*\//;

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

/** The problems of one `.module.css` file: a token literal with no `own:` comment, and a bad `own:` comment. */
export const tokenLiterals = (css: string, tokens: Tree): LiteralProblem[] => {
  const literals = declarations(css).flatMap(({ first, property, value }) =>
    rulesFor(property).flatMap(rule =>
      literalsIn(property, value, first, rule, tokens)
    )
  );
  const sized = new Set(
    sizesIn('x.module.css', css, tokens).map(size => size.line)
  );
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

      return sized.has(line) || literals.some(literal => literal.line === line)
        ? []
        : [{ line, text: 'The own: comment is on a line with no size' }];
    }),
  ];

  return problems.toSorted((a, b) => a.line - b.line);
};
