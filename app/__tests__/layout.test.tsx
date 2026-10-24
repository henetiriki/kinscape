import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';

import tokens from '../../design/tokens.json';
import { fontVariable } from '../../lib/design/tokens.mts';
import RootLayout, { metadata } from '../layout';

interface FontOptions {
  declarations?: { prop: string; value: string }[];
  src: { path: string; style: string; weight: string }[];
  variable?: string;
}

// next/font/local reads the files at build time, so the unit tests stand in for it.
const { calls } = vi.hoisted(() => ({ calls: [] as FontOptions[] }));

vi.mock('next/font/local', () => ({
  default: (options: FontOptions) => {
    calls.push(options);

    return { variable: `class-${options.variable}` };
  },
}));

const withVariable = () => calls.filter(options => options.variable);
const declaration = (options: FontOptions, prop: string) =>
  options.declarations?.find(d => d.prop === prop)?.value;

it('wraps the children in an English document', () => {
  const html = renderToStaticMarkup(
    <RootLayout>
      <p>child</p>
    </RootLayout>
  );

  expect(html).toContain('lang="en"');
  expect(html).toContain('<body><p>child</p></body>');
});

// NFR-03
it('asks search engines not to index or follow', () => {
  expect(metadata.robots).toEqual({ follow: false, index: false });
});

// NFR-03: the fonts are served by KinScape, under the names tokens.css expects.
it('loads each font token with the next/font variable its stack starts with', () => {
  const variables = withVariable().map(options => options.variable);
  const expected = Object.values(tokens.font).map(stack =>
    fontVariable(stack.split(',')[0].replaceAll("'", ''))
  );

  expect(variables.toSorted()).toEqual(expected.toSorted());
});

it('loads the weights the style guide lists from the @fontsource files', () => {
  const byVariable: Record<string, FontOptions['src']> = Object.fromEntries(
    withVariable().map(options => [options.variable, options.src])
  );

  expect(
    byVariable['--next-font-bricolage-grotesque'].map(f => f.weight)
  ).toEqual(['200 800']);
  expect(
    byVariable['--next-font-public-sans'].map(f => [f.style, f.weight])
  ).toEqual([
    ['normal', '100 900'],
    ['italic', '100 900'],
  ]);
  expect(byVariable['--next-font-jetbrains-mono'].map(f => f.weight)).toEqual([
    '400',
    '500',
  ]);

  for (const options of calls) {
    for (const file of options.src) {
      expect(file.path).toMatch(/node_modules\/@fontsource.*\.woff2$/);
    }
  }
});

// B230: latin-ext joins the latin family, so ő isn't drawn by the metric fallback.
// next/font names the latin family after its const, so the ext call declares that name.
it('adds a latin-ext face to the same family, with its own unicode-range', () => {
  const latin = withVariable().filter(options => options.declarations);
  const ext = calls.filter(options => !options.variable);

  expect(latin).toHaveLength(2);
  expect(ext.map(options => declaration(options, 'font-family'))).toEqual([
    "'bricolage'",
    "'publicSans'",
  ]);

  for (const options of latin) {
    expect(options.src[0].path).toContain('-latin-wght-');
    expect(declaration(options, 'unicode-range')).toContain('U+0000-00FF');
  }

  for (const options of ext) {
    expect(options.src[0].path).toContain('-latin-ext-wght-');
    expect(declaration(options, 'unicode-range')).toContain('U+0100-02BA');
  }

  expect(ext[1].src.map(f => f.style)).toEqual(['normal', 'italic']);
});

it('puts the font variables on <html>', () => {
  const html = renderToStaticMarkup(<RootLayout>{null}</RootLayout>);

  for (const { variable } of withVariable()) {
    expect(html).toContain(`class-${variable}`);
  }
});
