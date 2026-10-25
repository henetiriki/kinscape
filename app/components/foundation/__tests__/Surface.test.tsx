import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Callout, CalloutPointer } from '@/app/components/feedback/Callout';
import { ProgressBar } from '@/app/components/feedback/ProgressBar';
import { Surface } from '@/app/components/foundation/Surface';

// NFR-06
it('draws each level with its own class and keeps a caller class', () => {
  const { container } = render(
    <>
      <Surface level='raised'>a</Surface>
      <Surface level='floating'>b</Surface>
      <Surface level='modal'>c</Surface>
      <Surface className='extra' level='sheet'>
        d
      </Surface>
    </>
  );

  const nodes = Array.from(container.children);

  expect(new Set(nodes.map(node => node.className.split(' ')[0])).size).toBe(4);
  expect(nodes[3].classList.contains('extra')).toBe(true);
});

it('clamps the progress bar to 0 to 100 and names it', () => {
  const { container, rerender } = render(
    <>
      <span id='name'>Loading</span>
      <ProgressBar labelledBy='name' value={45} />
    </>
  );
  const bar = () => container.querySelector('[role="progressbar"]')!;

  expect(bar().getAttribute('aria-valuenow')).toBe('45');
  expect(bar().getAttribute('aria-valuemin')).toBe('0');
  expect(bar().getAttribute('aria-valuemax')).toBe('100');
  expect(bar().getAttribute('aria-labelledby')).toBe('name');

  rerender(<ProgressBar labelledBy='name' value={140} />);
  expect(bar().getAttribute('aria-valuenow')).toBe('100');
  rerender(<ProgressBar labelledBy='name' value={-3} />);
  expect(bar().getAttribute('aria-valuenow')).toBe('0');
});

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
