import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { LoadingField } from '@ks/app/components/feedback/LoadingField';

// NFR-06
it('draws the label over one bar for an input', () => {
  const { container } = render(
    <LoadingField label='Precision' widths={[120]} />
  );
  const bars = container.querySelectorAll<HTMLElement>('[data-bar]');

  expect(container.textContent).toBe('Precision');
  expect(bars).toHaveLength(1);
  expect(bars[0].style.width).toBe('120px');
  expect(
    container.querySelector('[data-rows]')!.getAttribute('data-rows')
  ).toBe('1');
});

it('draws the label over two bars for a text area', () => {
  const { container } = render(
    <LoadingField label='Sources' widths={[220, 160]} />
  );
  const bars = container.querySelectorAll<HTMLElement>('[data-bar]');

  expect(Array.from(bars).map(bar => bar.style.width)).toEqual([
    '220px',
    '160px',
  ]);
  expect(
    container.querySelector('[data-rows]')!.getAttribute('data-rows')
  ).toBe('2');
});
