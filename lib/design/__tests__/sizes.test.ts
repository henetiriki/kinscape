import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { SizeEntry } from '@ks/lib/design/types.ts';

import {
  colour,
  layer,
  num,
  press,
  px,
  shadowOf,
  weight,
} from '@ks/lib/design/__tests__/dtcg-fixtures';
import { localProblems } from '@ks/lib/design/local.mts';
import {
  isSizeFile,
  listOf,
  listProblems,
  sizesIn,
} from '@ks/lib/design/sizes.mts';
import { trackedFiles } from '@ks/scripts/__tests__/tracked';

const root = join(import.meta.dirname, '../../..');
const real = JSON.parse(
  readFileSync(join(root, 'design/kinscape.tokens.json'), 'utf8')
);

const tokens = {
  border: { hairline: px(1) },
  breakpoint: { 'phone-width': px(639.98) },
  colour: { brand: colour('#264f29') },
  focus: { offset: px(2), width: px(2) },
  map: { 'hero-shade': { opacity: num(0.28) } },
  motion: { press: press(120), 'press-offset': px(1) },
  radius: { link: px(2) },
  shadow: {
    modal: shadowOf(layer(10, 40, { ...colour('#18211b').$value, alpha: 0.3 })),
  },
  size: { chip: px(36) },
  space: { '8': px(8) },
  type: {
    caption: {
      line: px(18),
      size: px(12.5),
      tracking: num(0.1),
      weight: weight(600),
    },
  },
  z: { furniture: num(1) },
};

const lines = (...rows: string[]) => `.a {\n${rows.join('\n')}\n}\n`;
const css = (...rows: string[]) => lines(...rows);
const tsx = (style: string) =>
  `export const A = () => (\n  <div style={${style}} />\n);\n`;

/** The sizes that fail the check: off the tokens, and not a local value. */
const off = (file: string, text: string) =>
  sizesIn(file, text, tokens).filter(size => !size.token && !size.local);

describe('an off-token size in a .module.css file', () => {
  it('names the file, line, property and value', () => {
    expect(off('a.module.css', css('  gap: 7px;'))).toEqual([
      {
        file: 'a.module.css',
        line: 2,
        local: false,
        property: 'gap',
        token: false,
        value: '7px',
      },
    ]);
  });

  it('reads app/globals.css the same way', () => {
    expect(off('app/globals.css', css('  gap: 7px;'))).toMatchObject([
      { file: 'app/globals.css', line: 2, property: 'gap', value: '7px' },
    ]);
  });

  it('gives each part of a multi-line value its own line', () => {
    expect(
      off('a.module.css', css('  padding:', '    7px', '    9px;')).map(
        size => size.line
      )
    ).toEqual([3, 4]);
  });

  it.each([
    ['opacity', 'opacity: 0.5;', 'opacity', '0.5'],
    ['a border width', 'border-width: 3px;', 'border-width', '3px'],
    ['a border shorthand', 'border: 3px solid red;', 'border', '3px'],
    ['a side border', 'border-top: 3px solid red;', 'border-top', '3px'],
    [
      'a transform offset',
      'transform: translate(7px, 0) rotate(45deg) scale(1.5);',
      'transform',
      '7px',
    ],
    ['a translate offset', 'transform: translateY(-7px);', 'transform', '-7px'],
    ['a font size', 'font-size: 17px;', 'font-size', '17px'],
    ['a line height', 'line-height: 1.4;', 'line-height', '1.4'],
    ['a letter spacing', 'letter-spacing: 0.3em;', 'letter-spacing', '0.3em'],
    ['a font weight', 'font-weight: 650;', 'font-weight', '650'],
    ['a min width', 'min-width: 77px;', 'min-width', '77px'],
    ['a radius', 'border-radius: 5px;', 'border-radius', '5px'],
    ['a z-index', 'z-index: 2;', 'z-index', '2'],
    ['an outline width', 'outline-width: 3px;', 'outline-width', '3px'],
    ['an outline offset', 'outline-offset: 5px;', 'outline-offset', '5px'],
    ['a duration', 'transition: opacity 0.3s;', 'transition', '0.3s'],
    ['an animation', 'animation: spin 700ms linear;', 'animation', '700ms'],
    ['a shadow length', 'box-shadow: 0 1px 3px #123456;', 'box-shadow', '1px'],
    ['a text shadow', 'text-shadow: 0 1px #123456;', 'text-shadow', '1px'],
    ['a custom property', '--thumb: 26px;', '--thumb', '26px'],
    ['a calc with no var', 'width: calc(100% - 37px);', 'width', '37px'],
  ])('fails for %s', (_name, row, property, value) => {
    expect(off('a.module.css', css(`  ${row}`))[0]).toMatchObject({
      property,
      value,
    });
  });

  it('reads a media length with the property @media', () => {
    expect(
      off('a.module.css', '@media (max-width: 700px) {\n  .a { gap: 8px; }\n}')
    ).toMatchObject([{ line: 1, property: '@media', value: '700px' }]);
  });

  it('reads the lengths of a media range on a later line', () => {
    expect(
      off(
        'a.module.css',
        '@media (min-width: 600px)\n  and (max-width: 800px) {\n}'
      ).map(size => [size.line, size.value])
    ).toEqual([
      [1, '600px'],
      [2, '800px'],
    ]);
  });

  it('reads only the lengths of translate in a transform', () => {
    expect(
      off('a.module.css', css('  transform: rotate(45deg) scale(1.5);'))
    ).toEqual([]);
  });

  it('skips a comment', () => {
    expect(off('a.module.css', css('  /* gap: 7px; */'))).toEqual([]);
  });
});

describe('a size that passes', () => {
  it.each([
    ['zero', 'margin: 0;'],
    ['zero with a unit', 'margin: 0px;'],
    ['a percent', 'width: 33%;'],
    ['an fr', '--col: 1fr;'],
    ['a keyword', 'width: auto;'],
    ['100vw', 'width: 100vw;'],
    ['100vh', 'height: 100vh;'],
    ['100dvh', 'height: 100dvh;'],
    ['a unit multiplier', 'width: calc(var(--n) * 1px);'],
    ['a unit multiplier with no var', 'width: calc(2 * 1px);'],
    ['a var', 'gap: var(--space-gap-xs);'],
    ['a calc with a var', 'width: calc(100% - var(--a) - 37px);'],
    ['a space token', 'gap: 8px;'],
    ['a size token', 'height: 36px;'],
    ['a radius token', 'border-radius: 2px;'],
    ['a font size token', 'font-size: 12.5px;'],
    ['a line height token', 'line-height: 18px;'],
    ['a weight token', 'font-weight: 600;'],
    ['a z token', 'z-index: 1;'],
    ['a border token', 'border: 1px solid red;'],
    ['a focus width in a border', 'border-bottom-width: 2px;'],
    ['a map opacity', 'opacity: 0.28;'],
    ['a motion offset in a transform', 'transform: translateY(-1px);'],
    ['a motion offset in translate', 'translate: -1px 0;'],
    ['a duration token', 'transition: opacity 120ms ease-out;'],
    ['a focus token', 'outline-offset: 2px;'],
    ['a shadow token', 'box-shadow: 0 10px 40px rgb(24  33 27 / 0.3);'],
    ['an easing function', 'transition: opacity 0 cubic-bezier(0.2, 0, 0, 1);'],
    ['an angle', 'transform: rotate(45deg);'],
    ['a colour function', 'border: 0 solid rgb(24 33 27 / 0.2);'],
    ['a property of no size', 'aspect-ratio: 1.5;'],
    ['a digit in an identifier', 'grid-area: x-8;'],
    ['a custom property of a var', '--a: var(--b);'],
    ['a custom property of a keyword', '--a: auto;'],
    ['a custom property with no unit', '--n: 7;'],
  ])('passes %s', (_name, row) => {
    expect(off('a.module.css', css(`  ${row}`))).toEqual([]);
  });

  // NFR-05, NFR-06
  it('passes a 16px padding size that equals a 1rem space token', () => {
    const inRem = {
      space: {
        '400': { $type: 'dimension', $value: { unit: 'rem', value: 1 } },
      },
    };
    const sizes = sizesIn('a.module.css', css('  padding: 16px;'), inRem);

    expect(sizes).toMatchObject([{ token: true, value: '16px' }]);
    expect(
      sizesIn('a.module.css', css('  padding: 15px;'), inRem)
    ).toMatchObject([{ token: false }]);
  });

  it('passes a media length that equals a breakpoint token', () => {
    expect(off('a.module.css', '@media (max-width: 639.98px) {\n}')).toEqual(
      []
    );
  });

  it('passes a listed value, once it is in the list', () => {
    const sizes = sizesIn('a.module.css', css('  gap: 7px;'), tokens);

    expect(listProblems(sizes, listOf(sizes))).toEqual([]);
  });
});

describe('a local value', () => {
  it.each(['shape', 'nudge', 'drawing'])(
    'passes a size with the reason %s',
    reason => {
      expect(
        off('a.module.css', css(`  --a: 7px; /* local: ${reason} */`))
      ).toEqual([]);
    }
  );

  it('keeps a size that has no reason', () => {
    expect(off('a.module.css', css('  --a: 7px; /* local: */'))).toHaveLength(
      1
    );
  });

  it('keeps a size with the reason misc', () => {
    expect(
      off('a.module.css', css('  --a: 7px; /* local: misc */'))
    ).toHaveLength(1);
  });

  it('keeps a size on a line that is not a custom property', () => {
    expect(
      off('a.module.css', css('  gap: 7px; /* local: shape */'))
    ).toHaveLength(1);
  });

  it('keeps a size with an own comment', () => {
    expect(off('a.module.css', css('  gap: 7px; /* own: odd */'))).toHaveLength(
      1
    );
  });

  it('marks the size and keeps it out of the list', () => {
    const sizes = sizesIn(
      'a.module.css',
      css('  --a: 7px; /* local: shape */'),
      tokens
    );

    expect(sizes).toMatchObject([{ local: true, token: false }]);
    expect(listOf(sizes)).toEqual([]);
  });

  it('keeps a size in a style prop, whatever the comment', () => {
    expect(off('A.tsx', tsx('{\n    gap: 7, // own: odd\n  }'))).toHaveLength(
      1
    );
  });
});

describe('an inline style prop', () => {
  it('names an off-token number as px', () => {
    expect(off('A.tsx', tsx('{ gap: 7 }'))).toEqual([
      {
        file: 'A.tsx',
        line: 2,
        local: false,
        property: 'gap',
        token: false,
        value: '7px',
      },
    ]);
  });

  it('reads a camel-case property as CSS', () => {
    expect(off('A.tsx', tsx("{ borderRadius: '5px' }"))).toMatchObject([
      { property: 'border-radius', value: '5px' },
    ]);
  });

  it('reads a number with no unit on opacity, zIndex, fontWeight and lineHeight', () => {
    expect(
      off(
        'A.tsx',
        tsx('{ opacity: 0.5, zIndex: 2, fontWeight: 650, lineHeight: 1.4 }')
      ).map(size => [size.property, size.value])
    ).toEqual([
      ['opacity', '0.5'],
      ['z-index', '2'],
      ['font-weight', '650'],
      ['line-height', '1.4'],
    ]);
  });

  it('reads a negative number', () => {
    expect(off('A.tsx', tsx('{ marginLeft: -7 }'))).toMatchObject([
      { value: '-7px' },
    ]);
  });

  it('reads a quoted custom property', () => {
    expect(off('A.tsx', tsx("{ '--reach': '7px' }"))).toMatchObject([
      { property: '--reach', value: '7px' },
    ]);
  });

  it('reads a string with no expression in a template', () => {
    expect(off('A.tsx', tsx('{ gap: `7px` }'))).toMatchObject([
      { value: '7px' },
    ]);
  });

  it('flags a number that equals a token as a token', () => {
    expect(sizesIn('A.tsx', tsx('{ gap: 8 }'), tokens)).toMatchObject([
      { token: true },
    ]);
  });

  it.each([
    ['zero', '{ gap: 0 }'],
    ['a percent', "{ width: '50%' }"],
    ['a keyword', "{ position: 'relative' }"],
    ['a var', "{ color: 'var(--white)' }"],
    ['an identifier', '{ left: x }'],
    ['a call', '{ left: at(1) }'],
    ['a binary expression', '{ borderRadius: size / 4 }'],
    ['a template with an expression', '{ width: `${shown}%` }'],
    ['a template px with an expression', '{ width: `${shown}px` }'],
    ['a shorthand property', '{ width }'],
    ['a spread', '{ ...base }'],
    ['an identifier prop', 'hatchStyle'],
    ['a call prop', 'mark(1)'],
    ['a computed key', '{ [key]: 7 }'],
  ])('skips %s', (_name, style) => {
    expect(off('A.tsx', tsx(style))).toEqual([]);
  });

  it('skips an SVG attribute with a number', () => {
    expect(
      off(
        'A.tsx',
        'export const A = () => <svg width={24} height={24}><circle r={4} strokeWidth={1.5} cx={7} /></svg>;\n'
      )
    ).toEqual([]);
  });

  it('skips a style attribute that holds a string', () => {
    expect(
      off('A.tsx', 'export const A = <div style="gap: 7px" />;\n')
    ).toEqual([]);
  });

  it('skips an attribute of another name', () => {
    expect(
      off('A.tsx', 'export const A = <div data={{ gap: 7 }} />;\n')
    ).toEqual([]);
  });

  it('skips a file with no style attribute', () => {
    expect(off('A.tsx', 'export const gap = { gap: 7 };\n')).toEqual([]);
  });
});

describe('isSizeFile', () => {
  it.each([
    ['features/a/A.module.css', true],
    ['app/globals.css', true],
    ['features/a/A.tsx', true],
    ['features/a/__tests__/A.test.tsx', false],
    ['e2e/a.spec.tsx', false],
    ['app/tokens.css', false],
    ['features/a/a.ts', false],
  ])('%s is %s', (path, expected) => {
    expect(isSizeFile(path)).toBe(expected);
  });
});

describe('the list', () => {
  const sizes = sizesIn(
    'a.module.css',
    css('  gap: 7px;', '  margin: 7px;', '  padding: 9px 9px;'),
    tokens
  );
  const entry = (
    property: string,
    value: string,
    count: number
  ): SizeEntry => ({ count, file: 'a.module.css', property, value });

  it('holds one entry for each file, property and value, with a count, sorted', () => {
    expect(listOf(sizes)).toEqual([
      entry('gap', '7px', 1),
      entry('margin', '7px', 1),
      entry('padding', '9px', 2),
    ]);
  });

  it('passes when the list matches the code', () => {
    expect(listProblems(sizes, listOf(sizes))).toEqual([]);
  });

  it('names the file, line, property and value of a size with no entry', () => {
    expect(listProblems(sizes, listOf(sizes).slice(1))).toEqual([
      expect.stringContaining('a.module.css:2: gap: 7px'),
    ]);
  });

  it('fails on a new copy of a listed size, and names the extra copy', () => {
    const more = sizesIn(
      'a.module.css',
      css('  gap: 7px;', '  margin: 7px;', '  padding: 9px 9px 9px;'),
      tokens
    );

    expect(listProblems(more, listOf(sizes))).toEqual([
      expect.stringContaining('a.module.css:4: padding: 9px'),
    ]);
  });

  it('fails on a fixed copy of two, and names the entry', () => {
    const fewer = sizesIn(
      'a.module.css',
      css('  gap: 7px;', '  margin: 7px;', '  padding: 9px;'),
      tokens
    );

    expect(listProblems(fewer, listOf(sizes))).toEqual([
      expect.stringContaining('a.module.css padding 9px'),
    ]);
  });

  it('fails on an entry with no size in the code, and names the entry', () => {
    expect(
      listProblems(sizes, [...listOf(sizes), entry('gap', '99px', 1)])
    ).toEqual([expect.stringMatching(/a\.module\.css gap 99px.*no size/)]);
  });
});

describe('the repo', () => {
  const list: SizeEntry[] = JSON.parse(
    readFileSync(join(root, 'lib/design/off-token-sizes.json'), 'utf8')
  );
  const files = trackedFiles().filter(isSizeFile);
  const sizes = files.flatMap(file =>
    sizesIn(file, readFileSync(join(root, file), 'utf8'), real)
  );

  it('finds the files', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('has each off-token size on the list, and each entry in the code', () => {
    expect(listProblems(sizes, list)).toEqual([]);
  });

  it('keeps the list sorted', () => {
    expect(list).toEqual(listOf(sizes));
  });

  it('has no local-value problem in a CSS size file', () => {
    expect(
      files
        .filter(file => file.endsWith('.css'))
        .flatMap(file =>
          localProblems(readFileSync(join(root, file), 'utf8')).map(
            problem => `${file}:${problem.line}: ${problem.text}`
          )
        )
    ).toEqual([]);
  });

  it('has no own: comment in a .tsx size file', () => {
    expect(
      files
        .filter(file => file.endsWith('.tsx'))
        .filter(file =>
          /(\/\/|\/\*)\s*own:/.test(readFileSync(join(root, file), 'utf8'))
        )
    ).toEqual([]);
  });

  it('keeps no moved or nudge size on the list', () => {
    expect(
      list.filter(
        entry =>
          /(Alert|NoticeCard)\.module\.css$/.test(entry.file) &&
          entry.property === 'margin-top' &&
          entry.value === '1px'
      )
    ).toEqual([]);
  });
});
