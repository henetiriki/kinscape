import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';
import { Legend } from '@ks/features/map/components/Legend';
import { HATCH_LINE } from '@ks/lib/ui/hatch';

const { map } = resolveTokens(rawTokens);

// MAP-05
it('names its heading and the four meanings, then the four Event glyphs', () => {
  render(<Legend />);

  screen.getByRole('heading', { level: 3, name: 'Reading the map' });
  expect(
    screen
      .getAllByText(/^(Approximate border|Border as recorded|Contested claim)$/)
      .map(row => row.textContent?.trim())
  ).toEqual(['Border as recorded', 'Approximate border', 'Contested claim']);
  screen.getByText('Uncertain date (ABT, BEF, AFT…)');
  const glyphs = screen
    .getAllByRole('img', { hidden: true })
    .filter(glyph => glyph.dataset.event);

  expect(glyphs.map(glyph => glyph.dataset.event)).toEqual([
    'birth',
    'residence',
    'marriage',
    'death',
  ]);
});

// NFR-06
it('draws each Event glyph before its name, with no glyph character', () => {
  const { container } = render(<Legend />);
  const glyphs = screen
    .getAllByRole('img', { hidden: true })
    .filter(glyph => glyph.dataset.event);
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
  const svgs = screen.getAllByRole('img', { hidden: true });

  expect(svgs.map(svg => svg.getAttribute('aria-hidden'))).toEqual(
    Array(7).fill('true')
  );
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the test checks the aria-hidden swatch span, which no query returns
  expect(container.querySelector('span[aria-hidden="true"]')).toBeTruthy();
});

// MAP-05, NFR-05, BND-04
it('builds the hatch colour from map.hatch as an rgba() value, which the design export can read', () => {
  expect(map.hatch).toEqual({ colour: '#8b4a1c', opacity: 0.34 });
  expect(HATCH_LINE).toBe('rgba(139, 74, 28, 0.34)');
});

// MAP-05
describe('with the `rows` prop', () => {
  it('draws only the rows it lists', () => {
    render(<Legend rows={['border', 'events']} />);

    screen.getByText('Border as recorded');
    screen.getByText('Birth');
    expect(screen.queryByText('Approximate border')).toBeNull();
    expect(screen.queryByText('Contested claim')).toBeNull();
    expect(screen.queryByText(/Uncertain date/)).toBeNull();
  });

  it('leaves out the Event glyphs when `events` is not listed', () => {
    render(<Legend rows={['approximate', 'contested', 'uncertain']} />);

    screen.getByText('Approximate border');
    screen.getByText('Contested claim');
    screen.getByText('Uncertain date (ABT, BEF, AFT…)');
    expect(screen.queryByText('Birth')).toBeNull();
    expect(screen.queryByText('Border as recorded')).toBeNull();
  });

  it('draws the heading with no row listed', () => {
    render(<Legend rows={[]} />);

    screen.getByRole('heading', { level: 3, name: 'Reading the map' });
    expect(screen.queryAllByRole('img', { hidden: true })).toHaveLength(0);
  });
});
