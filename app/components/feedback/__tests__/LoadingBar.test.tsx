import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { LoadingBar } from '@ks/app/components/feedback/LoadingBar';

// NFR-06
it('draws a bar of the given width and hides it from a screen reader', () => {
  render(<LoadingBar width={168} />);
  const bar = screen.getByTestId('loading-bar');

  expect(bar.style.width).toBe('168px');
  expect(bar.getAttribute('aria-hidden')).toBe('true');
  expect(bar.textContent).toBe('');
});
