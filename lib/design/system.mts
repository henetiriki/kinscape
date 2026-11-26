/** `design/kinscape.tokens.json`, `DESIGN.md`, the design files that `DESIGN_FILES` lists and the font list as the files of KinScape's design system (Spec #445). */

import type {
  DtcgToken,
  DtcgTree,
  SystemFile,
  SystemFont,
  SystemGroup,
  SystemToken,
  SystemTokens,
} from '#ks/lib/design/types.ts';

import { BUNDLE_CSS, BUNDLE_JS, NAMESPACE } from '#ks/lib/design/bundle.mts';
import { familyName, systemName } from '#ks/lib/design/css.mts';
import {
  notesOf,
  REFERENCE,
  resolvedText,
  stepText,
  tokenLeaves,
  tokenText,
} from '#ks/lib/design/dtcg.mts';
import { roleSentences } from '#ks/lib/design/roles.mts';

/** The design files that hold the README sections and the component bullets, relative to the repo root. */
export const DESIGN_FILES = [
  'design/DESIGN.md',
  'design/topics/foundations.md',
  'design/topics/layout.md',
  'design/topics/components.md',
  'design/topics/feedback.md',
  'design/topics/map.md',
];

/** The design file sections the README holds, in this order. */
export const README_SECTIONS = [
  'Brand',
  'Fonts',
  'Colours',
  'Layout',
  'Shape and depth',
  'Motion',
  'Components',
  'States',
  'Feedback and validation',
  'Event glyphs',
  'Map style',
  'Copy',
];

const LINK = /(!?)\[([^\]]*)\]\(([^)]*)\)/g;
const FILE = /path:\s*'([^']+)',\s*style:\s*'([^']+)',\s*weight:\s*'([^']+)'/g;

const alias = (value: string): string => {
  const reference = REFERENCE.exec(value)?.[1];

  return reference === undefined
    ? value
    : `{${systemName(reference.split('.'))}}`;
};

/** `$deprecated` is `true` or a message. `false` and no value both mean the token is in use. */
const isDeprecated = (token: DtcgToken): boolean =>
  token.$deprecated === true || typeof token.$deprecated === 'string';

/** Each leaf of the given groups that has a note and no `$deprecated`, as a token: aliases point at the converted name. `extra` gives sentences that follow the note. */
const noted = (
  tree: DtcgTree,
  notes: Map<string, string>,
  groups: string[],
  value: (token: DtcgToken) => string,
  extra: (path: string[]) => string[] = () => []
): SystemToken[] =>
  groups.flatMap(group =>
    tokenLeaves(tree[group] as DtcgTree, [group]).flatMap(token => {
      const usage = notes.get(token.path.join('.'));

      return usage === undefined || isDeprecated(token)
        ? []
        : [
            {
              name: systemName(token.path),
              usage: [usage, ...extra(token.path)].join(' '),
              value: alias(value(token)),
            },
          ];
    })
  );

const capitalised = (key: string): string =>
  key.charAt(0).toUpperCase() + key.slice(1);

const groupFor = (
  tree: DtcgTree,
  notes: Map<string, string>,
  key: string
): SystemGroup => {
  const styles = Object.entries(tree.type as Record<string, DtcgTree>).filter(
    ([name]) => !name.startsWith('$')
  );

  return {
    family: key,
    name: capitalised(key),
    styles: styles.flatMap(([name, style]) => {
      const text = Object.fromEntries(
        tokenLeaves(style, ['type', name]).map(token => [
          token.path[2],
          stepText(tree, token),
        ])
      );

      return text.font === `{font.${key}}`
        ? [
            {
              fontSize: text.size,
              fontStyle: 'normal',
              fontWeight: text.weight,
              letterSpacing: text.tracking,
              lineHeight: text.line,
              name,
              usage: notes.get(`type.${name}`) as string,
            },
          ]
        : [];
    }),
  };
};

const slug = (family: string): string =>
  family.toLowerCase().replaceAll(' ', '-');

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
  tokens: DtcgTree
): SystemFont[] => {
  const families = tokenLeaves(tokens.font as DtcgTree, ['font']).map(token =>
    familyName(tokenText(token))
  );

  return files.map(({ path, style, weight }) => {
    const base = path.slice(path.lastIndexOf('/') + 1);
    const family = families.find(name => base.startsWith(`${slug(name)}-`));

    if (family === undefined) {
      throw new Error(`No font in design/kinscape.tokens.json for ${base}`);
    }

    return { family, file: `fonts/${base}`, style, weight };
  });
};

/** `tokens.json` for the type: the tokens that have a note, in one light theme. */
export const systemTokens = (
  tree: DtcgTree,
  fonts: SystemFont[]
): SystemTokens => {
  const notes = notesOf(tree);
  const font = tokenLeaves(tree.font as DtcgTree, ['font']);
  const keys = font.map(({ path }) => path[1]);
  const list = (...groups: string[]) =>
    noted(tree, notes, groups, token => stepText(tree, token));
  /** The format rules allow an alias only in `color`, so these families hold values. */
  const valued = (group: string) => ({
    tokens: noted(tree, notes, [group], ({ path }) =>
      resolvedText(tree, path.join('.'))
    ),
  });

  return {
    border: { tokens: list('border') },
    breakpoint: valued('breakpoint'),
    color: {
      themes: [{ id: 'light', name: 'Light' }],
      tokens: noted(tree, notes, ['colour', 'map'], tokenText, path =>
        roleSentences(tree, path.join('.'))
      ),
    },
    focus: { tokens: list('focus') },
    layout: valued('layout'),
    motion: { tokens: list('motion') },
    name: 'KinScape',
    radius: { tokens: list('radius') },
    shadow: { tokens: list('shadow') },
    size: { tokens: list('size') },
    spacing: { tokens: list('space') },
    type: {
      families: Object.fromEntries(
        font.map(token => [token.path[1], tokenText(token)])
      ),
      fonts,
      groups: keys.map(key => groupFor(tree, notes, key)),
    },
    version: 1,
    z: valued('z'),
  };
};

/** Each token with `$deprecated`, as its CSS name and value. `tokens.json` leaves them out; `tokens.css` keeps them for the boards and the `features/` CSS. */
export const deprecatedTokens = (tree: DtcgTree): SystemToken[] =>
  Object.keys(tree)
    .filter(group => group !== 'scale' && typeof tree[group] === 'object')
    .flatMap(group => tokenLeaves(tree[group] as DtcgTree, [group]))
    .filter(isDeprecated)
    .map(token => ({
      name: systemName(token.path),
      usage: String(token.$deprecated),
      value: alias(stepText(tree, token)),
    }));

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
  ranges: Record<string, string>,
  deprecated: SystemToken[]
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
      ...declarations(system.border.tokens),
      ...declarations(system.focus.tokens),
      ...declarations(system.motion.tokens),
      ...declarations(system.layout.tokens),
      ...declarations(system.breakpoint.tokens),
      ...declarations(system.z.tokens),
      ...Object.entries(system.type.families).map(
        ([key, stack]) => `  --font-${key}: ${stack};`
      ),
    ]),
    ...(deprecated.length > 0
      ? [
          block(':root', [
            '  /* Deprecated: boards and the features/ CSS still use these names. */',
            ...declarations(deprecated),
          ]),
        ]
      : []),
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

/** `text` with any link that isn't `https` made plain text. */
export const plainLinks = (text: string): string =>
  text.replace(LINK, (link, bang: string, label: string, target: string) =>
    target.startsWith('https://') ? link : label
  );

/** How a canvas uses the controls (Spec #450): the canvas install reads the file names here. */
const CANVAS_SECTION = `## Using the controls on a canvas

The controls are on \`window.${NAMESPACE}\`. After React 18, load \`components/${BUNDLE_CSS}\`, then \`components/${BUNDLE_JS}\`. Mount a control with \`<x-import component-from-global-scope="${NAMESPACE}.Button">\`.`;

/** The `## ` sections of the design files, in file order. Each file's frontmatter and title go. */
export const designSections = (texts: string[]): string[] =>
  texts.flatMap(text =>
    text
      .replace(/^---\n[\s\S]*?\n---\n/, '')
      .split(/^(?=## )/m)
      .filter(section => section.startsWith('## '))
  );

/** The README: the listed design file sections as they are, then how a canvas uses the controls. */
export const readme = (sections: string[]): string =>
  plainLinks(
    [
      '# KinScape design',
      ...README_SECTIONS.map(name => {
        const section = sections.find(text => text.startsWith(`## ${name}\n`));

        if (section === undefined) {
          throw new Error(`The design files have no "${name}" section`);
        }

        return section.trim();
      }),
      CANVAS_SECTION,
      '',
    ].join('\n\n')
  );

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
  namespace: NAMESPACE,
  sections: {},
  title: 'KinScape design system',
  v: 3,
});
