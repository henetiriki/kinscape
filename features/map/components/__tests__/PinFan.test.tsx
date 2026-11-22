import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FanPin } from '@ks/features/map/types';

import { fanPinName, PinFan } from '@ks/features/map/components/PinFan';

const PINS: FanPin[] = [
  { event: 'residence', id: 'p1', reading: 'From 1890 to 1905' },
  { event: 'birth', id: 'p2', reading: 'About 1850' },
  { event: 'marriage', id: 'p3', reading: 'In 1899' },
];

const many = (count: number): FanPin[] =>
  Array.from({ length: count }, (_, index) => ({
    event: 'other',
    id: `p${index}`,
    reading: 'In 1900',
  }));

describe('fanPinName', () => {
  // PIN-06
  it('gives the event type and the reading of the date (#863 D6)', () => {
    expect(fanPinName(PINS[0])).toBe('Residence, from 1890 to 1905');
    expect(fanPinName(PINS[1])).toBe('Birth, about 1850');
    expect(fanPinName(PINS[2])).toBe('Marriage, in 1899');
  });
});

describe('PinFan', () => {
  // PIN-06
  it('draws a named button with an Event glyph for each Pin, in the order given', () => {
    render(<PinFan pins={PINS} />);

    expect(
      screen.getAllByRole('button').map(({ ariaLabel }) => ariaLabel)
    ).toEqual([
      'Residence, from 1890 to 1905',
      'Birth, about 1850',
      'Marriage, in 1899',
    ]);
    const glyphs = screen
      .getAllByRole('img', { hidden: true })
      .filter(glyph => glyph.dataset.event);

    expect(glyphs.map(glyph => glyph.dataset.event)).toEqual([
      'residence',
      'birth',
      'marriage',
    ]);
  });

  it('places the first Pin below the Place, then the others clockwise (#863 plan D4)', () => {
    render(<PinFan pins={PINS} />);

    expect(
      screen.getAllByRole('button').map(({ style }) => [style.left, style.top])
    ).toEqual([
      ['0px', '56px'],
      ['-48px', '-28px'],
      ['48px', '-28px'],
    ]);
  });

  it('joins the Pins of ring 1 to the Place, and draws no ring for one ring', () => {
    const { container } = render(<PinFan pins={PINS} />);

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the lines and rings are in an aria-hidden SVG with no role
    expect(container.querySelectorAll('line')).toHaveLength(3);
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the lines and rings are in an aria-hidden SVG with no role
    expect(container.querySelectorAll('circle')).toHaveLength(0);
  });

  it('draws each ring of a fan of more than one ring, and lines to ring 1 only', () => {
    const { container } = render(<PinFan pins={many(12)} />);

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the lines and rings are in an aria-hidden SVG with no role
    const rings = [...container.querySelectorAll('circle')];

    expect(rings.map(ring => ring.getAttribute('r'))).toEqual(['56', '104']);
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the lines and rings are in an aria-hidden SVG with no role
    expect(container.querySelectorAll('line')).toHaveLength(7);
  });

  it('opens the Pin that is clicked', () => {
    const onOpen = vi.fn();

    render(<PinFan onOpen={onOpen} pins={PINS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Birth, about 1850' }));

    expect(onOpen).toHaveBeenCalledWith('p2');
  });

  it('holds the marker at the Place, and shows a look on one Pin for a board', () => {
    render(
      <PinFan looks={{ p2: 'hover' }} pins={PINS}>
        <span>Marker</span>
      </PinFan>
    );

    // The marker sits at the Place: over the lines and under the Pins.
    // eslint-disable-next-line testing-library/no-node-access -- the test checks the order of the Place box and its siblings, which have no role
    const place = screen.getByText('Marker').parentElement!;

    expect(place.previousElementSibling?.tagName.toLowerCase()).toBe('svg');
    expect(place.nextElementSibling?.tagName.toLowerCase()).toBe('button');
    expect(
      screen.getByRole('button', { name: 'Birth, about 1850' }).dataset.state
    ).toBe('hover');
    expect(
      screen.getByRole('button', { name: 'Marriage, in 1899' }).dataset.state
    ).toBeUndefined();
  });

  it('does nothing on a click with no handler', () => {
    render(<PinFan pins={PINS} />);

    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: 'Birth, about 1850' }))
    ).not.toThrow();
  });
});
