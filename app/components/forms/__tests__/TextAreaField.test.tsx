import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';

import { TextAreaField } from '@ks/app/components/forms/TextAreaField';

const css = readFileSync(
  join(process.cwd(), 'app/components/forms/TextAreaField.module.css'),
  'utf8'
);

// PPL-01
it('is a textarea named by its label, with helper text and a state', () => {
  const onChange = vi.fn();

  render(
    <TextAreaField
      helper='Add what the sources say.'
      label='Notes'
      onChange={onChange}
      state='hover'
    />
  );

  const area = screen.getByRole('textbox', { name: 'Notes' });

  expect(area.tagName).toBe('TEXTAREA');
  expect(screen.getByTestId('field-box').dataset.state).toBe('hover');
  expect(area.getAttribute('aria-describedby')).toBe(
    screen.getByText('Add what the sources say.').id
  );
  fireEvent.change(area, { target: { value: 'Farm Doornkloof' } });
  expect(onChange).toHaveBeenCalledOnce();
});

// PPL-01
it('takes a maxLength of 10000 and passes it to the textarea', () => {
  render(<TextAreaField label='Notes' maxLength={10000} />);
  expect(
    screen.getByRole('textbox', { name: 'Notes' }).getAttribute('maxlength')
  ).toBe('10000');
});

// PPL-01
it('has no description when it has no helper, and can be disabled', () => {
  render(<TextAreaField disabled label='Notes' />);

  const area = screen.getByRole('textbox', { name: 'Notes' });

  expect(area.hasAttribute('aria-describedby')).toBe(false);
  expect((area as HTMLTextAreaElement).disabled).toBe(true);
});

// PPL-01
it('grows only vertically, and scrolls long content inside the box', () => {
  expect(css).toContain('resize: vertical');
  expect(css).toContain('overflow-y: auto');
  expect(css).not.toMatch(/resize: (both|horizontal)/);
});

// PPL-01
it('fills a flex column that has a height, and keeps its rows without one', () => {
  expect(css).toMatch(/\.field \{[^}]*flex: 1 1 auto/);
  expect(css).toMatch(/\.field > \.box \{[^}]*flex: 1 1 auto/);
});

// PPL-01
it('puts the padding on the textarea, so the resize handle sits at the padded corner', () => {
  const area = /^\.area \{[^}]*\}/m.exec(css)![0];
  const box = /^\.field > \.box \{[^}]*\}/m.exec(css)![0];

  expect(area).toContain('padding: var(--space-inset-xs) var(--space-inset-s)');
  expect(box).toContain('padding: 0;');
  expect(css).toMatch(
    /:focus-within[^{]*\.area[^{]*\{[^}]*padding:\s*calc\(\s*var\(--space-inset-xs\) - var\(--border-emphasis\) \+ var\(--border-hairline\)\s*\)/
  );
});

// PIN-02
it('shows an error in place of the helper, with the error box, icon and aria links', () => {
  render(
    <TextAreaField
      error='Add a note.'
      helper='Add what the sources say.'
      label='Notes'
    />
  );

  const area = screen.getByRole('textbox', { name: 'Notes' });
  const alert = screen.getByRole('alert');

  expect(alert.textContent).toBe('Add a note.');
  expect(screen.queryByText('Add what the sources say.')).toBeNull();
  expect(area.getAttribute('aria-invalid')).toBe('true');
  expect(area.getAttribute('aria-describedby')).toBe(alert.id);
  expect(screen.getByTestId('field-box').dataset.mark).toBe('error');
  screen.getByRole('img', { hidden: true });
  expect((area as HTMLTextAreaElement).rows).toBe(4);
});

// PIN-02
it('joins a given aria-describedby with the helper id, and marks nothing without an error', () => {
  render(
    <TextAreaField aria-describedby='other' helper='Help' label='Notes' />
  );

  const area = screen.getByRole('textbox', { name: 'Notes' });

  expect(area.getAttribute('aria-describedby')).toBe(
    `other ${screen.getByText('Help').id}`
  );
  expect(area.hasAttribute('aria-invalid')).toBe(false);
  expect(screen.getByTestId('field-box').hasAttribute('data-mark')).toBe(false);
  expect(screen.queryByRole('alert')).toBeNull();
});

// PPL-01
it('takes the text field box, block padding inset xs, and 16 / 24 text', () => {
  expect(css).toContain("composes: box from '@ks/app/components/forms/");
  expect(css).toContain('padding: var(--space-inset-xs) var(--space-inset-s)');
  expect(css).toContain('var(--type-body-size)');
  expect(css).not.toContain('@media');
});
