import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { LayersButton } from '@/app/components/map/LayersButton';
import { ZoomControls } from '@/app/components/map/ZoomControls';

// MAP-05
it('names the three zoom buttons and calls their handlers', () => {
  const [onFit, onZoomIn, onZoomOut] = [vi.fn(), vi.fn(), vi.fn()];

  render(
    <ZoomControls onFit={onFit} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
  );

  for (const name of ['Zoom in', 'Zoom out', 'Fit South Africa']) {
    fireEvent.click(screen.getByRole('button', { name }));
  }

  expect(onZoomIn).toHaveBeenCalledOnce();
  expect(onZoomOut).toHaveBeenCalledOnce();
  expect(onFit).toHaveBeenCalledOnce();
  expect(
    screen
      .getByRole('button', { name: 'Zoom in' })
      .getAttribute('aria-disabled')
  ).toBeNull();
});

it('marks Zoom out aria-disabled at the minimum: still focusable, no call', () => {
  const [onZoomIn, onZoomOut] = [vi.fn(), vi.fn()];

  render(<ZoomControls atMin onZoomIn={onZoomIn} onZoomOut={onZoomOut} />);

  const out = screen.getByRole('button', { name: 'Zoom out' });

  out.focus();
  fireEvent.click(out);

  expect(out.getAttribute('aria-disabled')).toBe('true');
  expect(out.hasAttribute('disabled')).toBe(false);
  expect(document.activeElement).toBe(out);
  expect(onZoomOut).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

  expect(onZoomIn).toHaveBeenCalledOnce();
});

it('marks Zoom in aria-disabled at the maximum, and shows a look on it', () => {
  const onZoomIn = vi.fn();

  render(<ZoomControls atMax onZoomIn={onZoomIn} state='hover' />);

  const zoomIn = screen.getByRole('button', { name: 'Zoom in' });

  fireEvent.click(zoomIn);

  expect(zoomIn.getAttribute('aria-disabled')).toBe('true');
  expect(zoomIn.getAttribute('data-state')).toBe('hover');
  expect(onZoomIn).not.toHaveBeenCalled();
});

it('names the layers button and calls its handler', () => {
  const onClick = vi.fn();

  render(<LayersButton onClick={onClick} />);
  fireEvent.click(screen.getByRole('button', { name: 'Layers and filters' }));

  expect(onClick).toHaveBeenCalledOnce();
});
