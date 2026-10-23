import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Modal, ModalClose } from '../Modal';

const renderModal = (open: boolean, onClose = vi.fn()) =>
  render(
    <Modal aria-label='Example' onClose={onClose} open={open}>
      <p>Content</p>
    </Modal>
  );

const modal = () => screen.getByRole('dialog', { hidden: true });

// NFR-05
it('opens and closes the native dialog with open', () => {
  const { rerender } = renderModal(false);

  expect(modal().hasAttribute('open')).toBe(false);
  rerender(
    <Modal aria-label='Example' onClose={vi.fn()} open>
      <p>Content</p>
    </Modal>
  );
  expect(modal().hasAttribute('open')).toBe(true);
  rerender(
    <Modal aria-label='Example' onClose={vi.fn()} open={false}>
      <p>Content</p>
    </Modal>
  );
  expect(modal().hasAttribute('open')).toBe(false);
});

it('asks to close on the scrim but not on its content', () => {
  const onClose = vi.fn();

  renderModal(true, onClose);
  fireEvent.click(screen.getByText('Content'));
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.click(modal());
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('asks to close when the browser closes the dialog (Esc)', () => {
  const onClose = vi.fn();

  renderModal(true, onClose);
  fireEvent(modal(), new Event('close'));

  expect(onClose).toHaveBeenCalledTimes(1);
});

it('has a Close button that clicks through, and one that only draws', () => {
  const onClick = vi.fn();
  const { rerender } = render(<ModalClose iconSize={20} onClick={onClick} />);

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClick).toHaveBeenCalledTimes(1);

  rerender(<ModalClose iconSize={18} />);
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClick).toHaveBeenCalledTimes(1);
});
