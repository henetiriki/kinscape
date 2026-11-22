import { render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { PersonRow } from '@ks/app/components/actions/PersonRow';

const css = readFileSync(
  join(process.cwd(), 'app/components/actions/PersonRow.module.css'),
  'utf8'
);

const row = (props: Partial<Parameters<typeof PersonRow>[0]> = {}) =>
  render(
    <PersonRow
      born='1832'
      bornReading='In 1832'
      died='1899'
      diedReading='In 1899'
      givenNames='Hendrik Willem'
      href='/people/1'
      surname='Botha'
      {...props}
    />
  );

// PPL-01
it('is one link to edit, named by the name, the words for the dates and Edit', () => {
  row();

  const link = screen.getByRole('link');

  expect(screen.getAllByRole('link')).toHaveLength(1);
  expect(link.getAttribute('href')).toBe('/people/1');
  expect(link.textContent).toBe(
    'Botha, Hendrik WillemBorn in 1832, died in 18991832 – 1899Edit'
  );
});

// PPL-01
it('hides the line from a screen reader and reads the words', () => {
  row();
  expect(screen.getByText('1832 – 1899').getAttribute('aria-hidden')).toBe(
    'true'
  );
  expect(screen.getByText('Born in 1832, died in 1899').className).toMatch(
    /hidden/
  );
  expect(screen.queryByText(/née|Matches/)).toBeNull();
});

// PPL-01
it.each([
  [{ died: '', diedReading: '' }, '1832 –', 'Born in 1832'],
  [
    { born: '', bornReading: '', died: '', diedReading: '' },
    '? –',
    'Born unknown',
  ],
  [
    { deceased: true, died: '', diedReading: '' },
    '1832 – ?',
    'Born in 1832, died unknown',
  ],
  [
    { born: '', bornReading: '', deceased: true, died: '', diedReading: '' },
    '? – ?',
    'Born unknown, died unknown',
  ],
  [{ born: '', bornReading: '' }, '? – 1899', 'Born unknown, died in 1899'],
  [
    {
      born: 'bef. 1840',
      bornReading: 'Before 1840',
      deceased: true,
      died: '',
      diedReading: '',
    },
    'bef. 1840 – ?',
    'Born before 1840, died unknown',
  ],
])('%j reads %s and %s', (props, line, words) => {
  row(props);
  expect(screen.getByText(line).getAttribute('aria-hidden')).toBe('true');
  expect(screen.getByText(words).className).toMatch(/hidden/);
});

// PPL-01
it('shows the maiden name, then the matched variant, in one line', () => {
  row({ maidenName: 'Fourie', matchedVariant: 'Bota' });
  expect(screen.getByText(/^née Fourie/).textContent).toBe(
    'née Fourie · Matches the spelling “Bota”'
  );
});

// PPL-01
it('shows the maiden name alone, and the matched variant alone', () => {
  const { unmount } = row({ maidenName: 'Rossouw' });

  expect(screen.getByRole('link').textContent).toBe(
    'Botha, Hendrik Willemnée RossouwBorn in 1832, died in 18991832 – 1899Edit'
  );
  unmount();
  row({ matchedVariant: 'Nell' });
  expect(screen.getByRole('link').textContent).toBe(
    'Botha, Hendrik WillemMatches the spelling “Nell”Born in 1832, died in 18991832 – 1899Edit'
  );
});

// PPL-01
it('anchors the hidden words to the row, so they add no scroll height to a list', () => {
  const dates = readFileSync(
    join(process.cwd(), 'app/components/actions/DateText.module.css'),
    'utf8'
  );

  expect(/\.row \{[^}]*\}/.exec(css)![0]).toContain('position: relative');
  expect(/\.withLink \{[^}]*\}/.exec(css)![0]).toContain('position: relative');
  expect(/\.phone \{[^}]*\}/.exec(css)![0]).toContain('position: relative');
  expect(/\.hidden \{[^}]*\}/.exec(dates)![0]).toContain('position: absolute');
  expect(dates).not.toMatch(/clip-path|clip:/);
});

// PPL-01
describe('on a phone', () => {
  const phoneRow = (props: Partial<Parameters<typeof PersonRow>[0]> = {}) =>
    row({ form: 'phone', ...props });

  it('is no link and has no Edit', () => {
    phoneRow();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.getByText('Botha, Hendrik Willem').textContent).toBe(
      'Botha, Hendrik Willem'
    );
  });

  it('reads the line under the name, with no "Born" or "deceased" text', () => {
    const { unmount } = phoneRow({ died: '', diedReading: '' });

    expect(screen.getByText('1832 –').textContent).toBe('1832 –');
    expect(screen.queryByText(/^Born \d/)).toBeNull();
    unmount();
    phoneRow({
      born: 'bef. 1840',
      bornReading: 'Before 1840',
      deceased: true,
      died: '',
      diedReading: '',
    });
    expect(screen.getByText('bef. 1840 – ?').textContent).toBe('bef. 1840 – ?');
    expect(screen.queryByText(/deceased/)).toBeNull();
  });

  it('shows the note after the line', () => {
    phoneRow({ maidenName: 'Fourie', matchedVariant: 'Bota' });
    expect(screen.getByText(/^née Fourie/).textContent).toBe(
      'née Fourie · Matches the spelling “Bota”'
    );
  });
});

// PPL-01
describe('with a Relationships link', () => {
  it('has two links, and the new one names the Person for a screen reader', () => {
    const { container } = row({ relationshipsHref: '/people/1/relationships' });

    expect(screen.getAllByRole('link')).toHaveLength(2);
    // eslint-disable-next-line testing-library/no-node-access -- the root div has no role; the test checks its tag
    expect(container.firstElementChild!.tagName).toBe('DIV');

    const link = screen.getByRole('link', { name: /^Relationships/ });

    expect(link.getAttribute('href')).toBe('/people/1/relationships');
    expect(link.textContent).toBe('Relationships, Botha, Hendrik Willem');
    expect(
      screen.getByRole('link', { name: /Edit/ }).getAttribute('href')
    ).toBe('/people/1');
  });

  it('is one link without it', () => {
    row();
    expect(screen.queryByText(/Relationships/)).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});

// PPL-01
it('takes a state', () => {
  row({ state: 'hover' });
  expect(screen.getByRole('link').dataset.state).toBe('hover');
});

// PPL-01
it('shows Edit as an ArrowLink label, with no rule of its own', () => {
  row();

  const edit = screen.getByText('Edit');

  expect(edit).toBeInstanceOf(HTMLSpanElement);
  expect(
    within(edit)
      .getAllByRole('img', { hidden: true })
      .map(icon => icon.dataset.icon)
  ).toContain('forward');
  // eslint-disable-next-line testing-library/no-node-access -- the test checks that the link is the direct parent of the label
  expect(edit.parentElement).toBe(screen.getByRole('link'));
  expect(css).not.toContain('.edit');
});

// PPL-01
it('is at least 52px tall on the People-list grid, and tints hover and pressed', () => {
  expect(css).toContain('min-height: var(--size-row-l)');
  expect(css).toContain('grid-template-columns: minmax(0, 1fr) 200px 72px');
  expect(css).toMatch(/hover[\s\S]*?background: var\(--surface-2\)/);
  expect(css).toMatch(/active[\s\S]*?background: var\(--segment\)/);
  expect(css).toContain(
    "composes: ring from '@ks/app/components/foundation/focus.module.css'"
  );
});
