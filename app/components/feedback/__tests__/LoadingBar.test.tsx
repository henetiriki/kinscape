import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { LoadingBar } from '@ks/app/components/feedback/LoadingBar';

// NFR-06
it('draws a bar of the given width and hides it from a screen reader', () => {
  const { container } = render(<LoadingBar width={168} />);
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the bar is an aria-hidden span with no role or text
  const bar = container.querySelector<HTMLElement>('[data-bar]')!;

  expect(bar.style.width).toBe('168px');
  expect(bar.getAttribute('aria-hidden')).toBe('true');
  expect(bar.textContent).toBe('');
});
