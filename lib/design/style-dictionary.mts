/** Style Dictionary for KinScape: the DTCG token file in, `app/tokens.css` and `design/tokens.generated.ts` out. */

import type {
  DesignTokens,
  FormatFnArguments,
  TransformedToken,
} from 'style-dictionary/types';

import StyleDictionary from 'style-dictionary';

import type { Tree } from '#ks/design/types.ts';

import {
  cssName,
  fontStack,
  hexChannels,
  MAP_SHARED,
  systemName,
} from '#ks/lib/design/css.mts';
import { cssText, referenceIn } from '#ks/lib/design/dtcg.mts';

const HEADER =
  '/* Generated from design/kinscape.tokens.json by `npm run tokens`. Do not edit. */';

const referenceOf = (token: TransformedToken): string | undefined =>
  referenceIn(token.original.$value);

/** A `scale` step is no output: a token that refers to one gets its value (#1197 D5, D10). */
const isStep = ({ path }: TransformedToken): boolean => path[0] === 'scale';

/** A `map` token goes to the CSS only if HTML markers draw with it too. */
const inCss = (token: TransformedToken): boolean =>
  !isStep(token) &&
  (token.path[0] !== 'map' ||
    MAP_SHARED.some(shared => {
      const parts = shared.split('.');

      return parts.every((part, at) => token.path[at + 1] === part);
    }));

const cssValue = (token: TransformedToken): string => {
  const reference = referenceOf(token);

  if (reference !== undefined && !reference.startsWith('scale.')) {
    return `var(${cssName(reference.split('.'))})`;
  }

  return token.$type === 'fontFamily'
    ? fontStack(String(token.$value))
    : String(token.$value);
};

const css = ({ dictionary }: FormatFnArguments): string =>
  [
    HEADER,
    ':root {',
    ...dictionary.allTokens
      .filter(inCss)
      .map(token => `  --${token.name}: ${cssValue(token)};`),
    '}',
    '',
  ].join('\n');

const put = (tree: Tree, path: string[], value: number | string): void => {
  const node = path
    .slice(0, -1)
    .reduce<Tree>((at, key) => (at[key] ??= {}) as Tree, tree);

  node[path.at(-1)!] = value;
};

/** The resolved value of a token: a `map` number as a number, else its CSS text. */
const resolvedValue = (token: TransformedToken): number | string =>
  token.path[0] === 'map' && token.$type === 'number'
    ? Number(token.$value)
    : String(token.$value);

/** The resolved tokens as a tree, in file order. */
const resolvedTree = ({ allTokens }: FormatFnArguments['dictionary']): Tree => {
  const tree: Tree = {};

  for (const token of allTokens.filter(step => !isStep(step))) {
    put(tree, token.path, resolvedValue(token));
  }

  return tree;
};

const TS_HEADER =
  '// Generated from design/kinscape.tokens.json by `npm run tokens`. Do not edit.';

const PX = /^(-?\d+(?:\.\d+)?)px$/;
const MS = /^(\d+(?:\.\d+)?)ms\b/;

/** The leaves of `node` that `pattern` reads, as numbers, in the shape of `node`. Empty groups go. */
const numbersIn = (node: Tree, pattern: RegExp): Tree => {
  const out: Tree = {};

  for (const [key, child] of Object.entries(node)) {
    if (typeof child === 'string') {
      const match = pattern.exec(child);

      if (match) {
        out[key] = Number(match[1]);
      }
    } else if (typeof child === 'object') {
      const inner = numbersIn(child, pattern);

      if (Object.keys(inner).length > 0) {
        out[key] = inner;
      }
    }
  }

  return out;
};

const constant = (name: string, value: Tree): string =>
  `export const ${name} = ${JSON.stringify(value, null, 2)} as const;`;

/** The contested-claim stripe as `rgba()` text, or no line when `map.hatch` is missing. */
const hatchLine = (resolved: Tree): string[] => {
  const hatch = (resolved.map as Tree | undefined)?.hatch as Tree | undefined;

  return hatch === undefined
    ? []
    : [
        `export const hatchLine = ${JSON.stringify(
          `rgba(${hexChannels(String(hatch.colour)).join(', ')}, ${hatch.opacity})`
        )};`,
      ];
};

/** `design/tokens.generated.ts`: one `as const` export for each group, then its `px` lengths and `ms` durations as numbers, and `hatchLine`. */
const typescript = ({ dictionary }: FormatFnArguments): string => {
  const resolved = resolvedTree(dictionary);

  const exports = Object.entries(resolved).flatMap(([group, value]) => {
    const node = value as Tree;
    const unit = group === 'motion' ? MS : PX;
    const numbers = numbersIn(node, unit);
    const suffix = group === 'motion' ? 'Ms' : 'Px';

    return [
      constant(group, node),
      ...(Object.keys(numbers).length > 0
        ? [constant(`${group}${suffix}`, numbers)]
        : []),
    ];
  });

  return `${[TS_HEADER, ...exports, ...hatchLine(resolved)].join('\n\n')}\n`;
};

/** `app/tokens.css` and `design/tokens.generated.ts` from the DTCG `tokens`, keyed by the destinations in `out`. */
export const buildTokens = async (
  tokens: DesignTokens,
  out: { css: string; ts: string }
): Promise<Record<string, string>> => {
  const dictionary = new StyleDictionary({
    hooks: {
      formats: {
        'kinscape/css': css,
        'kinscape/typescript': typescript,
      },
      transforms: {
        'kinscape/css-text': {
          transform: token =>
            cssText({
              $type: token.$type,
              $value: token.$value,
              path: token.path,
            }),
          type: 'value',
        },
        'kinscape/name': {
          transform: token => systemName(token.path),
          type: 'name',
        },
      },
    },
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: {
      kinscape: {
        files: [
          { destination: out.css, format: 'kinscape/css' },
          { destination: out.ts, format: 'kinscape/typescript' },
        ],
        transforms: ['kinscape/name', 'kinscape/css-text'],
      },
    },
    tokens,
    usesDtcg: true,
  });

  const files = await dictionary.formatPlatform('kinscape');

  return Object.fromEntries(
    files.map(({ destination, output }) => [destination, String(output)])
  );
};
