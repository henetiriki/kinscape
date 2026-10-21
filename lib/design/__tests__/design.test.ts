import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { generate } from '../../../scripts/tokens.mts';
import { strayColours } from '../tokens.mts';

const root = join(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const tokens = JSON.parse(read('design/tokens.json'));

// The D4 check: fails locally and in CI's test job.
it('has app/tokens.css up to date with design/tokens.json', () => {
  expect(
    read('app/tokens.css'),
    'app/tokens.css is out of date: run `npm run tokens`'
  ).toBe(generate(root));
});

// Snapshots are written values only; each colour in them must be a token (opacity aside).
describe('the design snapshots', () => {
  const snapshots = readdirSync(join(root, 'design/source')).filter(name =>
    name.endsWith('.html')
  );

  it('are all checked', () => {
    expect(snapshots).toHaveLength(20);
  });

  it.each(snapshots)('%s uses only token colours', name => {
    expect(strayColours(read(`design/source/${name}`), tokens)).toEqual([]);
  });
});

const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i;

describe('colour literals', () => {
  const components = readdirSync(join(root, 'components'))
    .filter(name => name.endsWith('.tsx'))
    .map(name => `components/${name}`);

  it.each(['app/globals.css', 'lib/map/style.ts', ...components])(
    '%s has none',
    path => {
      expect(read(path)).not.toMatch(COLOUR_LITERAL);
    }
  );
});

// The thumb is a pseudo-element the browser won't report, so check the source.
it('colours the slider thumb with the brand token', () => {
  const thumbs = read('app/globals.css').match(
    /::-(?:webkit|moz)-(?:slider|range)-thumb \{[^}]*\}/g
  );

  expect(thumbs).toHaveLength(2);
  expect(thumbs!.every(rule => rule.includes('background: var(--brand)'))).toBe(
    true
  );
});

describe('tokens.json', () => {
  it('keys the map polity tints by the ids in data/polities.json, plus default', () => {
    const ids = JSON.parse(read('data/polities.json')).names.map(
      (entry: { polity: string }) => entry.polity
    );

    expect(Object.keys(tokens.map.polity).toSorted()).toEqual(
      [...new Set<string>(ids), 'default'].toSorted()
    );
  });
});
