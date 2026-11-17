import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';

import { TextLink } from '@ks/app/components/actions/TextLink';

const css = readFileSync(
  join(process.cwd(), 'app/components/actions/TextLink.module.css'),
  'utf8'
);

// NFR-06
it('gives the button form a touch-size minimum height', () => {
  const button = /\.textLink:where\(button\) \{[^}]*\}/.exec(css)![0];

  expect(button).toContain('min-height: var(--size-touch)');
  expect(/\.textLink \{[^}]*\}/.exec(css)![0]).not.toContain('min-height');
});

// NFR-05, NFR-06
it('gives an enabled link a centred touch-size hit area, and the disabled text none', () => {
  const link = /\.textLink \{[^}]*\}/.exec(css)![0];
  const before =
    /\.textLink:not\(\[aria-disabled='true'\]\)::before \{[^}]*\}/.exec(
      css
    )![0];

  expect(link).toContain('position: relative');
  expect(before).toContain('height: var(--size-touch)');
  expect(before).toContain('width: max(100%, var(--size-touch))');
  expect(before).toContain('translate: -50% -50%');
  expect(css).not.toMatch(/aria-disabled='true'\]::before/);
});

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

it('passes the other attributes to the button, except those only an anchor has', () => {
  render(
    <TextLink
      aria-describedby='message'
      id='fix'
      onClick={vi.fn()}
      rel='noreferrer'
      target='_blank'>
      Go to 1901
    </TextLink>
  );

  const button = screen.getByRole('button', { name: 'Go to 1901' });

  expect(button.getAttribute('aria-describedby')).toBe('message');
  expect(button.id).toBe('fix');
  expect(button.hasAttribute('target')).toBe(false);
  expect(button.hasAttribute('rel')).toBe(false);
});

it('is plain text marked disabled when disabled', () => {
  render(<TextLink disabled>Attributions</TextLink>);
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.getByText('Attributions').getAttribute('aria-disabled')).toBe(
    'true'
  );
});
