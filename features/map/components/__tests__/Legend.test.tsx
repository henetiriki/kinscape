import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';
import { Legend } from '@ks/features/map/components/Legend';
import { HATCH_LINE } from '@ks/lib/ui/hatch';

const { map } = resolveTokens(rawTokens);

// MAP-05
it('names its heading and the four meanings, then the four Event glyphs', () => {
  const { container } = render(<Legend />);

  screen.getByRole('heading', { level: 3, name: 'Reading the map' });
  expect(
    screen
      .getAllByText(/^(Approximate border|Border as recorded|Contested claim)$/)
      .map(row => row.textContent?.trim())
  ).toEqual(['Border as recorded', 'Approximate border', 'Contested claim']);
  screen.getByText('Uncertain date (ABT, BEF, AFT…)');
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the Event glyphs are aria-hidden SVGs with no role or text
  const glyphs = [...container.querySelectorAll('[data-event]')];

  expect(glyphs.map(glyph => (glyph as HTMLElement).dataset.event)).toEqual([
    'birth',
    'residence',
    'marriage',
    'death',
  ]);
});

// NFR-06
it('draws each Event glyph before its name, with no glyph character', () => {
  const { container } = render(<Legend />);
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the Event glyphs are aria-hidden SVGs with no role or text
  const glyphs = [...container.querySelectorAll('[data-event]')];
  // eslint-disable-next-line testing-library/no-node-access -- the test checks that each glyph's row starts with the glyph
  const rows = glyphs.map(glyph => glyph.parentElement!);

  expect(rows.map(row => row.textContent?.trim())).toEqual([
    'Birth',
    'Residence',
    'Marriage',
    'Death',
  ]);
  expect(
    rows.every(row => row.firstElementChild?.tagName.toLowerCase() === 'svg')
  ).toBe(true);
  expect(container.textContent).not.toMatch(/[*▪∞†]|\uFE0E/);
});

it('hides every swatch from assistive tech', () => {
  const { container } = render(<Legend />);

  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the test checks the aria-hidden swatches, which no query returns
  expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(7);
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the test checks the aria-hidden swatches, which no query returns
  expect(container.querySelector('span[aria-hidden="true"]')).toBeTruthy();
});

// MAP-05, NFR-05, BND-04
it('builds the hatch colour from map.hatch as an rgba() value, which the design export can read', () => {
  expect(map.hatch).toEqual({ colour: '#8b4a1c', opacity: 0.34 });
  expect(HATCH_LINE).toBe('rgba(139, 74, 28, 0.34)');
});
