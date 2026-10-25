import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import rawTokens from '@/design/tokens.json';
import { resolveTokens } from '@/lib/design/tokens.mts';

import { Legend } from '../Legend';

const { map } = resolveTokens(rawTokens);

// MAP-05
it('names its heading and the four meanings, then the four Event glyphs', () => {
  const { container } = render(<Legend />);

  expect(
    screen.getByRole('heading', { level: 3, name: 'Reading the map' })
  ).toBeTruthy();
  expect(
    [...container.querySelectorAll('span')]
      .map(row => row.textContent?.trim())
      .filter(text =>
        [
          'Approximate border',
          'Border as recorded',
          'Contested claim',
        ].includes(text ?? '')
      )
  ).toEqual(['Border as recorded', 'Approximate border', 'Contested claim']);
  expect(screen.getByText('Uncertain date (ABT, BEF, AFT…)')).toBeTruthy();
  expect(
    [...container.querySelectorAll('[data-event]')].map(
      glyph => (glyph as HTMLElement).dataset.event
    )
  ).toEqual(['birth', 'residence', 'marriage', 'death']);
});

it('hides every swatch from assistive tech', () => {
  const { container } = render(<Legend />);

  expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(3);
  expect(container.querySelector('span[aria-hidden="true"]')).toBeTruthy();
});

// MAP-05, NFR-05
it('reads each swatch value from the map tokens', () => {
  const { container } = render(<Legend />);
  const legend = container.firstElementChild as HTMLElement;
  const value = (name: string) => legend.style.getPropertyValue(name);

  expect(value('--legend-border')).toBe(map.border.colour);
  expect(value('--legend-border-width')).toBe(`${map.border.width}px`);
  expect(value('--legend-dash')).toBe(
    `${map.border['dash-on']} ${map.border['dash-off']}`
  );
  expect(value('--legend-fill')).toBe(map.polity['free-state']);
  expect(value('--legend-hatch')).toBe(map.hatch.colour);
  expect(value('--legend-hatch-opacity')).toBe(String(map.hatch.opacity));
  expect(value('--legend-halo')).toBe(map['pin-halo'].colour);
  expect(value('--legend-halo-opacity')).toBe(String(map['pin-halo'].opacity));
  expect(value('--legend-pin')).toBe(map.pin.colour);
  expect(value('--legend-pin-opacity')).toBe(String(map.pin['fuzzy-opacity']));
  expect(value('--legend-pin-stroke')).toBe(map.pin.halo);
  expect(value('--legend-pin-stroke-width')).toBe(
    String(map.pin['halo-width'])
  );
});
