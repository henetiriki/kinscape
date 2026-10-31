/** The design system's `tokens.json` rules (Spec #445 › Type format). A reader drops what breaks one. */

import type { SystemToken, SystemTokens } from './types.ts';

const NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOUR_FUNCTION_SOURCE =
  '(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\\((?=[^)]*\\d)(?:[-+\\d.%\\s,/]|deg)*\\)';
const COLOUR_FUNCTION = new RegExp(`^${COLOUR_FUNCTION_SOURCE}$`, 'i');
const COLOUR_FUNCTIONS = new RegExp(COLOUR_FUNCTION_SOURCE, 'gi');
const SHADOW_WORD = /^(?:inset|none|-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|%)?)$/i;
const ALIAS = /^\{([^{}]*)\}$/;
const PLAIN_VALUE = /^[A-Za-z0-9 #%(),./+_-]{1,200}$/;
const LENGTH = /^-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|%)?$/;
const UNITLESS = /^-?(?:\d+\.?\d*|\.\d+)$/;
const WEIGHT = /^\d+(?: \d+)?$/;
const FORBIDDEN_IN_STACK = /[;{}<>\\()]/;

const MAX_CHAIN = 16;
const CAPS = {
  colours: 600,
  families: 12,
  groups: 12,
  perFamily: 60,
  styles: 80,
};
const USAGE_MAX = 1000;

/** Every family but `type` that holds a token list, as `[family, tokens]`. */
const lists = (tokens: SystemTokens): [string, SystemToken[]][] =>
  Object.entries(tokens as Record<string, unknown>).flatMap(([key, value]) =>
    key !== 'type' && typeof value === 'object'
      ? [[key, (value as { tokens: SystemToken[] }).tokens]]
      : []
  );

const aliasProblem = (
  token: SystemToken,
  target: string,
  colours: Map<string, string>
): string | undefined => {
  const seen = [token.name];
  let next = target;

  for (let depth = 1; ; depth += 1) {
    if (seen.includes(next)) {
      return next === token.name && depth === 1
        ? 'aliases itself'
        : 'is in an alias cycle';
    }

    const value = colours.get(next);

    if (value === undefined) {
      return `aliases {${next}}, which is not a colour`;
    }

    const further = ALIAS.exec(value)?.[1];

    if (further === undefined) {
      return depth > MAX_CHAIN
        ? `is an alias chain over ${MAX_CHAIN} deep`
        : undefined;
    }

    seen.push(next);
    next = further;
  }
};

const colourProblem = (
  token: SystemToken,
  colours: Map<string, string>
): string | undefined => {
  const target = ALIAS.exec(token.value)?.[1];

  if (target !== undefined) {
    return aliasProblem(token, target, colours);
  }

  return HEX.test(token.value) || COLOUR_FUNCTION.test(token.value)
    ? undefined
    : 'is not a hex or numeric colour function';
};

const valueProblem = (value: string): boolean =>
  !PLAIN_VALUE.test(value) || /(?:var|url)\(/i.test(value);

const shadowProblem = (value: string): boolean =>
  value
    .replace(COLOUR_FUNCTIONS, '')
    .split(/[\s,]+/)
    .filter(word => word !== '')
    .some(word => !SHADOW_WORD.test(word) && !HEX.test(word));

const tokenProblems = (tokens: SystemTokens): string[] => {
  const colours = new Map(
    tokens.color.tokens.map(({ name, value }) => [name, value])
  );
  const names = new Set<string>();

  return lists(tokens).flatMap(([family, list]) => [
    ...(list.length > (family === 'color' ? CAPS.colours : CAPS.perFamily)
      ? [
          `${family}: ${list.length} tokens, over the ${family === 'color' ? CAPS.colours : CAPS.perFamily} cap`,
        ]
      : []),
    ...list.flatMap(token => {
      const problems: string[] = [];

      if (!NAME.test(token.name)) {
        problems.push(`the name breaks ${NAME.source}`);
      } else if (names.has(token.name)) {
        problems.push('the name is used twice');
      }

      names.add(token.name);

      if (family === 'color') {
        const problem = colourProblem(token, colours);

        if (problem !== undefined) {
          problems.push(`"${token.value}" ${problem}`);
        }
      } else if (valueProblem(token.value)) {
        problems.push(
          'the value is not a plain CSS value of at most 200 characters'
        );
      } else if (family === 'shadow' && shadowProblem(token.value)) {
        problems.push(
          'the shadow is not lengths, hex or function colours, inset or none'
        );
      }

      if (token.usage.length > USAGE_MAX) {
        problems.push(`the usage is over ${USAGE_MAX} characters`);
      }

      return problems.map(problem => `${token.name}: ${problem}`);
    }),
  ]);
};

const lengthProblem = (
  label: string,
  key: string,
  value: string,
  unitlessUnder10 = false
): string[] => {
  if (!LENGTH.test(value)) {
    return [`${label}: ${key} "${value}" is not a length`];
  }

  return unitlessUnder10 && UNITLESS.test(value) && Number(value) >= 10
    ? [`${label}: ${key} "${value}" is a unitless number of 10 or more`]
    : [];
};

const weightOk = (weight: string): boolean =>
  WEIGHT.test(weight) &&
  weight.split(' ').every(part => Number(part) >= 1 && Number(part) <= 1000);

const typeProblems = (type: SystemTokens['type']): string[] => {
  const styles = type.groups.flatMap(group => group.styles);

  return [
    ...Object.entries(type.families)
      .filter(
        ([, stack]) => stack.length > 200 || FORBIDDEN_IN_STACK.test(stack)
      )
      .map(
        ([key]) =>
          `type.families.${key}: the stack has a forbidden character or is over 200 characters`
      ),
    ...type.fonts.flatMap(font => {
      const label = `type.fonts ${font.file}`;

      return [
        ...(font.file.startsWith('fonts/') && !font.file.includes('..')
          ? []
          : [`${label}: the file is not under fonts/`]),
        ...(['italic', 'normal'].includes(font.style)
          ? []
          : [`${label}: the style is not normal or italic`]),
        ...(weightOk(font.weight)
          ? []
          : [`${label}: the weight is not a number or a range`]),
      ];
    }),
    ...type.groups.flatMap(group => [
      ...(group.family in type.families
        ? []
        : [
            `type.${group.name}: the family ${group.family} is not in type.families`,
          ]),
      ...group.styles.flatMap(style => {
        const label = `type.${group.name}.${style.name}`;

        return [
          ...lengthProblem(label, 'fontSize', style.fontSize),
          ...lengthProblem(label, 'lineHeight', style.lineHeight, true),
          ...(weightOk(style.fontWeight)
            ? []
            : [
                `${label}: fontWeight "${style.fontWeight}" is not 1 to 1000 or a range`,
              ]),
          ...lengthProblem(label, 'letterSpacing', style.letterSpacing),
          ...(style.usage.length > USAGE_MAX
            ? [`${label}: the usage is over ${USAGE_MAX} characters`]
            : []),
        ];
      }),
    ]),
    ...(type.groups.length > CAPS.groups
      ? [`type: ${type.groups.length} groups, over the ${CAPS.groups} cap`]
      : []),
    ...(styles.length > CAPS.styles
      ? [`type: ${styles.length} styles, over the ${CAPS.styles} cap`]
      : []),
  ];
};

/** One message per rule in **Type format** that `tokens` breaks, each naming the token, style or font. */
export const formatProblems = (tokens: SystemTokens): string[] => {
  const others = lists(tokens).filter(([family]) => family !== 'color');

  return [
    ...tokenProblems(tokens),
    ...typeProblems(tokens.type),
    ...(others.length > CAPS.families
      ? [
          `tokens.json: ${others.length} families other than type, over the ${CAPS.families} cap`,
        ]
      : []),
  ];
};
