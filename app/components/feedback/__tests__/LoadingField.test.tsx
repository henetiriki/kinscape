import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { LoadingField } from '@ks/app/components/feedback/LoadingField';

// NFR-06
it('draws the label over one bar for an input', () => {
  const { container } = render(
    <LoadingField label='Precision' widths={[120]} />
  );
  const bars = screen.getAllByTestId('loading-bar');
  const group = screen.getByTestId('loading-bars');

  expect(container.textContent).toBe('Precision');
  expect(bars).toHaveLength(1);
  expect(bars[0].style.width).toBe('120px');
  expect(group.getAttribute('data-rows')).toBe('1');
});

it('draws the label over two bars for a text area', () => {
  render(<LoadingField label='Sources' widths={[220, 160]} />);
  const bars = screen.getAllByTestId('loading-bar');
  const group = screen.getByTestId('loading-bars');

  expect(bars.map(bar => bar.style.width)).toEqual(['220px', '160px']);
  expect(group.getAttribute('data-rows')).toBe('2');
});
