import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { PlacedAt } from '@ks/app/components/overlays/PlacedAt';

// PIN-02, MAP-05
it('sets the point and the gap token of its popup, and draws the child', () => {
  const { container } = render(
    <PlacedAt gap='pin-popup-gap' x={120} y={80}>
      <p>Popup</p>
    </PlacedAt>
  );
  const placed = container.firstElementChild as HTMLElement;

  expect(placed.style.getPropertyValue('--x')).toBe('120px');
  expect(placed.style.getPropertyValue('--y')).toBe('80px');
  expect(placed.style.getPropertyValue('--gap')).toBe(
    'var(--layout-pin-popup-gap)'
  );
  expect(placed.textContent).toBe('Popup');
});

it('takes the other gap token for the Jurisdiction popup', () => {
  const { container } = render(
    <PlacedAt gap='popup-gap' x={0} y={0}>
      <p>Popup</p>
    </PlacedAt>
  );

  expect(
    (container.firstElementChild as HTMLElement).style.getPropertyValue('--gap')
  ).toBe('var(--layout-popup-gap)');
});
