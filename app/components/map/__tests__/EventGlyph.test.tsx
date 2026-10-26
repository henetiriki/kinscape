import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import {
  EVENT_ORDER,
  EVENT_PATHS,
  EventGlyph,
} from '@/app/components/map/EventGlyph';

const css = readFileSync(
  join(import.meta.dirname, '../EventGlyph.module.css'),
  'utf8'
);

// NFR-06
it.each(EVENT_ORDER)(
  'draws the %s glyph as one currentColor path in a 24 by 24 box, hidden from assistive tech',
  event => {
    const { container } = render(<EventGlyph event={event} />);
    const svg = container.querySelector('svg')!;

    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.dataset.event).toBe(event);
    expect(svg.querySelectorAll('path')).toHaveLength(1);
    expect(svg.querySelector('path')!.getAttribute('d')).toBe(
      EVENT_PATHS[event]
    );
    expect(container.textContent).toBe('');
  }
);

it('lists every Event type once, in the order the design draws them', () => {
  expect(EVENT_ORDER).toEqual([
    'birth',
    'baptism',
    'residence',
    'marriage',
    'divorce',
    'death',
    'burial',
    'land',
    'occupation',
    'other',
  ]);
  expect([...EVENT_ORDER].sort()).toEqual(Object.keys(EVENT_PATHS).sort());
});

it('sizes a glyph 1em square in --pin, so it follows the text around it', () => {
  const rule = css.slice(css.indexOf('.glyph'));

  expect(rule).toContain('color: var(--pin)');
  expect(rule).toContain('height: 1em');
  expect(rule).toContain('width: 1em');
  expect(
    render(<EventGlyph event='birth' />).container.querySelector('svg')!
      .classList
  ).toContain('glyph');
});
