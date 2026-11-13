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

  expect(screen.getByRole('banner').tagName).toBe('HEADER');
  expect(links).toHaveLength(1);
  expect(links[0]!.textContent).toBe('Map');
  expect(links[0]!.getAttribute('href')).toBe('/map');
  expect(links[0]!.querySelector('svg')!.getAttribute('data-icon')).toBe(
    'back'
  );
  expect(screen.getByRole('button', { name: 'Account menu' }).textContent).toBe(
    'L'
  );
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
  expect(css).toContain('height: var(--layout-page-header-divider)');
  expect(css).not.toMatch(/^\s+height:\s*\d/m);
  expect(css).not.toMatch(/\b(64|60)px/);
});

// PPL-01
it('draws the desktop Wordmark in a flex row, so a line box does not make it taller than 32', () => {
  expect(css).toMatch(/\.full \{\s+display: inline-flex;/);
  expect(css.indexOf('.full {')).toBeLessThan(css.indexOf('@media'));
});

// PPL-01
it('ends a long back label in an ellipsis, so it stays on one line in the 44px link', () => {
  render(<BackLink href='/people' label='Back to the people list' />);

  const link = screen.getByRole('link', { name: 'Back to the people list' });
  const label = link.querySelector('span')!;

  expect(label.textContent).toBe('Back to the people list');
  expect(label.className).toBe('label');
  expect(css).toMatch(
    /\.label \{\s+min-width: 0;\s+overflow: hidden;\s+text-overflow: ellipsis;\s+white-space: nowrap;/
  );
  expect(css).toMatch(/\.back svg \{\s+flex: none;/);
});

// PPL-01
it('has a focus ring and the icon button hover and press looks on the back link', () => {
  expect(css).toContain(
    "composes: ring from '@ks/app/components/foundation/focus.module.css'"
  );
  expect(css).toMatch(/@media \(hover: hover\)/);
  expect(css).toContain("[data-state='active']");
});
