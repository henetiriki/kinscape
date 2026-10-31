import { describe, expect, it } from 'vitest';

import type { SystemTokens } from '@ks/lib/design/types.ts';

import { formatProblems } from '@ks/lib/design/format.mts';

const valid = (): SystemTokens => ({
  color: {
    themes: [{ id: 'light', name: 'Light' }],
    tokens: [
      { name: 'brand', usage: 'Buttons.', value: '#264f29' },
      {
        name: 'scrim',
        usage: 'Behind dialogs.',
        value: 'rgb(24 33 27 / 0.45)',
      },
      { name: 'focus-ring', usage: 'Focus.', value: '{brand}' },
    ],
  },
  focus: { tokens: [{ name: 'focus-width', usage: 'Outline.', value: '2px' }] },
  name: 'KinScape',
  radius: {
    tokens: [{ name: 'radius-panel', usage: 'Panels.', value: '12px' }],
  },
  shadow: {
    tokens: [
      {
        name: 'shadow-raised',
        usage: 'Panels.',
        value:
          '0 1px 2px rgb(24 33 27 / 0.08), 0 6px 20px rgb(24 33 27 / 0.12)',
      },
    ],
  },
  size: { tokens: [{ name: 'size-touch', usage: 'Taps.', value: '44px' }] },
  spacing: { tokens: [{ name: 'space-4', usage: 'Gaps.', value: '4px' }] },
  type: {
    families: { body: "'Public Sans', system-ui, sans-serif" },
    fonts: [
      {
        family: 'Public Sans',
        file: 'fonts/public-sans-latin-wght-normal.woff2',
        style: 'normal',
        weight: '100 900',
      },
    ],
    groups: [
      {
        family: 'body',
        name: 'Body',
        styles: [
          {
            fontSize: '15px',
            fontStyle: 'normal',
            fontWeight: '400',
            letterSpacing: '0',
            lineHeight: '22px',
            name: 'body',
            usage: 'Panels.',
          },
        ],
      },
    ],
  },
  version: 1,
});

const colours = (tokens: SystemTokens, ...more: [string, string][]) => {
  for (const [name, value] of more) {
    tokens.color.tokens.push({ name, usage: 'x', value });
  }

  return tokens;
};

describe('formatProblems', () => {
  it('passes tokens that follow the rules', () => {
    expect(formatProblems(valid())).toEqual([]);
  });

  it.each([
    ['-lead', 'name'],
    ['a'.repeat(65), 'name'],
    ['has space', 'name'],
  ])('names a token called %s', name => {
    const tokens = colours(valid(), [name, '#fff']);

    expect(formatProblems(tokens)).toEqual([
      `${name}: the name breaks ^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$`,
    ]);
  });

  it('names a duplicate across families', () => {
    const tokens = valid();

    tokens.size.tokens.push({ name: 'brand', usage: 'x', value: '1px' });

    expect(formatProblems(tokens)).toEqual(['brand: the name is used twice']);
  });

  it.each([
    ['red', 'is not a hex or numeric colour function'],
    ['var(--brand)', 'is not a hex or numeric colour function'],
    [
      'color-mix(in srgb, #fff, #000)',
      'is not a hex or numeric colour function',
    ],
    ['rgb(var(--a))', 'is not a hex or numeric colour function'],
    ['#12345', 'is not a hex or numeric colour function'],
    ['{missing}', 'aliases {missing}, which is not a colour'],
    ['{bad}', 'aliases itself'],
  ])('names the colour %s', (value, problem) => {
    expect(formatProblems(colours(valid(), ['bad', value]))).toEqual([
      `bad: "${value}" ${problem}`,
    ]);
  });

  it.each([
    ['#fff'],
    ['#ffff'],
    ['#ffffff'],
    ['#ffffffaa'],
    ['rgba(1, 2, 3, 0.5)'],
    ['hsl(120 40% 20%)'],
    ['oklch(0.5 0.1 120)'],
    ['{brand}'],
  ])('passes the colour %s', value => {
    expect(formatProblems(colours(valid(), ['ok', value]))).toEqual([]);
  });

  it('names an alias cycle', () => {
    expect(
      formatProblems(colours(valid(), ['a', '{b}'], ['b', '{a}']))
    ).toEqual([
      'a: "{b}" is in an alias cycle',
      'b: "{a}" is in an alias cycle',
    ]);
  });

  it('names an alias chain over 16 deep', () => {
    const tokens = valid();
    const links: [string, string][] = Array.from({ length: 17 }, (_, at) => [
      `c${at}`,
      `{c${at + 1}}`,
    ]);

    colours(tokens, ...links, ['c17', '#fff']);

    expect(formatProblems(tokens)).toEqual([
      'c0: "{c1}" is an alias chain over 16 deep',
    ]);
  });

  it.each([['var(--x)'], ['url(a.png)'], ['0 0 1px <b>'], ['x'.repeat(201)]])(
    'names a value that breaks the plain-value rule: %s',
    value => {
      const tokens = valid();

      tokens.shadow.tokens[0].value = value;

      expect(formatProblems(tokens)).toEqual([
        `shadow-raised: the value is not a plain CSS value of at most 200 characters`,
      ]);
    }
  );

  it('names a usage over 1000 characters', () => {
    const tokens = valid();

    tokens.size.tokens[0].usage = 'x'.repeat(1001);

    expect(formatProblems(tokens)).toEqual([
      'size-touch: the usage is over 1000 characters',
    ]);
  });

  it('names a font stack that breaks the rules', () => {
    const tokens = valid();

    tokens.type.families.body = 'a(b)';
    tokens.type.families.mono = 'x'.repeat(201);

    expect(formatProblems(tokens)).toEqual([
      'type.families.body: the stack has a forbidden character or is over 200 characters',
      'type.families.mono: the stack has a forbidden character or is over 200 characters',
    ]);
  });

  it('names a font entry with a bad file, style or weight', () => {
    const tokens = valid();

    tokens.type.fonts[0] = {
      family: 'Public Sans',
      file: '../x.woff2',
      style: 'oblique',
      weight: 'bold',
    };

    expect(formatProblems(tokens)).toEqual([
      'type.fonts ../x.woff2: the file is not under fonts/',
      'type.fonts ../x.woff2: the style is not normal or italic',
      'type.fonts ../x.woff2: the weight is not a number or a range',
    ]);
  });

  it('names a style with a bad size, line height, weight or spacing', () => {
    const tokens = valid();
    const [style] = tokens.type.groups[0].styles;

    style.fontSize = 'big';
    style.lineHeight = '12';
    style.fontWeight = '1200';
    style.letterSpacing = 'wide';

    expect(formatProblems(tokens)).toEqual([
      'type.Body.body: fontSize "big" is not a length',
      'type.Body.body: lineHeight "12" is a unitless number of 10 or more',
      'type.Body.body: fontWeight "1200" is not 1 to 1000 or a range',
      'type.Body.body: letterSpacing "wide" is not a length',
    ]);
  });

  it('passes a unitless line height under 10 and a weight range', () => {
    const tokens = valid();
    const [style] = tokens.type.groups[0].styles;

    style.lineHeight = '1.4';
    style.fontWeight = '200 800';

    expect(formatProblems(tokens)).toEqual([]);
  });

  it('names a style whose family is not in families, and a usage over 1000', () => {
    const tokens = valid();

    tokens.type.groups[0].family = 'nope';
    tokens.type.groups[0].styles[0].usage = 'x'.repeat(1001);

    expect(formatProblems(tokens)).toEqual([
      'type.Body: the family nope is not in type.families',
      'type.Body.body: the usage is over 1000 characters',
    ]);
  });

  it('names each cap', () => {
    const tokens = valid();

    for (let at = 0; at < 600; at += 1) {
      tokens.color.tokens.push({ name: `c-${at}`, usage: 'x', value: '#fff' });
    }

    for (let at = 0; at < 60; at += 1) {
      tokens.size.tokens.push({ name: `s-${at}`, usage: 'x', value: '1px' });
    }

    const [group] = tokens.type.groups;

    for (let at = 0; at < 12; at += 1) {
      tokens.type.groups.push({ ...group, name: `G${at}`, styles: [] });
    }

    for (let at = 0; at < 80; at += 1) {
      group.styles.push({ ...group.styles[0], name: `st${at}` });
    }

    for (let at = 0; at < 12; at += 1) {
      Object.assign(tokens, { [`extra${at}`]: { tokens: [] } });
    }

    expect(formatProblems(tokens)).toEqual([
      'color: 603 tokens, over the 600 cap',
      'size: 61 tokens, over the 60 cap',
      'type: 13 groups, over the 12 cap',
      'type: 81 styles, over the 80 cap',
      'tokens.json: 17 families other than type, over the 12 cap',
    ]);
  });
});
