import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { DtcgTree, SystemTokens } from '@ks/lib/design/types.ts';

import { colour } from '@ks/lib/design/__tests__/dtcg-fixtures.ts';
import { BUNDLE_CSS, BUNDLE_JS, NAMESPACE } from '@ks/lib/design/bundle.mts';
import { cssName } from '@ks/lib/design/css.mts';
import { notesOf, resolvedText, tokenLeaves } from '@ks/lib/design/dtcg.mts';
import { formatProblems } from '@ks/lib/design/format.mts';
import { roleSentences } from '@ks/lib/design/roles.mts';
import {
  deprecatedTokens,
  DESIGN_FILES,
  designSections,
  fontFaces,
  fontFiles,
  readme,
  README_SECTIONS,
  systemCss,
  systemFonts,
  systemIndex,
  systemTokens,
  unicodeRange,
} from '@ks/lib/design/system.mts';
import { trackedFiles } from '@ks/scripts/__tests__/tracked';

const raw = JSON.parse(
  readFileSync('design/kinscape.tokens.json', 'utf8')
) as DtcgTree;
const design = designSections(
  DESIGN_FILES.map(file => readFileSync(file, 'utf8'))
);
const foundations = readFileSync('design/topics/foundations.md', 'utf8');
const files = fontFiles(readFileSync('app/layout.tsx', 'utf8'));
const fonts = systemFonts(files, raw);
const system = systemTokens(raw, fonts);
const ranges = Object.fromEntries(fonts.map(({ file }) => [file, 'U+0000']));

const all = (tokens: SystemTokens) =>
  [
    ...tokens.color.tokens,
    ...tokens.spacing.tokens,
    ...tokens.radius.tokens,
    ...tokens.shadow.tokens,
    ...tokens.size.tokens,
    ...tokens.border.tokens,
    ...tokens.focus.tokens,
    ...tokens.motion.tokens,
    ...tokens.layout.tokens,
    ...tokens.breakpoint.tokens,
    ...tokens.z.tokens,
  ].toSorted((a, b) => a.name.localeCompare(b.name));

describe('systemTokens', () => {
  it('carries every token that has a note, resolved to its value, with its note', () => {
    const notes = notesOf(raw);
    const byName = new Map(all(system).map(({ name, value }) => [name, value]));
    const follow = (value: string): string => {
      const target = /^\{(.+)\}$/.exec(value)?.[1];

      return target === undefined ? value : follow(String(byName.get(target)));
    };
    const expected = [
      'border',
      'breakpoint',
      'colour',
      'focus',
      'layout',
      'map',
      'motion',
      'radius',
      'shadow',
      'size',
      'space',
      'z',
    ].flatMap(group =>
      tokenLeaves(raw[group] as DtcgTree, [group]).flatMap(token => {
        const { path } = token;
        const usage = notes.get(path.join('.'));

        return usage === undefined || token.$deprecated !== undefined
          ? []
          : [
              {
                name: cssName(path).slice(2),
                usage: [usage, ...roleSentences(raw, path.join('.'))].join(' '),
                value: resolvedText(raw, path.join('.')),
              },
            ];
      })
    );

    expect(
      all(system).map(({ name, usage, value }) => ({
        name,
        usage,
        value: follow(value),
      }))
    ).toEqual(expected.toSorted((a, b) => a.name.localeCompare(b.name)));
    expect(all(system).length).toBe(196);
  });

  it('shows the purpose names, the border widths and the 8 motion tokens, and no step or space-N', () => {
    const names = all(system).map(({ name }) => name);

    expect(names.filter(name => /^space-\d+$/.test(name))).toEqual([]);
    expect(names).toContain('space-inset-m');
    expect(names).toContain('space-gap-3xl');
    expect(names).toContain('space-stack-xs');
    expect(system.border.tokens.map(({ name }) => name)).toEqual([
      'border-hairline',
      'border-emphasis',
    ]);
    expect(system.motion.tokens.map(({ name }) => name)).toEqual([
      'motion-easing',
      'motion-press',
      'motion-popup',
      'motion-sheet',
      'motion-changed-border',
      'motion-toast',
      'motion-press-offset',
      'motion-rise-offset',
    ]);
    expect(
      system.motion.tokens.find(({ name }) => name === 'motion-easing')?.value
    ).toBe('ease-out');
    expect(JSON.stringify(system)).not.toContain('space-4"');
  });

  it('writes a few tokens as literal name, value and note', () => {
    const byName = new Map(all(system).map(token => [token.name, token]));

    expect(byName.get('brand')?.value).toBe('#264f29');
    expect(byName.get('brand')?.usage).toMatch(
      /^Primary buttons, links and selection\. /
    );
    expect(byName.get('surface')?.value).toBe('#ffffff');
    expect(byName.get('space-inset-2xs')?.value).toBe('0.25rem');
    expect(byName.get('space-gap-2xs')?.usage).toBe(
      'Gap between an icon and its text, and between tight rows.'
    );
    expect(byName.get('radius-panel')?.value).toBe('12px');
    expect(byName.get('size-touch')?.value).toBe('44px');
  });

  it('ignores a $description on the type group', () => {
    const fixture = structuredClone(raw);

    (fixture.type as Record<string, unknown>).$description = 'Text styles.';

    expect(systemTokens(fixture, fonts).type.groups).toEqual(
      system.type.groups
    );
  });

  it('leaves out a token with no $description', () => {
    const fixture = structuredClone(raw);

    (fixture.colour as DtcgTree).undocumented = colour('#010203');

    const names = systemTokens(fixture, fonts).color.tokens.map(
      ({ name }) => name
    );

    expect(names).not.toContain('undocumented');
    expect(names).toContain('brand');
  });

  // NFR-06
  it('ends the usage of ink-3 with its role and its ratio on surface', () => {
    const usage = system.color.tokens.find(({ name }) => name === 'ink-3')
      ?.usage as string;
    const ratio =
      /Role: text\. Contrast (\d+\.\d):1 on surface \(needs 4\.5:1\)\.$/.exec(
        usage
      )?.[1];

    expect(Number(ratio)).toBeGreaterThanOrEqual(4.5);
  });

  it('has the layout, breakpoint and z families, each token with a name, a value and a usage', () => {
    expect([
      system.layout.tokens.length,
      system.breakpoint.tokens.length,
      system.z.tokens.length,
    ]).toEqual([41, 2, 4]);

    for (const { name, usage, value } of [
      ...system.layout.tokens,
      ...system.breakpoint.tokens,
      ...system.z.tokens,
    ]) {
      expect([name, usage, value].every(text => text !== '')).toBe(true);
    }

    expect(system.layout.tokens.map(({ name }) => name)).not.toContain(
      'layout-dialog-top'
    );
  });

  it('writes layout-menu-offset as a resolved value, not an alias', () => {
    expect(
      system.layout.tokens.find(({ name }) => name === 'layout-menu-offset')
        ?.value
    ).toBe('0.5rem');
  });

  it('writes a token that refers to a scale step as the value of the step, not an alias', () => {
    expect(raw.space).toMatchObject({
      '16': { $value: '{scale.space.400}' },
    });
    expect(
      system.spacing.tokens.find(({ name }) => name === 'space-inset-m')?.value
    ).toBe('1rem');
    expect(
      system.radius.tokens.find(({ name }) => name === 'radius-panel')?.value
    ).toBe('12px');
    expect(
      system.type.groups
        .flatMap(({ styles }) => styles)
        .find(({ name }) => name === 'body')
    ).toMatchObject({ fontSize: '0.9375rem', lineHeight: '1.375rem' });
    expect(JSON.stringify(system)).not.toContain('{scale.');
  });

  it('puts the map colours beside the colours, with aliases as converted names', () => {
    const colours = new Map(
      system.color.tokens.map(({ name, value }) => [name, value])
    );

    expect(colours.get('map-sea')).toBe('#c9d5d2');
    expect(colours.get('map-polity-natal')).toBe('#dccfbc');
    expect(colours.get('focus-ring')).toBe('{brand}');
    expect(colours.get('map-changed-colour')).toBe('{brand}');
    expect(colours.get('map-river-label-colour')).toBe(
      '{map-water-label-colour}'
    );
    expect(system.color.themes).toEqual([{ id: 'light', name: 'Light' }]);
  });

  it('has one type group per font key, with the styles in file order', () => {
    const names = system.type.groups.map(group => [
      group.name,
      group.family,
      group.styles.length,
    ]);

    expect(names).toEqual([
      ['Display', 'display', 5],
      ['Body', 'body', 16],
      ['Mono', 'mono', 3],
    ]);
    expect(system.type.groups[0].styles[1]).toEqual({
      fontSize: '2rem',
      fontStyle: 'normal',
      fontWeight: '500',
      letterSpacing: '-0.015em',
      lineHeight: '2.5rem',
      name: 'h1',
      usage: 'Page title.',
    });
    expect(system.type.families.display).toBe(
      "'Bricolage Grotesque', sans-serif"
    );
  });

  it('passes the format rules', () => {
    expect(formatProblems(system)).toEqual([]);
  });
});

describe('fontFiles and systemFonts', () => {
  it('lists the eight files app/layout.tsx loads, with their family', () => {
    expect(
      fonts.map(({ family, file, style, weight }) => [
        family,
        file,
        style,
        weight,
      ])
    ).toEqual([
      [
        'Bricolage Grotesque',
        'fonts/bricolage-grotesque-latin-wght-normal.woff2',
        'normal',
        '200 800',
      ],
      [
        'Bricolage Grotesque',
        'fonts/bricolage-grotesque-latin-ext-wght-normal.woff2',
        'normal',
        '200 800',
      ],
      [
        'Public Sans',
        'fonts/public-sans-latin-wght-normal.woff2',
        'normal',
        '100 900',
      ],
      [
        'Public Sans',
        'fonts/public-sans-latin-wght-italic.woff2',
        'italic',
        '100 900',
      ],
      [
        'Public Sans',
        'fonts/public-sans-latin-ext-wght-normal.woff2',
        'normal',
        '100 900',
      ],
      [
        'Public Sans',
        'fonts/public-sans-latin-ext-wght-italic.woff2',
        'italic',
        '100 900',
      ],
      [
        'JetBrains Mono',
        'fonts/jetbrains-mono-latin-400-normal.woff2',
        'normal',
        '400',
      ],
      [
        'JetBrains Mono',
        'fonts/jetbrains-mono-latin-500-normal.woff2',
        'normal',
        '500',
      ],
    ]);
  });

  it('rejects a file that no font in design/kinscape.tokens.json starts', () => {
    expect(() =>
      systemFonts(
        [{ path: '../x/inter-latin.woff2', style: 'normal', weight: '400' }],
        raw
      )
    ).toThrow('No font in design/kinscape.tokens.json for inter-latin.woff2');
  });
});

describe('unicodeRange and fontFaces', () => {
  const css = `@font-face {
  src: url(./files/a-latin-ext.woff2) format('woff2'), url(./files/a-latin-ext.woff) format('woff');
  unicode-range: U+0100-02BA,U+2020;
}
@font-face {
  src: url(./files/a-latin.woff2) format('woff2-variations');
  unicode-range: U+0000-00FF;
}`;

  it('reads the range of the face that loads the file', () => {
    expect(unicodeRange(css, 'a-latin.woff2')).toBe('U+0000-00FF');
    expect(unicodeRange(css, 'a-latin-ext.woff2')).toBe('U+0100-02BA,U+2020');
    expect(unicodeRange(css, 'b.woff2')).toBeUndefined();
  });

  it('rejects a font with no range', () => {
    expect(() => fontFaces(fonts, {})).toThrow(
      'No unicode-range for fonts/bricolage-grotesque-latin-wght-normal.woff2'
    );
  });

  it('writes one @font-face per font', () => {
    expect(
      fontFaces(
        [
          {
            family: 'A',
            file: 'fonts/a.woff2',
            style: 'italic',
            weight: '100 900',
          },
        ],
        { 'fonts/a.woff2': 'U+0000' }
      )
    ).toBe(`@font-face {
  font-family: 'A';
  font-style: italic;
  font-weight: 100 900;
  font-display: swap;
  src: url(fonts/a.woff2) format('woff2');
  unicode-range: U+0000;
}`);
  });
});

describe('deprecatedTokens', () => {
  it('lists each space-N with its value and its replacements', () => {
    const list = deprecatedTokens(raw);

    expect(list.map(({ name }) => name)).toEqual(
      [4, 8, 12, 16, 20, 24, 32, 40, 48, 64].map(step => `space-${step}`)
    );
    expect(list[3]).toEqual({
      name: 'space-16',
      usage: 'Use space.inset.m or space.gap.m.',
      value: '1rem',
    });
  });

  it('names a replacement that exists and has the same value', () => {
    for (const { name, usage, value } of deprecatedTokens(raw)) {
      const replacements = [...usage.matchAll(/space\.[a-z]+\.[0-9a-z]+/g)].map(
        ([path]) => path
      );

      expect(replacements.length, name).toBeGreaterThan(0);

      for (const path of replacements) {
        expect(resolvedText(raw, path), `${name}: ${path}`).toBe(value);
      }
    }
  });
});

describe('systemCss', () => {
  const css = systemCss(system, ranges, deprecatedTokens(raw));

  it('starts with the header, then the colours and shadows in the light theme', () => {
    const [header, light] = css.split('\n\n');

    expect(header).toBe('/* KinScape — generated from tokens.json */');
    expect(light).toMatch(
      /^:root, \[data-theme="light"\] \{\n {2}--brand: #264f29;/
    );
    expect(light).toContain('  --focus-ring: var(--brand);');
    expect(light).toContain('  --map-sea: #c9d5d2;');
    expect(light).toContain('  --shadow-raised: 0 1px 2px');
  });

  it('holds spacing, radius, sizes, focus and font stacks in :root', () => {
    expect(css).toContain(':root {\n  --space-inset-2xs: 0.25rem;');
    expect(css).toContain('  --radius-panel: 12px;');
    expect(css).toContain('  --size-touch: 44px;');
    expect(css).toContain('  --border-hairline: 1px;');
    expect(css).toContain('  --focus-width: 2px;');
    expect(css).toContain(
      "  --font-body: 'Public Sans', system-ui, sans-serif;"
    );
  });

  it('holds the layout, breakpoint and z tokens in :root', () => {
    expect(css).toContain('  --layout-menu-offset: 0.5rem;');
    expect(css).toContain('  --breakpoint-phone-width: 639.98px;');
    expect(css).toContain('  --z-menu: 30;');
    expect(css).not.toContain('--layout-dialog-top');
  });

  it('holds the deprecated space-N names, with their values, in their own :root block', () => {
    const block = css.split('\n\n').find(part => part.includes('Deprecated'));

    expect(block).toMatch(/^:root \{\n {2}\/\* Deprecated: /);
    expect(block).toContain('  --space-4: 0.25rem;');
    expect(block).toContain('  --space-64: 4rem;');
    expect(css.match(/--space-16: 1rem;/g)).toHaveLength(1);
  });

  it('writes no deprecated block when no token has $deprecated', () => {
    const plain = systemCss(system, ranges);

    expect(plain).not.toContain('Deprecated');
    expect(plain).not.toContain('--space-4: ');
    expect(plain).toContain('  --space-inset-2xs: 0.25rem;');
  });

  it('declares each motion name that the components bundle uses', () => {
    const used = new Set(
      trackedFiles()
        .filter(file =>
          /^(app\/components|features)\/.*\.module\.css$/.test(file)
        )
        .flatMap(file => [
          ...readFileSync(file, 'utf8').matchAll(/var\((--motion-[\w-]+)\)/g),
        ])
        .map(([, name]) => name)
    );

    expect(used).toContain('--motion-easing');

    for (const name of used) {
      expect(css, name).toContain(`  ${name}: `);
    }
  });

  it('has a class per style and a @font-face per font', () => {
    expect(css).toContain(
      '.h1 {\n  font-family: var(--font-display);\n  font-size: 2rem;\n  line-height: 2.5rem;\n  font-weight: 500;\n  letter-spacing: -0.015em;\n  font-style: normal;\n}'
    );
    expect(css.match(/@font-face/g)).toHaveLength(8);
  });

  it('defines every variable it uses', () => {
    const defined = new Set(
      [...css.matchAll(/^\s+(--[\w-]+):/gm)].map(([, name]) => name)
    );

    expect(
      [...css.matchAll(/var\((--[\w-]+)\)/g)]
        .map(([, name]) => name)
        .filter(name => !defined.has(name))
    ).toEqual([]);
  });
});

// NFR-01, NFR-06
describe('Motion in foundations.md', () => {
  const section = /^## Motion$([\s\S]*)/m.exec(foundations)?.[1] ?? '';

  it('names each motion token once, as code, and no duration', () => {
    const missing = Object.keys(raw.motion as DtcgTree).filter(
      key => section.split(`\`${key}\``).length !== 2
    );

    expect(missing).toEqual([]);
    expect(section).not.toMatch(/\d\s?ms\b/);
  });

  it('holds the map date change rule and the reduced-motion rule', () => {
    expect(section).toContain('NFR-01');
    expect(section).toContain('prefers-reduced-motion');
  });
});

describe('readme', () => {
  const text = readme(design);

  it('holds the listed sections, in order, as the design files have them', () => {
    expect(text.match(/^## Motion$/gm)).toHaveLength(1);
    expect(text.indexOf('## Shape and depth')).toBeLessThan(
      text.indexOf('## Motion')
    );
    expect(text.indexOf('## Motion')).toBeLessThan(
      text.indexOf('## Components')
    );
    expect([...text.matchAll(/^## (.+)$/gm)].map(([, name]) => name)).toEqual([
      ...README_SECTIONS,
      'Using the controls on a canvas',
    ]);
    expect(text).toContain('Colour never carries meaning alone');
    expect(text).toContain('### Map date field');
    expect(text.match(/^## Layout$/gm)).toHaveLength(1);
    expect(text.match(/^## Map style$/gm)).toHaveLength(1);
    expect(text.indexOf('## Event glyphs')).toBeLessThan(
      text.indexOf('## Map style')
    );
    expect(text.indexOf('## Map style')).toBeLessThan(text.indexOf('## Copy'));
  });

  it('ends with how a canvas loads and mounts the controls, from the bundle constants', () => {
    const section = text.slice(text.indexOf('## Using the controls'));

    expect(section).toContain(`\`window.${NAMESPACE}\``);
    expect(section.indexOf(`components/${BUNDLE_CSS}`)).toBeGreaterThan(0);
    expect(section.indexOf(`components/${BUNDLE_JS}`)).toBeGreaterThan(
      section.indexOf(`components/${BUNDLE_CSS}`)
    );
    expect(section).toContain(
      `<x-import component-from-global-scope="${NAMESPACE}.Button">`
    );
  });

  it('has no link into the repo: those become their text', () => {
    expect(text).toContain('Map labels need Public Sans Regular');
    expect(text).not.toMatch(/\]\((?!https:\/\/)[^)]*\)/);
    expect(text).toContain(
      'Every control has the five states on its component card.'
    );
    expect(text).toContain('(see Map style)');
    expect(text).toContain('map-style.jpg shows the full layer stack');
  });

  it('keeps an https link and rejects a missing section', () => {
    expect(
      readme(
        README_SECTIONS.map(
          name => `## ${name}\n\n[a](https://x.test) [b](../b.md) ![c](c.jpg)`
        )
      )
    ).toContain('[a](https://x.test) b c');
    expect(() => readme(['## Brand\n\ntext'])).toThrow(
      'The design files have no "Fonts" section'
    );
  });
});

describe('designSections', () => {
  it('splits each file at its ## headings and drops the frontmatter and title', () => {
    expect(
      designSections([
        "---\npaths:\n  - 'a/**'\n---\n\n# Title\n\n## One\n\nx\n\n### Sub\n\ny\n\n## Two\n\nz\n",
        '# Other\n\nIntro.\n\n## Three\n\nw\n',
      ])
    ).toEqual([
      '## One\n\nx\n\n### Sub\n\ny\n\n',
      '## Two\n\nz\n',
      '## Three\n\nw\n',
    ]);
  });

  it('finds the README sections in the design files', () => {
    const names = design.map(section => /^## (.+)$/m.exec(section)?.[1]);

    expect(DESIGN_FILES).toHaveLength(6);
    expect(names).toEqual(expect.arrayContaining(README_SECTIONS));
  });
});

describe('systemIndex', () => {
  const index = systemIndex('abc1234', '2026-10-31T10:00:00.000Z');

  it('is synced from code, with the two asset groups', () => {
    expect(index).toMatchObject({
      editing: 'code',
      groups: ['Logos', 'Icons'],
      layout: 'files',
      libraries: [
        { name: 'react', version: '18' },
        { name: 'react-dom', version: '18' },
      ],
      namespace: 'KinScape',
      title: 'KinScape design system',
      v: 3,
    });
    expect(index.assetGroups).toEqual({
      Icons: { files: {}, name: 'Icons', order: [], tile: 'xs' },
      Logos: { files: {}, name: 'Logos', order: [], tile: 'l' },
    });
  });

  it('names the commit in the last change, and not as CI', () => {
    expect(index.lastChange).toEqual({
      at: '2026-10-31T10:00:00.000Z',
      by: 'KinScape repo',
      note: 'npm run design-system at abc1234',
      via: 'code · henetiriki/kinscape@abc1234',
    });
    expect(index.createdOnFiles).toEqual({
      at: '2026-10-31T10:00:00.000Z',
      v: 1,
    });
  });
});

describe('the cover', () => {
  const cover = readFileSync('lib/design/cover.html', 'utf8');
  const css = systemCss(system, ranges, deprecatedTokens(raw));
  const rects = [
    ...cover.matchAll(
      /<rect class="block (\w+)" x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g
    ),
  ].map(([, colour, x, y, width, height]) => ({
    colour,
    height: Number(height),
    width: Number(width),
    x: Number(x),
    y: Number(y),
  }));
  const size = (selector: string, property: string) =>
    Number(
      new RegExp(String.raw`\.${selector} \{[^}]*?${property}: (\d+)px`).exec(
        cover
      )?.[1]
    );

  it('is one fixed 960 px card with no motion or media queries', () => {
    expect(cover.split('\n')[0]).toBe('<!-- @dsCard height=288 -->');
    expect(cover).toContain('width: 960px;');
    expect(cover).not.toMatch(/@media|animation|transition|@keyframes/);
  });

  it('is one SVG and two text elements, with every colour and radius a class', () => {
    expect(cover.match(/<svg/g)).toHaveLength(1);
    expect(cover.match(/<(?:h1|p)[ >]/g)).toHaveLength(2);
    expect(cover).not.toMatch(
      /\s(?:fill|stroke|rx)="|<img|gradient|filter|shadow/
    );
    expect(cover).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
  });

  it('binds every variable to a token the output defines', () => {
    const defined = new Set(
      [...css.matchAll(/^\s+--([\w-]+):/gm)].map(([, name]) => name)
    );

    expect(
      [...cover.matchAll(/var\(--([\w-]+)\)/g)]
        .map(([, name]) => name)
        .filter(name => !defined.has(name))
    ).toEqual([]);
  });

  it('has four blocks right of x = 480, a quarter to half of the cover, never equal squares', () => {
    const area = rects.reduce(
      (sum, { height, width }) => sum + height * width,
      0
    );

    expect(rects.map(({ colour }) => colour)).toEqual([
      'brand',
      'land',
      'sea',
      'pin',
    ]);
    expect(Math.min(...rects.map(({ x }) => x))).toBeGreaterThanOrEqual(480);
    expect(
      Math.max(...rects.map(({ width, x }) => x + width))
    ).toBeLessThanOrEqual(960);
    expect(
      Math.max(...rects.map(({ height, y }) => y + height))
    ).toBeLessThanOrEqual(288);
    expect(area / (960 * 288)).toBeGreaterThanOrEqual(0.25);
    expect(area / (960 * 288)).toBeLessThanOrEqual(0.5);
    expect(new Set(rects.map(({ height }) => height)).size).toBe(4);
  });

  it('sets the name 64 to 120 px and the tagline 13 or 14 px, at most 440 px wide', () => {
    expect(size('name', 'font-size')).toBeGreaterThanOrEqual(64);
    expect(size('name', 'font-size')).toBeLessThanOrEqual(120);
    expect([13, 14]).toContain(size('tagline', 'font-size'));
    expect(size('tagline', 'max-width')).toBeLessThanOrEqual(440);
    expect(cover).toContain("Borders move. Places don't.");
  });

  it('opens the SVG with a four-line comment', () => {
    const comment = /<svg[^>]*>\s*<!--([\s\S]*?)-->/.exec(cover)?.[1];

    expect(comment?.trim().split('\n')).toHaveLength(4);
  });
});
