import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Divider } from '@ks/app/components/foundation/Divider';

// NFR-06
it('draws a hairline separator, or one with a word between two lines', () => {
  render(
    <>
      <Divider />
      <Divider label='or' />
    </>
  );

  screen.getByRole('separator');
  expect(screen.getByText('or').hasAttribute('aria-hidden')).toBe(false);
});
