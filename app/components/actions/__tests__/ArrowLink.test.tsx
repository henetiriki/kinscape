import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ArrowLink } from '@ks/app/components/actions/ArrowLink';

const css = readFileSync(
  join(process.cwd(), 'app/components/actions/ArrowLink.module.css'),
  'utf8'
);

// PPL-01
describe('with an href', () => {
  it('is a link with the text and the forward icon', () => {
    render(<ArrowLink href='/people/1'>Edit</ArrowLink>);

    const link = screen.getByRole('link', { name: 'Edit' });

    expect(link.getAttribute('href')).toBe('/people/1');
    expect(link.textContent).toBe('Edit');
    expect(link.querySelector('svg[data-icon="forward"]')).not.toBeNull();
  });

  it('takes a state and the attributes of a link', () => {
    render(
      <ArrowLink href='/people/1' state='hover' title='Edit Botha'>
        Edit
      </ArrowLink>
    );

    const link = screen.getByRole('link');

    expect(link.dataset.state).toBe('hover');
    expect(link.getAttribute('title')).toBe('Edit Botha');
  });

  it('adds the focus ring and the hover and pressed colours', () => {
    const link = /\.link \{[^}]*\}/.exec(css)![0];

    expect(link).toContain(
      "composes: ring from '@ks/app/components/foundation/focus.module.css'"
    );
    expect(link).toContain('cursor: pointer');
    expect(css).toMatch(
      /@media \(hover: hover\) \{\s*\.link:hover \{\s*color: var\(--brand-hover\)/
    );
    expect(css).toMatch(
      /\.link\[data-state='hover'\] \{\s*color: var\(--brand-hover\)/
    );
    expect(css).toMatch(
      /\.link:is\(:active, \[data-state='active'\]\) \{\s*color: var\(--brand-pressed\)/
    );
  });
});

describe('without an href', () => {
  it('is a label that is no link', () => {
    render(<ArrowLink>Edit</ArrowLink>);
    expect(screen.queryByRole('link')).toBeNull();

    const label = screen.getByText('Edit');

    expect(label).toBeInstanceOf(HTMLSpanElement);
    expect(label.querySelector('svg[data-icon="forward"]')).not.toBeNull();
  });

  it('turns brand-pressed inside a pressed link', () => {
    expect(css).toMatch(
      /a:is\(:active, \[data-state='active'\]\) \.arrowLink \{\s*color: var\(--brand-pressed\)/
    );
  });
});

// PPL-01
it('sets the text in the link font with no underline', () => {
  const base = /\.arrowLink \{[^}]*\}/.exec(css)![0];

  expect(base).toContain('font-family: var(--type-link-font)');
  expect(base).toContain('font-size: var(--type-link-size)');
  expect(base).toContain('font-weight: var(--type-link-weight)');
  expect(base).toContain('line-height: var(--type-link-line)');
  expect(base).toContain('letter-spacing: var(--type-link-tracking)');
  expect(base).toContain('color: var(--brand)');
  expect(base).toContain('gap: var(--space-4)');
  expect(base).not.toMatch(/underline|composes/);
});
