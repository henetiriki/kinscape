/** The role of each colour token, and the token that its contrast uses (NFR-06). `$description` in `design/kinscape.tokens.json` holds the use text. */

import type { ColourRole, DtcgTree, Role } from '#ks/lib/design/types.ts';

import { DEFAULT_ON, formatRatio, ratioOf } from '#ks/lib/design/contrast.mts';
import { systemName } from '#ks/lib/design/css.mts';

/** The least contrast a role may show: text 4.5, a border 3. */
export const MINIMUM: Partial<Record<Role, number>> = {
  border: 3,
  text: 4.5,
};

const system = (
  tone: 'error' | 'info' | 'success' | 'warning'
): ColourRole[] => [
  { on: `colour.${tone}-bg`, path: `colour.${tone}`, role: 'text' },
  { path: `colour.${tone}-border`, role: 'border' },
  { path: `colour.${tone}-bg`, role: 'fill only' },
];

export const COLOUR_ROLES: ColourRole[] = [
  { path: 'colour.brand-pressed', role: 'text' },
  { path: 'colour.brand-hover', role: 'text' },
  { path: 'colour.brand', role: 'text' },
  { path: 'colour.brand-tint', role: 'fill only' },
  { path: 'colour.brand-tint-hover', role: 'fill only' },
  { path: 'colour.brand-tint-pressed', role: 'fill only' },
  { path: 'colour.pin', role: 'border' },
  { path: 'map.hatch.colour', role: 'map only' },
  { path: 'colour.ink', role: 'text' },
  { path: 'colour.ink-2', role: 'text' },
  { path: 'colour.ink-3', role: 'text' },
  { path: 'colour.ink-disabled', role: 'text' },
  { path: 'colour.icon-disabled', role: 'disabled' },
  { path: 'colour.field-border', role: 'border' },
  { path: 'colour.line-strong', role: 'decorative' },
  { path: 'colour.line', role: 'decorative' },
  { path: 'colour.track', role: 'decorative' },
  { path: 'colour.segment', role: 'fill only' },
  { path: 'colour.surface-2', role: 'fill only' },
  { path: 'colour.surface', role: 'fill only' },
  { on: 'colour.brand', path: 'colour.white', role: 'text' },
  { path: 'colour.white-45', role: 'overlay' },
  { path: 'colour.white-60', role: 'overlay' },
  { path: 'colour.focus-ring', role: 'border' },
  { on: 'colour.ink', path: 'colour.focus-ring-on-dark', role: 'border' },
  { path: 'colour.scrim', role: 'overlay' },
  { on: 'map.land', path: 'colour.credits', role: 'text' },
  { path: 'colour.google-text', role: 'text' },
  { path: 'colour.google-border', role: 'border' },
  { path: 'colour.google-mark', role: 'border' },
  ...system('error'),
  { path: 'colour.error-border-soft', role: 'decorative' },
  ...system('warning'),
  ...system('success'),
  ...system('info'),
];

const sentence = (tokens: DtcgTree, { on, path, role }: ColourRole): string => {
  const minimum = MINIMUM[role];

  if (minimum === undefined) {
    return `Role: ${role}.`;
  }

  const target = on ?? DEFAULT_ON;

  return `Role: ${role}. Contrast ${formatRatio(ratioOf(tokens, path, target))} on ${systemName(target.split('.'))} (needs ${minimum}:1).`;
};

/** One sentence for each entry of `path`, for the usage text of its token. */
export const roleSentences = (
  tokens: DtcgTree,
  path: string,
  roles: ColourRole[] = COLOUR_ROLES
): string[] =>
  roles
    .filter(entry => entry.path === path)
    .map(entry => sentence(tokens, entry));
