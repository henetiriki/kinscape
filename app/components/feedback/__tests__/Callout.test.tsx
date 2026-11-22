import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Callout, CalloutPointer } from '@ks/app/components/feedback/Callout';

// NFR-06
it('renders a callout as an alert with its id, and a hidden pointer', () => {
  render(
    <>
      <Callout className='mine' id='why'>
        Bad date
      </Callout>
      <Callout id='plain'>Plain</Callout>
      <CalloutPointer className='mine' />
      <CalloutPointer />
    </>
  );

  const first = screen.getByText('Bad date');
  const second = screen.getByText('Plain');
  const pointers = screen.getAllByTestId('pointer');

  expect([first, second].map(node => node.getAttribute('role'))).toEqual([
    'alert',
    'alert',
  ]);
  expect(first.id).toBe('why');
  expect(first.classList.contains('mine')).toBe(true);
  expect(second.classList.contains('mine')).toBe(false);
  expect(pointers.map(node => node.getAttribute('aria-hidden'))).toEqual([
    'true',
    'true',
  ]);
  expect(pointers[0].classList.contains('mine')).toBe(true);
  expect(pointers[1].classList.contains('mine')).toBe(false);
});
