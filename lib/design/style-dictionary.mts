/** Style Dictionary for KinScape: the DTCG token file in, `app/tokens.css` and `design/tokens.json` out. */

import type {
  DesignTokens,
  FormatFnArguments,
  TransformedToken,
} from 'style-dictionary/types';

import StyleDictionary from 'style-dictionary';

import type { Tree } from '#ks/design/types.ts';

import { referenceIn, resolveTokens } from '#ks/design/tokens.mts';
import {
  cssName,
  fontStack,
  MAP_SHARED,
  systemName,
} from '#ks/lib/design/css.mts';
import { cssText, fontStackOf } from '#ks/lib/design/dtcg.mts';

const HEADER =
  '/* Generated from design/kinscape.tokens.json by `npm run tokens`. Do not edit. */';

const referenceOf = (token: TransformedToken): string | undefined =>
  referenceIn(token.original.$value);

/** A `map` token goes to the CSS only if HTML markers draw with it too. */
const inCss = ({ path }: TransformedToken): boolean =>
  path[0] !== 'map' ||
  MAP_SHARED.some(shared => {
    const parts = shared.split('.');

    return parts.every((part, at) => path[at + 1] === part);
  });

const cssValue = (token: TransformedToken): string => {
  const reference = referenceOf(token);

  if (reference !== undefined) {
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

/** The value that `design/tokens.json` holds: a reference as text, a `map` number as a number, else the CSS text. */
const oldValue = (token: TransformedToken): number | string => {
  const original: unknown = token.original.$value;

  if (referenceOf(token) !== undefined) {
    return String(original);
  }

  if (token.path[0] === 'map' && token.$type === 'number') {
    return Number(original);
  }

  return token.$type === 'fontFamily'
    ? fontStackOf(original as string | string[])
    : String(token.$value);
};

/** Each `$description` of a group or a token, in file order. The design system bundle embeds `design/tokens.json`, so its key order must not change. */
const collectNotes = (
  node: Record<string, unknown>,
  path: string[],
  notes: Tree
): void => {
  for (const [key, child] of Object.entries(node)) {
    if (key === '$description') {
      put(notes, path, String(child));
    } else if (!key.startsWith('$')) {
      // `dtcgProblems` ran first and found no member that is not a group or a token.
      collectNotes(child as Record<string, unknown>, [...path, key], notes);
    }
  }
};

/** The tokens in the shape of `design/tokens.json`, before the references resolve. Both direct-reader outputs take their key order from it. */
const oldTree = ({ allTokens }: FormatFnArguments['dictionary']): Tree => {
  const tree: Tree = {};

  for (const token of allTokens) {
    put(tree, token.path, oldValue(token));
  }

  return tree;
};

/** `design/tokens.json` for its direct readers: the tokens, then `notes` from each `$description`. */
const tokensJson =
  (source: Record<string, unknown>) =>
  ({ dictionary }: FormatFnArguments): string => {
    const notes: Tree = {};

    collectNotes(source, [], notes);

    return `${JSON.stringify({ ...oldTree(dictionary), notes }, null, 2)}\n`;
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

/** `design/tokens.generated.ts`: one `as const` export for each group, then its `px` lengths and `ms` durations as numbers. */
const typescript = ({ dictionary }: FormatFnArguments): string => {
  const resolved = resolveTokens(oldTree(dictionary));

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

  return `${[TS_HEADER, ...exports].join('\n\n')}\n`;
};

/** `app/tokens.css`, `design/tokens.json` and `design/tokens.generated.ts` from the DTCG `tokens`, keyed by the destinations in `out`. */
export const buildTokens = async (
  tokens: DesignTokens,
  out: { css: string; json: string; ts: string }
): Promise<Record<string, string>> => {
  const dictionary = new StyleDictionary({
    hooks: {
      formats: {
        'kinscape/css': css,
        'kinscape/tokens-json': tokensJson(tokens),
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
          { destination: out.json, format: 'kinscape/tokens-json' },
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
