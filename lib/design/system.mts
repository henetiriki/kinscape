/** `design/tokens.json`, `DESIGN.md` and the font list as the files of KinScape's design system (Spec #445). */

import type { Tree } from '../../design/types.ts';
import type {
  SystemFile,
  SystemFont,
  SystemGroup,
  SystemToken,
  SystemTokens,
} from './types.ts';

import { isTree, REFERENCE } from '../../design/tokens.mts';
import { cssName } from './css.mts';

/** The `DESIGN.md` sections the README holds, in this order. */
export const README_SECTIONS = [
  'Brand',
  'Fonts',
  'Colours',
  'Shape and depth',
  'Components',
  'States',
  'Feedback and validation',
  'Event glyphs',
  'Copy',
];

const LINK = /(!?)\[([^\]]*)\]\(([^)]*)\)/g;
const FILE = /path:\s*'([^']+)',\s*style:\s*'([^']+)',\s*weight:\s*'([^']+)'/g;

/** The name a token has in the design system: its `cssName` without `--`. */
const nameOf = (path: string[]): string => cssName(path).slice(2);

const leaves = (node: Tree, path: string[]): [string[], number | string][] =>
  Object.entries(node).flatMap(([key, child]) =>
    isTree(child)
      ? leaves(child, [...path, key])
      : [[[...path, key], child] as [string[], number | string]]
  );

const noteAt = (notes: Tree, path: string[]): string | undefined => {
  const note = path.reduce<unknown>(
    (node, key) => (node as Tree | undefined)?.[key],
    notes
  );

  return typeof note === 'string' ? note : undefined;
};

const alias = (value: string): string => {
  const reference = REFERENCE.exec(value)?.[1];

  return reference === undefined ? value : `{${nameOf(reference.split('.'))}}`;
};

/** Each leaf of the given groups that has a note, as a token: aliases point at the converted name. */
const noted = (tokens: Tree, notes: Tree, groups: string[]): SystemToken[] =>
  groups.flatMap(group => {
    return leaves(tokens[group] as Tree, [group]).flatMap(([path, value]) => {
      const usage = noteAt(notes, path);

      return usage === undefined
        ? []
        : [{ name: nameOf(path), usage, value: alias(String(value)) }];
    });
  });

const capitalised = (key: string): string =>
  key.charAt(0).toUpperCase() + key.slice(1);

const groupFor = (tokens: Tree, notes: Tree, key: string): SystemGroup => {
  const styles = Object.entries(tokens.type as Record<string, Tree>);

  return {
    family: key,
    name: capitalised(key),
    styles: styles.flatMap(([name, style]) =>
      style.font === `{font.${key}}`
        ? [
            {
              fontSize: String(style.size),
              fontStyle: 'normal',
              fontWeight: String(style.weight),
              letterSpacing: String(style.tracking),
              lineHeight: String(style.line),
              name,
              usage: noteAt(notes, ['type', name]) as string,
            },
          ]
        : []
    ),
  };
};

const slug = (family: string): string =>
  family.toLowerCase().replaceAll(' ', '-');

const familyName = (stack: string): string =>
  stack.split(',')[0].replaceAll("'", '').trim();

/** The font files `app/layout.tsx` loads, from the `path`, `style` and `weight` literals of its `src` lists. */
export const fontFiles = (layout: string): SystemFile[] =>
  [...layout.matchAll(FILE)].map(([, path, style, weight]) => ({
    path,
    style,
    weight,
  }));

/** `type.fonts`: each file under `fonts/`, with the family whose slug starts its file name. */
export const systemFonts = (
  files: SystemFile[],
  tokens: Tree
): SystemFont[] => {
  const families = Object.values(tokens.font as Tree).map(stack =>
    familyName(String(stack))
  );

  return files.map(({ path, style, weight }) => {
    const base = path.slice(path.lastIndexOf('/') + 1);
    const family = families.find(name => base.startsWith(`${slug(name)}-`));

    if (family === undefined) {
      throw new Error(`No font in tokens.json for ${base}`);
    }

    return { family, file: `fonts/${base}`, style, weight };
  });
};

/** `tokens.json` for the type: the tokens that have a note, in one light theme. */
export const systemTokens = (raw: Tree, fonts: SystemFont[]): SystemTokens => {
  const notes = raw.notes as Tree;
  const font = raw.font as Tree;
  const keys = Object.keys(font);
  const unresolved = Object.fromEntries(
    Object.entries(raw).filter(([group]) => group !== 'notes')
  );
  const list = (...groups: string[]) => noted(unresolved, notes, groups);

  return {
    color: {
      themes: [{ id: 'light', name: 'Light' }],
      tokens: list('colour', 'map'),
    },
    focus: { tokens: list('focus') },
    name: 'KinScape',
    radius: { tokens: list('radius') },
    shadow: { tokens: list('shadow') },
    size: { tokens: list('size') },
    spacing: { tokens: list('space') },
    type: {
      families: Object.fromEntries(keys.map(key => [key, String(font[key])])),
      fonts,
      groups: keys.map(key => groupFor(unresolved, notes, key)),
    },
    version: 1,
  };
};

/** The `unicode-range` of the `@font-face` for `file` in a @fontsource stylesheet, if it has one. */
export const unicodeRange = (css: string, file: string): string | undefined =>
  new RegExp(
    String.raw`url\(\./files/${file.replaceAll('.', String.raw`\.`)}\)[^}]*?unicode-range:\s*([^;]+);`
  ).exec(css)?.[1];

/** One `@font-face` per font; `ranges` maps a font's `file` to its `unicode-range`. */
export const fontFaces = (
  fonts: SystemFont[],
  ranges: Record<string, string>
): string =>
  fonts
    .map(({ family, file, style, weight }) => {
      if (ranges[file] === undefined) {
        throw new Error(`No unicode-range for ${file}`);
      }

      return [
        '@font-face {',
        `  font-family: '${family}';`,
        `  font-style: ${style};`,
        `  font-weight: ${weight};`,
        '  font-display: swap;',
        `  src: url(${file}) format('woff2');`,
        `  unicode-range: ${ranges[file]};`,
        '}',
      ].join('\n');
    })
    .join('\n\n');

const declarations = (tokens: SystemToken[]): string[] =>
  tokens.map(({ name, value }) => {
    const reference = REFERENCE.exec(value)?.[1];

    return `  --${name}: ${reference === undefined ? value : `var(--${reference})`};`;
  });

const block = (selector: string, lines: string[]): string =>
  [`${selector} {`, ...lines, '}'].join('\n');

/** `tokens.css`: what the type would compile from `tokens.json`, which a page synced from code never does. */
export const systemCss = (
  system: SystemTokens,
  ranges: Record<string, string>
): string =>
  [
    '/* KinScape — generated from tokens.json */',
    block(':root, [data-theme="light"]', [
      ...declarations(system.color.tokens),
      ...declarations(system.shadow.tokens),
    ]),
    block(':root', [
      ...declarations(system.spacing.tokens),
      ...declarations(system.radius.tokens),
      ...declarations(system.size.tokens),
      ...declarations(system.focus.tokens),
      ...Object.entries(system.type.families).map(
        ([key, stack]) => `  --font-${key}: ${stack};`
      ),
    ]),
    ...system.type.groups.flatMap(({ family, styles }) =>
      styles.map(style =>
        block(`.${style.name}`, [
          `  font-family: var(--font-${family});`,
          `  font-size: ${style.fontSize};`,
          `  line-height: ${style.lineHeight};`,
          `  font-weight: ${style.fontWeight};`,
          `  letter-spacing: ${style.letterSpacing};`,
          `  font-style: ${style.fontStyle};`,
        ])
      )
    ),
    fontFaces(system.type.fonts, ranges),
    '',
  ].join('\n\n');

/** The README: the listed `DESIGN.md` sections as they are, with any link that isn't `https` made plain text. */
export const readme = (design: string): string => {
  const sections = design.split(/^(?=## )/m);

  return [
    '# KinScape design',
    ...README_SECTIONS.map(name => {
      const section = sections.find(text => text.startsWith(`## ${name}\n`));

      if (section === undefined) {
        throw new Error(`DESIGN.md has no "${name}" section`);
      }

      return section.trim();
    }),
    '',
  ]
    .join('\n\n')
    .replace(LINK, (link, bang: string, text: string, target: string) =>
      target.startsWith('https://') ? link : text
    );
};

/** `design-system.json`: the index, synced from code (Spec #445 › Type format). */
export const systemIndex = (
  sha: string,
  at: string
): Record<string, unknown> => ({
  assetGroups: {
    Icons: { files: {}, name: 'Icons', order: [], tile: 'xs' },
    Logos: { files: {}, name: 'Logos', order: [], tile: 'l' },
  },
  blobs: {},
  createdOnFiles: { at, v: 1 },
  docs: { readme: 'project/README.md', sections: [] },
  editing: 'code',
  groups: ['Logos', 'Icons'],
  lastChange: {
    at,
    by: 'KinScape repo',
    note: `npm run design-system at ${sha}`,
    via: `code · henetiriki/kinscape@${sha}`,
  },
  layout: 'files',
  libraries: [
    { name: 'react', version: '18' },
    { name: 'react-dom', version: '18' },
  ],
  namespace: 'KinScape',
  sections: {},
  title: 'KinScape',
  v: 3,
});
