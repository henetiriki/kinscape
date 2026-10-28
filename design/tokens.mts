/** Design tokens at runtime: `design/tokens.json` with its `{group.name}` references resolved. */

import type { Tree } from './types.ts';

export const REFERENCE = /^\{([^{}]+)\}$/;

export const isTree = (value: unknown): value is Tree =>
  typeof value === 'object' && value !== null;

const lookup = (tokens: Tree, path: string): number | string | Tree => {
  let node: number | string | Tree = tokens;

  for (const key of path.split('.')) {
    if (!isTree(node) || !(key in node)) {
      throw new Error(`Unknown token reference {${path}}`);
    }

    node = node[key];
  }

  return node;
};

const resolveValue = (
  tokens: Tree,
  value: number | string | Tree,
  seen: string[]
): number | string | Tree => {
  if (isTree(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        resolveValue(tokens, child, seen),
      ])
    );
  }

  const path =
    typeof value === 'string' ? REFERENCE.exec(value)?.[1] : undefined;

  if (path === undefined) {
    return value;
  }

  if (seen.includes(path)) {
    throw new Error(`Token reference cycle at {${path}}`);
  }

  return resolveValue(tokens, lookup(tokens, path), [...seen, path]);
};

/** Replaces every `{group.name}` reference with the value it points at. */
export const resolveTokens = <T extends Tree>(tokens: T): T =>
  resolveValue(tokens, tokens, []) as T;
