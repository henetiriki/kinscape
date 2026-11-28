import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DEFAULT_TAG } from '@ks/app/components/foundation/Text';

const root = join(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const source = JSON.parse(read('design/kinscape.tokens.json'));

/** The 20 type roles (SC.12, NFR-06). Adding or renaming a role starts here. */
const ROLES = [
  'body',
  'caption',
  'chip',
  'chip-off',
  'control',
  'control-small',
  'credits',
  'display',
  'h1',
  'h2',
  'h3',
  'label',
  'link',
  'link-small',
  'mono',
  'mono-caption',
  'mono-title',
  'overline',
  'small',
  'title',
];
/** Old role names that no other role reuses. A board class with one of them is stale. */
const RETIRED = [
  'body-l',
  'button',
  'button-s',
  'h1-phone',
  'link-s',
  'mono-l',
  'mono-m',
  'overline-tight',
];
const camel = (name: string) =>
  name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());

/** The names after `prefix` in `text`, up to the next `-size`, `-line` and so on. */
const namesIn = (text: string, pattern: RegExp) =>
  new Set([...text.matchAll(pattern)].map(([, name]) => name));

// NFR-06
describe('the type roles', () => {
  it('holds the 20 names in the type group, and no other', () => {
    expect(Object.keys(source.type).toSorted()).toEqual(ROLES);
  });

  it('gives each role a font, size, line, weight and tracking', () => {
    for (const [name, role] of Object.entries<Record<string, unknown>>(
      source.type
    )) {
      expect(
        Object.keys(role).filter(key => !key.startsWith('$')),
        name
      ).toEqual(['font', 'size', 'line', 'weight', 'tracking']);
    }
  });

  it('has a Text style for each role except the headings, and a class for each', () => {
    const variants = ROLES.map(camel);
    const css = read('app/components/foundation/Text.module.css');
    const classes = namesIn(css, /^\.(\w+) \{/gm);

    expect(Object.keys(DEFAULT_TAG).toSorted()).toEqual(
      variants
        .filter(name => !['display', 'h1', 'h2', 'h3'].includes(name))
        .toSorted()
    );
    expect(
      variants.filter(name => !classes.has(name)),
      'a role with no class'
    ).toEqual([]);
  });

  // The check that fails an unknown name: it reads each `var(--type-…)` of the app.
  it('names no other role in a var(--type-…) of the app, the features or the tokens', () => {
    const files = [
      ...globSync('{app,features}/**/*.{css,tsx}', { cwd: root }).filter(
        file => !file.includes('__tests__')
      ),
    ];
    const used = files.flatMap(file => [
      ...read(file).matchAll(
        /var\(--type-([a-z0-9-]+)-(?:font|size|line|weight|tracking)\)/g
      ),
    ]);

    expect(used.length).toBeGreaterThan(50);
    expect(
      [...new Set(used.map(([, name]) => name))].filter(
        name => !ROLES.includes(name)
      )
    ).toEqual([]);
  });

  it('names no other role on a board', () => {
    const boards = globSync('design/canvas/project/*.dc.html', {
      cwd: root,
    }).map(file => read(file));
    const variants = ROLES.map(camel);
    const textTags = boards.flatMap(board =>
      [...board.matchAll(/<x-import\b[^>]*KinScape\.Text"[^>]*>/g)].map(
        ([tag]) => tag
      )
    );
    const variantsUsed = textTags.flatMap(tag => [
      ...tag.matchAll(/variant="([A-Za-z0-9]+)"/g).map(([, name]) => name),
    ]);
    const varsUsed = boards.flatMap(board => [
      ...board
        .matchAll(
          /var\(--type-([a-z0-9-]+?)-(?:font|size|line|weight|tracking)\)/g
        )
        .map(([, name]) => name),
    ]);
    const classesUsed = boards.flatMap(board =>
      [...board.matchAll(/class="([^"]*)"/g)].flatMap(([, value]) =>
        value.split(/\s+/)
      )
    );

    expect(varsUsed.length).toBeGreaterThan(100);
    expect(variantsUsed.length).toBeGreaterThan(50);
    expect(varsUsed.filter(name => !ROLES.includes(name))).toEqual([]);
    expect(variantsUsed.filter(name => !variants.includes(name))).toEqual([]);
    expect(classesUsed.filter(name => RETIRED.includes(name))).toEqual([]);
  });

  it('finds an unknown role name', () => {
    const text = 'font-size: var(--type-body-l-size);';

    expect([...namesIn(text, /--type-([a-z0-9-]+)-size/g)]).toEqual(['body-l']);
    expect(ROLES).not.toContain('body-l');
  });
});
