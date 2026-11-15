import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

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

it('is a button with onClick and no href', () => {
  const onClick = vi.fn();

  render(
    <TextLink onClick={onClick} size='small' state='hover'>
      Go to 1901
    </TextLink>
  );

  const button = screen.getByRole('button', { name: 'Go to 1901' });

  fireEvent.click(button);

  expect(onClick).toHaveBeenCalledOnce();
  expect(button.getAttribute('type')).toBe('button');
  expect(button.dataset.size).toBe('small');
  expect(button.dataset.state).toBe('hover');
  expect(screen.queryByRole('link')).toBeNull();
});

it('is plain text marked disabled when disabled', () => {
  render(<TextLink disabled>Attributions</TextLink>);
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.getByText('Attributions').getAttribute('aria-disabled')).toBe(
    'true'
  );
});
