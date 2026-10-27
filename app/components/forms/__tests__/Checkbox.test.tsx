import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Checkbox } from '@ks/app/components/forms/Checkbox';

// NFR-06
it('reports a checkbox as checked or not and shows a given state', () => {
  render(
    <>
      <Checkbox aria-label='Off' />
      <Checkbox aria-label='On' defaultChecked state='active' />
    </>
  );
  expect(
    (screen.getByRole('checkbox', { name: 'Off' }) as HTMLInputElement).checked
  ).toBe(false);

  const on = screen.getByRole('checkbox', { name: 'On' }) as HTMLInputElement;

  expect(on.checked).toBe(true);
  expect(on.dataset.state).toBe('active');
});
