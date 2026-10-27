import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { TextLink } from '@ks/app/components/actions/TextLink';

// NFR-06
it('is a link with a given state', () => {
  render(
    <TextLink href='#sources' state='focus'>
      Attributions
    </TextLink>
  );

  const link = screen.getByRole('link', { name: 'Attributions' });

  expect(link.getAttribute('href')).toBe('#sources');
  expect(link.dataset.state).toBe('focus');
});

it('has a small size, also when disabled', () => {
  render(
    <>
      <TextLink href='#a' size='small'>
        Live
      </TextLink>
      <TextLink disabled size='small'>
        Off
      </TextLink>
    </>
  );

  expect(screen.getByRole('link', { name: 'Live' }).dataset.size).toBe('small');
  expect(screen.getByText('Off').dataset.size).toBe('small');
});

it('is plain text marked disabled when disabled', () => {
  render(<TextLink disabled>Attributions</TextLink>);
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.getByText('Attributions').getAttribute('aria-disabled')).toBe(
    'true'
  );
});
