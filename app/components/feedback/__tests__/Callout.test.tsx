import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Callout, CalloutPointer } from '@ks/app/components/feedback/Callout';

// NFR-06
it('renders a callout as an alert with its id, and a hidden pointer', () => {
  const { container } = render(
    <>
      <Callout className='mine' id='why'>
        Bad date
      </Callout>
      <Callout id='plain'>Plain</Callout>
      <CalloutPointer className='mine' />
      <CalloutPointer />
    </>
  );

  const [first, second] = Array.from(
    container.querySelectorAll('[role=alert]')
  );
  const pointers = Array.from(container.querySelectorAll('span'));

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
