import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FanPin } from '@ks/features/map/types';

import { PlaceMarker } from '@ks/features/map/components/PlaceMarker';

const PINS: FanPin[] = [
  { event: 'residence', id: 'p1', reading: 'From 1890 to 1905' },
  { event: 'birth', id: 'p2', reading: 'In 1901' },
  { event: 'marriage', id: 'p3', reading: 'In 1899' },
];

const fanned = () => screen.queryAllByRole('button').length > 1;

const setup = (selected?: boolean) => {
  const onOpen = vi.fn();
  const view = render(
    <div>
      <PlaceMarker onOpen={onOpen} pins={PINS} selected={selected} />
      <p>Elsewhere</p>
    </div>
  );
  const marker = () => screen.getByRole('button', { name: '3 Pins' });

  return { marker, onOpen, view };
};

describe('PlaceMarker', () => {
  // PIN-06
  it('shows one marker with the count and no fan at first', () => {
    const { marker } = setup();

    expect(marker().textContent).toBe('3');
    expect(fanned()).toBe(false);
  });

  it('fans the Pins out on hover and folds them when the mouse leaves', () => {
    const { view } = setup();
    const place = view.container.firstElementChild!.firstElementChild!;

    fireEvent.pointerEnter(place, { pointerType: 'mouse' });
    expect(screen.getAllByRole('button')).toHaveLength(4);

    fireEvent.pointerLeave(place, { pointerType: 'mouse' });
    expect(fanned()).toBe(false);
  });

  it('does not fan out when a touch enters it', () => {
    const { marker } = setup();

    fireEvent.pointerEnter(marker().parentElement!, { pointerType: 'touch' });

    expect(fanned()).toBe(false);
  });

  it('fans the Pins out on the first tap, and folds them on a tap elsewhere', () => {
    const { marker } = setup();

    fireEvent.click(marker());
    expect(fanned()).toBe(true);

    fireEvent.pointerDown(marker());
    expect(fanned()).toBe(true);

    fireEvent.pointerDown(screen.getByText('Elsewhere'));
    expect(fanned()).toBe(false);
  });

  it('opens a tapped Pin and folds the fan (#860 plan D3)', () => {
    const { marker, onOpen } = setup();

    fireEvent.click(marker());
    fireEvent.click(screen.getByRole('button', { name: 'Birth, in 1901' }));

    expect(onOpen).toHaveBeenCalledWith('p2');
    expect(fanned()).toBe(false);
  });

  // PIN-02
  it('shows the selection ring when the open Pin is one of its Pins (#862 D3)', () => {
    const { view } = setup(true);

    expect(view.container.querySelectorAll('[data-ring]')).toHaveLength(1);
  });
});
