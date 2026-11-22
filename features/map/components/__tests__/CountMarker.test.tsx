import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { CountMarker } from '@ks/features/map/components/CountMarker';

// PIN-06
it('shows the number of Pins and has the name "{count} Pins" (#863 D5)', () => {
  render(<CountMarker count={3} />);

  const marker = screen.getByRole('button', { name: '3 Pins' });

  expect(marker.textContent).toBe('3');
  expect(marker.getAttribute('type')).toBe('button');
});

it('calls its click handler', () => {
  const onClick = vi.fn();

  render(<CountMarker count={12} onClick={onClick} />);
  fireEvent.click(screen.getByRole('button', { name: '12 Pins' }));

  expect(onClick).toHaveBeenCalledOnce();
});

// PIN-02
it('draws the selection ring only while selected (#862 D3)', () => {
  const { rerender } = render(<CountMarker count={3} selected />);

  expect(screen.getAllByTestId('ring')).toHaveLength(1);
  const ring = screen.getByTestId('ring');

  expect(ring.getAttribute('aria-hidden')).toBe('true');

  rerender(<CountMarker count={3} />);

  expect(screen.queryByTestId('ring')).toBeNull();
});

it('shows a card look from its state', () => {
  render(<CountMarker count={3} state='hover' />);

  expect(screen.getByRole('button', { name: '3 Pins' }).dataset.state).toBe(
    'hover'
  );
});
