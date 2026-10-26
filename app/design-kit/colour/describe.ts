import {
  contrastRatio,
  formatColour,
  formatRatio,
} from '@/lib/design/contrast.mts';

import type { On, Role, SystemLine } from './types';

type Tree = { [key: string]: number | string | Tree };

const SURFACE: On = ['colour.surface', 'surface'];

/** The resolved value at a token path such as `colour.brand` or `map.hatch.colour`. */
export const valueAt = (tokens: Tree, path: string): string => {
  let node: number | string | Tree = tokens;

  for (const key of path.split('.')) {
    node = (node as Tree)[key];
  }

  return String(node);
};

/** The name you type: `--brand` for a colour token, the path for a map token. */
export const nameOf = (path: string): string =>
  path.startsWith('colour.') ? `--${path.slice('colour.'.length)}` : path;

/** The unrounded contrast of a token on what it is measured on (`surface` unless `on` says). */
export const ratioOf = (tokens: Tree, path: string, on: On = SURFACE): number =>
  contrastRatio(valueAt(tokens, path), valueAt(tokens, on[0]));

const measure = (
  tokens: Tree,
  path: string,
  role: Role | SystemLine['role'],
  on?: On
): string => {
  if (role === 'text' || role === 'border' || role === 'disabled') {
    const ratio = formatRatio(ratioOf(tokens, path, on));

    if (role === 'disabled') {
      return `${ratio}, disabled`;
    }

    return on === undefined ? ratio : `${ratio} on ${on[1]}`;
  }

  return role === 'plain' || role === 'note' ? '' : role;
};

/** `#163019 · 14.3:1`; a `plain` or `note` line has only the value. */
export const describe = (
  tokens: Tree,
  path: string,
  role: Role | SystemLine['role'],
  on?: On
): string =>
  [formatColour(valueAt(tokens, path)), measure(tokens, path, role, on)]
    .filter(Boolean)
    .join(' · ');
