import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  colour,
  layer,
  ms,
  num,
  press,
  px,
  shadowOf,
  weight,
} from '@ks/lib/design/__tests__/dtcg-fixtures';
import { tokenLiterals } from '@ks/lib/design/literals.mts';

const root = join(import.meta.dirname, '../../..');
const real = JSON.parse(
  readFileSync(join(root, 'design/kinscape.tokens.json'), 'utf8')
);

const ink = colour('#18211b').$value;
const brand = colour('#264f29').$value;

const tokens = {
  colour: { brand: colour('#264f29'), ink: colour('#18211b') },
  focus: { offset: px(2), width: px(2) },
  layout: { 'popup-width': px(304) },
  map: { sea: colour('#c9d5d2') },
  motion: { press: press(120), toast: ms(4000) },
  radius: { full: px(999), link: px(2) },
  shadow: {
    modal: shadowOf(layer(10, 40, { ...ink, alpha: 0.3 })),
    thumb: shadowOf(layer(0, 0, brand, 1), layer(2, 6, { ...ink, alpha: 0.3 })),
  },
  size: { chip: px(36) },
  space: { '12': px(12), '8': px(8) },
  type: {
    caption: {
      font: { $type: 'fontFamily', $value: '{font.body}' },
      line: px(18),
      size: px(12.5),
      tracking: num(0.1),
      weight: weight(600),
    },
  },
  z: { furniture: num(1) },
};

const lines = (...rows: string[]) => `.a {\n${rows.join('\n')}\n}\n`;
const problems = (css: string) => tokenLiterals(css, tokens);

describe('a literal that equals a token of its group', () => {
  it.each([
    ['gap', 'gap: 8px;'],
    ['padding', 'padding: 3px 12px;'],
    ['margin', 'margin-top: 8px;'],
    ['inset', 'inset: 8px;'],
    ['top', 'top: 8px;'],
    ['width', 'width: 36px;'],
    ['min-height', 'min-height: 36px;'],
    ['flex-basis', 'flex-basis: 36px;'],
    ['border-radius', 'border-radius: 2px;'],
    ['a corner radius', 'border-top-left-radius: 999px;'],
    ['z-index', 'z-index: 1;'],
    ['font-size', 'font-size: 12.5px;'],
    ['line-height', 'line-height: 18px;'],
    ['letter-spacing', 'letter-spacing: 0.1em;'],
    ['font-weight', 'font-weight: 600;'],
    ['a transition duration', 'transition: opacity 120ms ease-out;'],
    ['an animation duration', 'animation: spin 4000ms linear;'],
    ['a duration in seconds', 'transition: opacity 0.12s ease-out;'],
    ['a hex colour', 'color: #18211b;'],
    ['a short hex colour in a background', 'background: #264F29;'],
    ['a colour function', 'border: 1px solid rgb(24 33 27 / 0.2);'],
    ['a map colour', 'fill: #c9d5d2;'],
    ['a shadow', 'box-shadow: 0 10px 40px rgb(24  33 27 / 0.3);'],
    [
      'a shadow with an uppercase hex',
      'box-shadow: 0 0 0 1px #264F29, 0 2px 6px rgb(24 33 27 / 0.3);',
    ],
    ['a calc without var', 'width: calc(100% - 36px);'],
    ['a negative value', 'margin: -8px 0;'],
  ])('fails for %s', (_name, row) => {
    expect(problems(lines(row))).toEqual([
      { line: 2, text: expect.stringContaining(row.split(':')[0]) },
    ]);
  });

  it('names the literal and a fix in the text', () => {
    expect(problems(lines('  gap: 8px;'))[0].text).toBe(
      'gap: 8px equals a token of its group: use var(--token) or add /* own: <reason> */'
    );
  });

  it('gives each part of a multi-line value its own line', () => {
    expect(
      problems(lines('  padding:', '    3px', '    8px', '    12px;'))
    ).toMatchObject([{ line: 4 }, { line: 5 }]);
  });

  it('gives a colour on a later line its own line', () => {
    expect(
      problems(lines('  background:', '    linear-gradient(', '      #18211b,'))
    ).toMatchObject([{ line: 4 }]);
  });

  it('gives a shadow the line it starts on', () => {
    expect(
      problems(
        lines('  box-shadow:', '    0 10px 40px', '    rgb(24 33 27 / 0.3);')
      )
    ).toMatchObject([{ line: 2 }]);
  });

  it('counts a literal in a rule after a selector with a colon', () => {
    expect(
      problems('.a:hover {\n  gap: 8px;\n}\n.b[data-x] { margin: 8px; }')
    ).toMatchObject([{ line: 2 }, { line: 4 }]);
  });
});

it('fails a radius literal that equals a token that refers to a scale step', () => {
  const withStep = {
    radius: { link: { $type: 'dimension', $value: '{scale.radius.100}' } },
    scale: { radius: { '100': px(2) } },
  };

  expect(tokenLiterals(lines('  border-radius: 2px;'), withStep)).toMatchObject(
    [{ line: 2 }]
  );
});

// NFR-05, NFR-06
it('fails a 16px padding literal that equals a 1rem space token', () => {
  const inRem = {
    space: { '400': { $type: 'dimension', $value: { unit: 'rem', value: 1 } } },
  };

  expect(tokenLiterals(lines('  padding: 16px;'), inRem)).toMatchObject([
    { line: 2 },
  ]);
  expect(tokenLiterals(lines('  padding: 1rem;'), inRem)).toMatchObject([
    { line: 2 },
  ]);
  expect(tokenLiterals(lines('  padding: 15px;'), inRem)).toEqual([]);
});

it('passes each literal when the token file has no group for it', () => {
  expect(tokenLiterals(lines('  gap: 8px;', '  color: #18211b;'), {})).toEqual(
    []
  );
});

describe('a form that the test skips', () => {
  it.each([
    ['zero', 'margin: 0;'],
    ['zero with a unit', 'margin: 0px;'],
    ['a var', 'gap: var(--space-8);'],
    ['a calc with a var', 'width: calc(100% - var(--space-8) - 36px);'],
    ['a negative calc with a var', 'margin: calc(-1 * var(--space-8));'],
    ['a value of no token', 'gap: 7px;'],
    ['a value of another group', 'width: 8px;'],
    ['a percent', 'width: 36%;'],
    ['a layout value', 'width: 304px;'],
    ['a unitless line height', 'line-height: 1.4;'],
    [
      'an easing function',
      'transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);',
    ],
    ['a unitless animation count', 'animation-iteration-count: 1;'],
    ['a z-index of no token', 'z-index: 2;'],
    ['a colour of no token', 'color: #123456;'],
    ['a colour var', 'color: var(--ink);'],
    ['a colour in a var fallback', 'color: var(--ink, #18211b);'],
    ['a border width', 'border-width: 2px;'],
    ['a property of no group', 'opacity: 1;'],
    ['a custom property', '--gap: 8px;'],
    ['a digit in an identifier', 'grid-area: x-8;'],
    ['a comment', 'gap: var(--a); /* 8px */'],
    ['a shadow of no token', 'box-shadow: 0 1px 2px #123456;'],
    ['the font token', 'font-family: 12.5px;'],
  ])('passes %s', (_name, row) => {
    expect(problems(lines(`  ${row}`))).toEqual([]);
  });

  it('passes a comment on its own lines', () => {
    expect(problems('/*\n  gap: 8px;\n*/\n.a { gap: 7px; }')).toEqual([]);
  });
});

describe('an own comment', () => {
  it('lets a literal pass', () => {
    expect(problems(lines('  gap: 8px; /* own: pointer square */'))).toEqual(
      []
    );
  });

  it('lets each part of the line pass', () => {
    expect(problems(lines('  margin: -8px 8px; /* own: centred */'))).toEqual(
      []
    );
  });

  it('fails with no reason', () => {
    expect(problems(lines('  gap: 8px; /* own: */'))).toEqual([
      { line: 2, text: 'The own: comment has no reason' },
    ]);
  });

  it('fails with a blank reason', () => {
    expect(problems(lines('  gap: 8px; /* own:   */'))).toHaveLength(1);
  });

  it('lets an off-token size pass', () => {
    expect(problems(lines('  gap: 7px; /* own: odd */'))).toEqual([]);
  });

  it('lets a colour literal pass', () => {
    expect(problems(lines('  color: #18211b; /* own: brand copy */'))).toEqual(
      []
    );
  });

  it('lets a custom property size pass', () => {
    expect(problems(lines('  --thumb: 26px; /* own: odd */'))).toEqual([]);
  });

  it('fails on a line with no size', () => {
    expect(problems(lines('  gap: 0; /* own: odd */'))).toEqual([
      { line: 2, text: 'The own: comment is on a line with no size' },
    ]);
  });

  it('fails on a line with a keyword only', () => {
    expect(problems(lines('  width: auto; /* own: odd */'))).toHaveLength(1);
  });

  it('fails on an outline offset that equals the focus token', () => {
    expect(problems(lines('  outline-offset: 2px;'))).toEqual([
      { line: 2, text: expect.stringContaining('outline-offset') },
    ]);
  });

  it('fails on an outline width that is a focus literal beside a colour', () => {
    expect(problems(lines('  outline: 2px solid #264f29;'))).toHaveLength(2);
  });

  it('fails on a line of a var', () => {
    expect(problems(lines('  gap: var(--space-8); /* own: x */'))).toHaveLength(
      1
    );
  });
});

describe('the .module.css files of the repo', () => {
  const files = execFileSync('git', ['ls-files', '*.module.css'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);

  it('finds them', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(files)('%s has no token literal', file => {
    expect(tokenLiterals(readFileSync(join(root, file), 'utf8'), real)).toEqual(
      []
    );
  });
});
