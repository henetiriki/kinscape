import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { ProgressBar } from '@ks/app/components/feedback/ProgressBar';

// NFR-06
it('clamps the progress bar to 0 to 100 and names it', () => {
  const { rerender } = render(
    <>
      <span id='name'>Loading</span>
      <ProgressBar labelledBy='name' value={45} />
    </>
  );
  const bar = () => screen.getByRole('progressbar');

  expect(bar().getAttribute('aria-valuenow')).toBe('45');
  expect(bar().getAttribute('aria-valuemin')).toBe('0');
  expect(bar().getAttribute('aria-valuemax')).toBe('100');
  expect(bar().getAttribute('aria-labelledby')).toBe('name');

  rerender(<ProgressBar labelledBy='name' value={140} />);
  expect(bar().getAttribute('aria-valuenow')).toBe('100');
  rerender(<ProgressBar labelledBy='name' value={-3} />);
  expect(bar().getAttribute('aria-valuenow')).toBe('0');
});
