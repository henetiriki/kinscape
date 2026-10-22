import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { Sheet } from '../Sheet';

// jsdom has no showModal or close: stand in for them with the `open` attribute.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = () =>
    document.querySelector('dialog')!.setAttribute('open', '');
  HTMLDialogElement.prototype.close = () =>
    document.querySelector('dialog')!.removeAttribute('open');
});

const sheet = () => screen.getByRole('dialog', { hidden: true });

const renderSheet = (open: boolean, onClose = vi.fn()) =>
  render(
    <Sheet onClose={onClose} open={open} title='Menu'>
      <p>Content</p>
    </Sheet>
  );

it('is a dialog named by its title and holds its children', () => {
  renderSheet(true);

  expect(sheet().getAttribute('aria-labelledby')).toBe(
    screen.getByRole('heading', { hidden: true, name: 'Menu' }).id
  );
  expect(screen.getByText('Content')).toBeTruthy();
});

it('stays closed until open is true, then opens and closes with it', () => {
  const { rerender } = renderSheet(false);

  expect(sheet().hasAttribute('open')).toBe(false);

  rerender(
    <Sheet onClose={vi.fn()} open title='Menu'>
      <p>Content</p>
    </Sheet>
  );
  expect(sheet().hasAttribute('open')).toBe(true);

  rerender(
    <Sheet onClose={vi.fn()} open={false} title='Menu'>
      <p>Content</p>
    </Sheet>
  );
  expect(sheet().hasAttribute('open')).toBe(false);
});

it('asks to close on the Close button', () => {
  const onClose = vi.fn();

  renderSheet(true, onClose);
  fireEvent.click(screen.getByRole('button', { hidden: true, name: 'Close' }));

  expect(onClose).toHaveBeenCalledTimes(1);
});

it('asks to close on the scrim but not on its content', () => {
  const onClose = vi.fn();

  renderSheet(true, onClose);
  fireEvent.click(screen.getByText('Content'));
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.click(sheet());
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('asks to close when the browser closes the dialog (Esc)', () => {
  const onClose = vi.fn();

  renderSheet(true, onClose);
  fireEvent(sheet(), new Event('close'));

  expect(onClose).toHaveBeenCalledTimes(1);
});
