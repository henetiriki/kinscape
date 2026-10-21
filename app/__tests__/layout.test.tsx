import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';

import tokens from '../../design/tokens.json';
import { fontVariable } from '../../lib/design/tokens.mts';
import RootLayout, { metadata } from '../layout';

// next/font fetches from Google at build time, so the unit tests stand in for it.
const { calls, font } = vi.hoisted(() => {
  const recorded: { variable: string; weight: string | string[] }[] = [];

  return {
    calls: recorded,
    font: (options: { variable: string; weight: string | string[] }) => {
      recorded.push(options);

      return { variable: `class-${options.variable}` };
    },
  };
});

vi.mock('next/font/google', () => ({
  Bricolage_Grotesque: font,
  JetBrains_Mono: font,
  Public_Sans: font,
}));

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
  const variables = calls.map(options => options.variable);
  const expected = Object.values(tokens.font).map(stack =>
    fontVariable(stack.split(',')[0].replaceAll("'", ''))
  );

  expect(variables.toSorted()).toEqual(expected.toSorted());
});

it('loads the weights the style guide lists', () => {
  const weights = Object.fromEntries(
    calls.map(options => [options.variable, options.weight])
  );

  expect(weights['--next-font-bricolage-grotesque']).toBe('variable');
  expect(weights['--next-font-public-sans']).toEqual(['400', '500', '600']);
  expect(weights['--next-font-jetbrains-mono']).toEqual(['400', '500']);
});

it('puts the font variables on <html>', () => {
  const html = renderToStaticMarkup(<RootLayout>{null}</RootLayout>);

  for (const variable of calls.map(o => o.variable)) {
    expect(html).toContain(`class-${variable}`);
  }
});
