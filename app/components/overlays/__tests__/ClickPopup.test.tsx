import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { ClickPopup, pointText } from '@ks/app/components/overlays/ClickPopup';

const POINT = { latitude: -28.74, longitude: 25.31 };

// PIN-01
it('writes a negative and a positive point with 6 decimals, latitude first', () => {
  expect(pointText(POINT)).toBe('-28.740000, 25.310000');
  expect(pointText({ latitude: 3.5, longitude: -1.25 })).toBe(
    '3.500000, -1.250000'
  );
});

// PIN-01. Data is synthetic.
it('shows the point with 6 decimals, latitude first, and the hint', () => {
  render(<ClickPopup onAdd={vi.fn()} point={POINT} x={380} y={240} />);

  const popup = screen.getByRole('dialog', { name: 'Add a pin here' });

  within(popup).getByText('Point on the map');
  expect(within(popup).getByText('-28.740000, 25.310000').textContent).toBe(
    '-28.740000, 25.310000'
  );
  within(popup).getByText('The panel opens with this point filled in.');
});

it('calls onAdd with the point', () => {
  const onAdd = vi.fn();

  render(<ClickPopup onAdd={onAdd} point={POINT} x={380} y={240} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin here' }));
  expect(onAdd).toHaveBeenCalledWith(POINT);
});

it('calls onClose from Close and from Esc', () => {
  const onClose = vi.fn();

  render(
    <ClickPopup onAdd={vi.fn()} onClose={onClose} point={POINT} x={1} y={2} />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(2);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'a' });
  expect(onClose).toHaveBeenCalledTimes(2);
});

it('places the popup and the dot at the point', () => {
  render(<ClickPopup onAdd={vi.fn()} point={POINT} x={380} y={240} />);

  const placed = screen.getByTestId('placed-at');

  expect(placed?.style.getPropertyValue('--x')).toBe('380px');
  expect(placed?.style.getPropertyValue('--y')).toBe('240px');
  expect(placed?.style.getPropertyValue('--gap')).toBe(
    'var(--layout-popup-gap)'
  );

  const dot = screen.getByTestId('click-dot');

  expect([dot.style.left, dot.style.top]).toEqual(['380px', '240px']);
});
