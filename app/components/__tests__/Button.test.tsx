import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Button } from '../Button';
import { IconButton } from '../IconButton';

// NFR-06
it('is a secondary button that does not submit a form unless asked', () => {
  render(<Button>Copy chain</Button>);

  const button = screen.getByRole('button', { name: 'Copy chain' });

  expect(button.className).toBe('btn btnSecondary');
  expect(button.getAttribute('type')).toBe('button');
});

it('is primary on request, shows a given state and can be disabled', () => {
  render(
    <Button disabled state='hover' variant='primary'>
      Sign in
    </Button>
  );

  const button = screen.getByRole('button', {
    name: 'Sign in',
  }) as HTMLButtonElement;

  expect(button.className).toContain('btnPrimary');
  expect(button.dataset.state).toBe('hover');
  expect(button.disabled).toBe(true);
});

it('names an icon button and passes clicks on', () => {
  const onClick = vi.fn();

  render(
    <IconButton label='Zoom in' onClick={onClick}>
      +
    </IconButton>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  expect(onClick).toHaveBeenCalledOnce();
});
