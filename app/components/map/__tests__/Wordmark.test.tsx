import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Wordmark } from '@/app/components/map/Wordmark';

// NFR-06
it('shows the icon as decoration beside the name', () => {
  const { container } = render(<Wordmark />);
  const icon = container.querySelector('img')!;

  expect(icon.getAttribute('alt')).toBe('');
  expect(screen.queryByRole('img')).toBeNull();
  expect(screen.getByText('KinScape').className).toBe('h2');
  expect(container.querySelector('a')).toBeNull();
});

it('names the icon "KinScape" when it stands alone', () => {
  const { container } = render(<Wordmark iconOnly size={32} />);

  expect(screen.getByRole('img', { name: 'KinScape' })).toBeTruthy();
  expect(container.textContent).toBe('');
});

it('sets the name in H3 below 44px', () => {
  render(<Wordmark size={36} />);

  expect(screen.getByText('KinScape').className).toBe('h3');
});

// NFR-05
it.each([
  [44, 11],
  [36, 9],
  [32, 8],
] as const)('draws the %ipx icon with a radius of %ipx', (size, radius) => {
  const { container } = render(<Wordmark size={size} />);
  const icon = container.querySelector('img')!;

  expect(icon.getAttribute('width')).toBe(String(size));
  expect(icon.style.borderRadius).toBe(`${radius}px`);
});
