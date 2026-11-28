import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DEFAULT_TAG } from '@ks/app/components/foundation/Text';

const root = join(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const source = JSON.parse(read('design/kinscape.tokens.json'));

/** The 20 type roles (SC.12, NFR-06). To add or rename a role, start here. */
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
const camel = (name: string) =>
  name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
const VARIANTS = ROLES.map(camel);

/** The first group of each match of `pattern` in `text`, once. */
const namesIn = (text: string, pattern: RegExp) =>
  new Set([...text.matchAll(pattern)].map(([, name]) => name));

/** The role names in the `var(--type-…)` calls of `text`. */
const varNames = (text: string) => [
  ...text
    .matchAll(/var\(--type-([a-z0-9-]+?)-(?:font|size|line|weight|tracking)\)/g)
    .map(([, name]) => name),
];

/** The `variant` of each `KinScape.Text` import in `board`. */
const textVariants = (board: string) =>
  [...board.matchAll(/<x-import\b[^>]*KinScape\.Text"[^>]*>/g)].flatMap(
    ([tag]) => [
      ...tag.matchAll(/variant="([A-Za-z0-9]+)"/g).map(([, name]) => name),
    ]
  );

/** The classes of `board` that no `.class` rule defines, in `css` or in the board itself. */
const undefinedClasses = (board: string, css: string) => {
  const defined = namesIn(`${css}\n${board}`, /(?<![\w-])\.([a-z][\w-]*)/g);

  return [...board.matchAll(/class="([^"]*)"/g)]
    .flatMap(([, value]) => value.split(/\s+/))
    .filter(name => name !== '' && !defined.has(name));
};

/** Each name in `names` that is not in `allowed`, once. */
const unknown = (names: string[], allowed: string[]) => [
  ...new Set(names.filter(name => !allowed.includes(name))),
];

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
    const css = read('app/components/foundation/Text.module.css');
    const classes = namesIn(css, /^\.(\w+) \{/gm);

    expect(Object.keys(DEFAULT_TAG).toSorted()).toEqual(
      VARIANTS.filter(
        name => !['display', 'h1', 'h2', 'h3'].includes(name)
      ).toSorted()
    );
    expect(
      VARIANTS.filter(name => !classes.has(name)),
      'a role with no class'
    ).toEqual([]);
  });

  it('names no other role in a var(--type-…) of the app, the features or the libraries', () => {
    const files = globSync('{app,features,lib}/**/*.{css,ts,tsx,mts}', {
      cwd: root,
    }).filter(file => !file.includes('__tests__'));
    const used = files.flatMap(file => varNames(read(file)));

    expect(used.length).toBeGreaterThan(50);
    expect(unknown(used, ROLES)).toEqual([]);
  });

  it('names no other role on a board', () => {
    const css = read('design/canvas/project/ds/kinscape/tokens.css');
    const boards = globSync('design/canvas/project/*.dc.html', {
      cwd: root,
    }).map(file => read(file));

    expect(boards.flatMap(varNames).length).toBeGreaterThan(100);
    expect(boards.flatMap(textVariants).length).toBeGreaterThan(50);
    expect(unknown(boards.flatMap(varNames), ROLES)).toEqual([]);
    expect(unknown(boards.flatMap(textVariants), VARIANTS)).toEqual([]);
    expect(
      boards.flatMap(board => undefinedClasses(board, css)),
      'a board class that no rule defines'
    ).toEqual([]);
  });

  it('finds an unknown name in a var(), a Text variant and a class', () => {
    const board = [
      '<style>.note { margin: 0 }</style>',
      '<x-import component-from-global-scope="KinScape.Text" variant="button">x</x-import>',
      '<p class="note button" style="font-size: var(--type-body-xl-size)"></p>',
    ].join('');

    expect(unknown(varNames(board), ROLES)).toEqual(['body-xl']);
    expect(unknown(textVariants(board), VARIANTS)).toEqual(['button']);
    expect(undefinedClasses(board, '.body { color: red }')).toEqual(['button']);
  });
});
