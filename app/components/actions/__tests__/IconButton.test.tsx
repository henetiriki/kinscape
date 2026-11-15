import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { IconButton } from '@ks/app/components/actions/IconButton';

// NFR-06
it('has no variant by default', () => {
  render(<IconButton label='Zoom in'>+</IconButton>);

  expect(
    screen.getByRole('button', { name: 'Zoom in' }).dataset.variant
  ).toBeUndefined();
});

it('marks the raised variant', () => {
  render(
    <IconButton label='Layers' variant='raised'>
      +
    </IconButton>
  );

  expect(screen.getByRole('button', { name: 'Layers' }).dataset.variant).toBe(
    'raised'
  );
});
