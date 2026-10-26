import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { EVENT_GLYPHS, EventGlyph } from '@/app/components/map/EventGlyph';

// NFR-06
it.each(Object.entries(EVENT_GLYPHS))(
  'draws the %s glyph in text form, hidden from assistive tech',
  (event, glyph) => {
    const { container } = render(
      <EventGlyph event={event as keyof typeof EVENT_GLYPHS} size={16} />
    );

    const span = container.querySelector('span')!;

    expect(span.textContent).toBe(`${glyph}︎`);
    expect(span.getAttribute('aria-hidden')).toBe('true');
    expect(span.style.fontSize).toBe('16px');
  }
);

it('uses the code points the design lists for each Event type', () => {
  expect(
    Object.fromEntries(
      Object.entries(EVENT_GLYPHS).map(([event, glyph]) => [
        event,
        glyph.codePointAt(0),
      ])
    )
  ).toEqual({
    baptism: 0x7e,
    birth: 0x2a,
    burial: 0x26b0,
    death: 0x2020,
    divorce: 0x25,
    marriage: 0x221e,
    other: 0x2022,
    residence: 0x25aa,
  });
});

it('sizes a glyph 14 unless told', () => {
  const { container } = render(<EventGlyph event='birth' />);

  expect(container.querySelector('span')!.style.fontSize).toBe('14px');
});
