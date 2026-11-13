import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import { Avatar } from '@ks/app/components/foundation/Avatar';
import { BackLink, PageHeader } from '@ks/app/components/foundation/PageHeader';

const css = readFileSync(
  join(process.cwd(), 'app/components/foundation/PageHeader.module.css'),
  'utf8'
);

// PPL-01
it('is a header with one back link that shows the back icon', () => {
  render(
    <PageHeader
      avatar={<Avatar initial='L' />}
      backHref='/map'
      backLabel='Map'
    />
  );

  const links = screen.getAllByRole('link');

  expect(screen.getByRole('banner')).toBeTruthy();
  expect(links).toHaveLength(1);
  expect(links[0]!.textContent).toBe('Map');
  expect(links[0]!.getAttribute('href')).toBe('/map');
  expect(links[0]!.querySelector('svg')!.getAttribute('data-icon')).toBe(
    'back'
  );
  expect(screen.getByRole('button', { name: 'Account menu' })).toBeTruthy();
});

// PPL-01
it('draws the full Wordmark and the icon-only one for the phone CSS to pick', () => {
  const { container } = render(
    <PageHeader backHref='/people' backLabel='People' />
  );

  expect(container.textContent).toContain('KinScape');
  expect(container.querySelectorAll('img')).toHaveLength(2);
  expect(screen.getAllByAltText('KinScape')).toHaveLength(1);
  expect(screen.queryByRole('button')).toBeNull();
});

// PPL-01
it('gives the back link a state for the kit', () => {
  render(<BackLink href='/map' label='Map' state='focus' />);

  expect(screen.getByRole('link', { name: 'Map' }).dataset.state).toBe('focus');
});

// PPL-01
it('takes its heights and the 44px link from tokens', () => {
  expect(css).toContain('height: var(--layout-page-header)');
  expect(css).toContain('height: var(--layout-page-header-phone)');
  expect(css).toContain('height: var(--size-touch)');
  expect(css).toMatch(
    /@media \(max-width: 639\.98px\), \(max-height: 499\.98px\)/
  );
  expect(css).not.toMatch(/\b(64|60)px/);
});

// PPL-01
it('has a focus ring and the Button hover and press looks on the back link', () => {
  expect(css).toContain(
    "composes: ring from '@ks/app/components/foundation/focus.module.css'"
  );
  expect(css).toMatch(/@media \(hover: hover\)/);
  expect(css).toContain("[data-state='active']");
});
