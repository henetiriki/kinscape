import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { LoadingField } from '@ks/app/components/feedback/LoadingField';

// NFR-06
it('draws the label over one bar for an input', () => {
  const { container } = render(
    <LoadingField label='Precision' widths={[120]} />
  );
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- a bar is an aria-hidden span with no role or text
  const bars = container.querySelectorAll<HTMLElement>('[data-bar]');
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the bar group is a div with no role or text
  const group = container.querySelector('[data-rows]')!;

  expect(container.textContent).toBe('Precision');
  expect(bars).toHaveLength(1);
  expect(bars[0].style.width).toBe('120px');
  expect(group.getAttribute('data-rows')).toBe('1');
});

it('draws the label over two bars for a text area', () => {
  const { container } = render(
    <LoadingField label='Sources' widths={[220, 160]} />
  );
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- a bar is an aria-hidden span with no role or text
  const bars = container.querySelectorAll<HTMLElement>('[data-bar]');
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the bar group is a div with no role or text
  const group = container.querySelector('[data-rows]')!;

  expect(Array.from(bars).map(bar => bar.style.width)).toEqual([
    '220px',
    '160px',
  ]);
  expect(group.getAttribute('data-rows')).toBe('2');
});
