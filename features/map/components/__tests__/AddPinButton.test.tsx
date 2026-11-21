import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { AddPinButton } from '@ks/features/map/components/AddPinButton';

// PIN-01
it('is the primary Button named "Add a pin", and clicks', () => {
  const onClick = vi.fn();

  render(<AddPinButton onClick={onClick} />);

  const button = screen.getByRole('button', { name: 'Add a pin' });

  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
  expect(button.className).toMatch(/btnPrimary/);
  expect(button.getAttribute('data-size')).toBeNull();
});

it('draws each look with the state prop', () => {
  render(<AddPinButton state='hover' />);

  expect(screen.getByRole('button', { name: 'Add a pin' }).dataset.state).toBe(
    'hover'
  );
});
