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
  expect(area.parentElement!.dataset.state).toBe('hover');
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
it('takes the text field box, padding 10 12, and 16 / 24 text on a phone', () => {
  expect(css).toContain("composes: box from '@ks/app/components/forms/");
  expect(css).toContain('padding: 10px 12px');
  expect(css).toMatch(
    /@media \(max-width: 639\.98px\), \(max-height: 499\.98px\)/
  );
  expect(css).toContain('var(--type-body-l-size)');
});
