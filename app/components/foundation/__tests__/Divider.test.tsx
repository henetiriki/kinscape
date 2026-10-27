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

  expect(screen.getByRole('separator')).toBeTruthy();
  expect(screen.getByText('or').getAttribute('aria-hidden')).toBeNull();
});
