import { describe, expect, it } from 'vitest';

import tokens from '@ks/design/kinscape.tokens.json';
import { ratioOf } from '@ks/lib/design/contrast.mts';
import { COLOUR_ROLES, MINIMUM, roleSentences } from '@ks/lib/design/roles.mts';

// NFR-06: text 4.5:1, borders 3:1, on unrounded ratios.
describe('COLOUR_ROLES', () => {
  it('gives every text and border colour the contrast its role needs', () => {
    for (const { on, path, role } of COLOUR_ROLES) {
      const minimum = MINIMUM[role];

      if (minimum !== undefined) {
        expect(
          ratioOf(tokens, path, on),
          `${path} as ${role}`
        ).toBeGreaterThanOrEqual(minimum);
      }
    }
  });

  // NFR-06: a new colour token cannot go without a role.
  it('gives every colour token a role', () => {
    const listed = new Set(COLOUR_ROLES.map(({ path }) => path));
    const missing = Object.keys(tokens.colour)
      .map(name => `colour.${name}`)
      .filter(path => !listed.has(path));

    expect(missing).toEqual([]);
  });

  it('lists 43 entries: 30 swatches and 13 system lines', () => {
    expect(COLOUR_ROLES).toHaveLength(43);
  });

  it('gives the four -bg tokens the role fill only and error-border-soft the role decorative', () => {
    const role = (path: string) =>
      COLOUR_ROLES.find(entry => entry.path === path)?.role;

    expect(
      ['error', 'warning', 'success', 'info'].map(tone =>
        role(`colour.${tone}-bg`)
      )
    ).toEqual(['fill only', 'fill only', 'fill only', 'fill only']);
    expect(role('colour.error-border-soft')).toBe('decorative');
  });
});

describe('roleSentences', () => {
  it('gives a text role its ratio on surface and its least ratio', () => {
    expect(roleSentences(tokens, 'colour.ink-3')).toEqual([
      expect.stringMatching(
        /^Role: text\. Contrast \d+\.\d:1 on surface \(needs 4\.5:1\)\.$/
      ),
    ]);
  });

  it('gives a border role its least ratio of 3', () => {
    expect(roleSentences(tokens, 'colour.field-border')).toEqual([
      expect.stringMatching(/ on surface \(needs 3:1\)\.$/),
    ]);
  });

  it('gives any other role the role only', () => {
    expect(roleSentences(tokens, 'colour.surface')).toEqual([
      'Role: fill only.',
    ]);
    expect(roleSentences(tokens, 'colour.icon-disabled')).toEqual([
      'Role: disabled.',
    ]);
  });

  it('names the "on" token as the design system does', () => {
    expect(roleSentences(tokens, 'colour.error')).toEqual([
      expect.stringContaining(' on error-bg (needs 4.5:1).'),
    ]);
    expect(roleSentences(tokens, 'colour.credits')).toEqual([
      expect.stringContaining(' on map-land (needs 4.5:1).'),
    ]);
  });

  it('gives one sentence for each entry of a path', () => {
    const roles = [
      { path: 'colour.ink', role: 'text' as const },
      { path: 'colour.ink', role: 'border' as const },
    ];

    expect(roleSentences(tokens, 'colour.ink', roles)).toHaveLength(2);
  });

  it('gives no sentence for a path with no role', () => {
    expect(roleSentences(tokens, 'colour.nothing')).toEqual([]);
  });
});
