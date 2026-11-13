import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import InputsKit from '@ks/app/design-kit/inputs/page';

vi.mock('@ks/server/auth/current.mts', () => ({ requireDevPage: vi.fn() }));

const show = async (part?: string | string[]) =>
  render(await InputsKit({ searchParams: Promise.resolve({ part }) }));

// NFR-06
it('shows the fifteen sections in board order, each with Measurements and Accessibility', async () => {
  await show();

  expect(
    screen.getByRole('heading', { level: 1, name: 'Inputs and actions' })
  ).toBeTruthy();
  expect(
    screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)
  ).toEqual([
    'Buttons',
    'Text fields',
    'Chips',
    'Tabs',
    'Checkbox field',
    'Alerts',
    'Dividers',
    'Key hints',
    'Page header',
    'Back link',
    'Action bar',
    'Button as a link',
    'Long text field',
    'Fuzzy date field',
    'Person row',
  ]);
  expect(
    screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
  ).toEqual(Array(15).fill(['Measurements', 'Accessibility']).flat());
});

it('draws each interactive component in five states, in the order drawn', async () => {
  await show();

  const names = (label: string) =>
    [
      ...screen
        .getByRole('figure', { name: label })
        .querySelectorAll('.row:not(.columns) > .name > :first-child'),
    ].map(name => name.textContent);

  expect(names('Button states')).toEqual([
    'Primary, card',
    'Secondary',
    'Play',
    'Play, icon only',
  ]);
  expect(names('Field states')).toEqual(['Password', 'Select']);
  expect(names('Chip states')).toEqual(['Event chip, off', 'Event chip, on']);
  expect(names('Removable chip states')).toEqual(['Removable chip']);
  expect(names('Tab states')).toEqual(['Tab with badge', 'Tab with badge, on']);
  expect(names('Checkbox field states')).toEqual([
    'Layer row, off',
    'Layer row, on',
    'Label only',
  ]);

  const matrix = screen.getByRole('figure', { name: 'Button states' });

  expect(matrix.querySelectorAll('.cell')).toHaveLength(20);
  expect(matrix.querySelectorAll('.cell[inert]')).toHaveLength(12);
  // A phone draws Play only icon-only, and labels Focus without "(keyboard)".
  expect(
    [
      ...matrix.querySelectorAll('.row[data-desktop] > .name > :first-child'),
    ].map(name => name.textContent)
  ).toEqual(['Play']);
  expect(
    [...matrix.querySelectorAll('.stateLabel')]
      .slice(0, 5)
      .map(l => l.textContent)
  ).toEqual(['Default', 'Hover', 'Focus', 'Pressed', 'Disabled']);
  expect(
    within(
      screen.getByRole('figure', { name: 'Removable chip states' })
    ).queryByText('Disabled')
  ).toBeNull();
});

it('draws both words where a phone reads differently, each hidden on the other', async () => {
  await show();

  const keyHints = screen.getByRole('region', { name: 'Key hints' });

  expect(within(keyHints).getByText(/See the desktop board\.$/).className).toBe(
    'phoneOnly'
  );
  expect(
    within(keyHints).getByText(/^Show a keyboard shortcut/).className
  ).toBe('desktopOnly');
  expect(
    within(screen.getByRole('figure', { name: 'Tab states' })).getByText(
      'Filters, not selected'
    ).className
  ).toBe('phoneOnly');
});

it('shows every button form, field form and chip', async () => {
  await show();

  const buttons = within(screen.getByRole('region', { name: 'Buttons' }));

  expect(
    buttons.getAllByRole('button', { name: 'Sign in' }).length
  ).toBeGreaterThan(0);
  expect(buttons.getAllByRole('button', { name: 'Copy chain' })).toHaveLength(
    1
  );
  expect(
    buttons.getAllByRole('button', { name: 'Play through time' }).length
  ).toBeGreaterThan(0);

  const fields = within(screen.getByRole('region', { name: 'Text fields' }));

  // Hidden: one in the variants and four in the states; shown: one in each, Pressed in the states.
  expect(fields.getAllByRole('button', { name: 'Show password' })).toHaveLength(
    5
  );
  expect(fields.getAllByRole('button', { name: 'Hide password' })).toHaveLength(
    2
  );
  expect(fields.getAllByRole('combobox').length).toBeGreaterThan(1);
  expect(fields.getAllByRole('searchbox').length).toBeGreaterThan(0);
  expect(
    fields.getAllByRole('button', { name: 'Remove Rossouw' }).length
  ).toBeGreaterThan(0);

  const chips = within(screen.getByRole('region', { name: 'Chips' }));

  // Ten event chips (three on) plus one chip in each of the five states.
  expect(chips.getAllByRole('button', { pressed: true })).toHaveLength(8);
  expect(chips.getAllByRole('button', { pressed: false })).toHaveLength(12);

  expect(
    within(screen.getByRole('region', { name: 'Tabs' })).getAllByRole('tab', {
      name: 'Filters, 1 active',
    }).length
  ).toBeGreaterThan(0);
  expect(
    within(screen.getByRole('region', { name: 'Checkbox field' })).getAllByRole(
      'checkbox',
      { name: 'Keep me signed in on this device' }
    ).length
  ).toBeGreaterThan(0);
  expect(
    within(screen.getByRole('region', { name: 'Alerts' })).getAllByRole('alert')
  ).toHaveLength(1);
});

const links = () =>
  screen
    .getAllByRole('link', { name: /^Part \d:/ })
    .map(link => [link.textContent, link.getAttribute('href')]);

it('shows part 1 by default, with a link to part 2 on each width', async () => {
  await show();

  const main = screen.getByRole('main');

  expect(main.dataset.part).toBe('1');
  expect(main.dataset.desktopPart).toBe('1');
  expect(links()).toEqual([
    [expect.stringMatching(/^Part 2: /), '/design-kit/inputs?part=2'],
    [expect.stringMatching(/^Part 2: /), '/design-kit/inputs?part=2'],
  ]);
  expect(screen.getByText(/part 1 of 4/).textContent).toBe(' · part 1 of 4');
  expect(screen.getByText(/part 1 of 2/).textContent).toBe(' · part 1 of 2');
});

it.each([
  ['2', '2', '3', '1'],
  ['3', '1', '4', '2'],
  ['4', '1', '1', '2'],
])(
  'shows ?part=%s as desktop part %s, linked on to phone part %s and desktop part %s',
  async (param, desktop, nextPhone, nextDesktop) => {
    await show(param);

    const main = screen.getByRole('main');
    const href = (part: string) =>
      part === '1' ? '/design-kit/inputs' : `/design-kit/inputs?part=${part}`;

    expect(main.dataset.part).toBe(param);
    expect(main.dataset.desktopPart).toBe(desktop);
    expect(links().map(([, to]) => to)).toEqual([
      href(nextPhone),
      href(nextDesktop),
    ]);
    expect(screen.getByText(new RegExp(`part ${param} of 4`)).textContent).toBe(
      ` · part ${param} of 4`
    );
    expect(
      screen.getByText(new RegExp(`part ${desktop} of 2`)).textContent
    ).toBe(` · part ${desktop} of 2`);
  }
);

it.each([undefined, '9', '0', '2.5', ['2', '1']])(
  'treats the part %j as part 1',
  async part => {
    await show(part);

    expect(screen.getByRole('main').dataset.part).toBe('1');
    expect(screen.getByRole('main').dataset.desktopPart).toBe('1');
  }
);

it('gives each section one phone part and one desktop part, in the part its link names', async () => {
  const { unmount } = await show();

  const sections = screen.getAllByRole('region');
  const titlesOf = (attribute: string, part: number) =>
    sections
      .filter(section => section.getAttribute(attribute) === String(part))
      .map(section => section.getAttribute('aria-label'));

  expect(sections).toHaveLength(15);
  expect(
    [1, 2, 3, 4].flatMap(part => titlesOf('data-part', part))
  ).toHaveLength(15);
  expect(
    [1, 2].flatMap(part => titlesOf('data-desktop-part', part))
  ).toHaveLength(15);
  // Each phone part has a section, and so does each desktop part.
  expect(
    [1, 2, 3, 4].map(part => titlesOf('data-part', part).length)
  ).not.toContain(0);

  unmount();

  for (const [param, next] of [
    [undefined, 2],
    ['2', 3],
    ['3', 4],
    ['4', 1],
  ] as const) {
    const view = await show(param);

    expect(links()[0][0]).toBe(
      `Part ${next}: ${titlesOf('data-part', next).join(', ')}`
    );
    view.unmount();
  }

  await show();

  expect(links()[1][0]).toBe(
    `Part 2: ${titlesOf('data-desktop-part', 2).join(', ')}`
  );
});

// PPL-01
it('draws the page header with the back text, a header and the Avatar, twice', async () => {
  await show();

  const header = within(screen.getByRole('region', { name: 'Page header' }));
  const backs = header.getAllByRole('link');

  expect(backs.map(link => link.textContent)).toEqual(['Map', 'People']);
  expect(header.getAllByRole('button', { name: 'Account menu' })).toHaveLength(
    2
  );
  expect(
    header.getAllByText('Back to', { exact: false }).length
  ).toBeGreaterThan(0);
});

// PPL-01
it('draws the back link in four states and never disabled, as links that are only drawn', async () => {
  await show();

  const matrix = screen.getByRole('figure', { name: 'Back link states' });

  expect(
    [...matrix.querySelectorAll('.stateLabel')].map(label => label.textContent)
  ).toEqual([
    'Default',
    'Hover',
    'Focus',
    'Pressed',
    'Default',
    'Hover',
    'Focus',
    'Pressed',
  ]);
  expect(matrix.querySelectorAll('a')).toHaveLength(8);
  expect(
    [...matrix.querySelectorAll('a')].map(a => a.getAttribute('data-state'))
  ).toEqual(Array(2).fill([null, 'hover', 'focus', 'active']).flat());
  expect(matrix.querySelectorAll('.cell[inert]')).toHaveLength(8);
  expect(matrix.querySelector('figcaption')!.textContent).toMatch(
    /^Drawn by hand with the real back Icon/
  );
});

// PPL-01
it('draws the action bar with Save, then Cancel as a link, and the safe area', async () => {
  await show();

  const bar = within(screen.getByRole('region', { name: 'Action bar' }));
  const buttons = bar.getAllByRole('button');

  expect(buttons.map(button => button.textContent)).toEqual(['Save']);
  expect(bar.getByRole('link', { name: 'Cancel' }).getAttribute('href')).toBe(
    '/'
  );
  expect(bar.getByText('Bottom of the window').className).toBe('barLabel');
  expect(
    bar.getByText('Safe area of the device').parentElement!.className
  ).toBe('safeArea');
});

// PPL-01
it('draws the Button link in three forms and four states, with no disabled column', async () => {
  await show();

  const matrix = screen.getByRole('figure', { name: 'Button link states' });

  expect(
    [
      ...matrix.querySelectorAll('.row:not(.columns) > .name > :first-child'),
    ].map(name => name.textContent)
  ).toEqual(['Primary', 'Secondary', 'Primary, card']);
  expect(matrix.querySelectorAll('a[href]')).toHaveLength(12);
  expect(matrix.querySelectorAll('button')).toHaveLength(0);
  expect(matrix.textContent).not.toContain('Disabled');
  expect(
    [...matrix.querySelectorAll('a')].map(a => a.textContent).slice(0, 12)
  ).toEqual([
    ...Array(4).fill('Add a person'),
    ...Array(4).fill('Cancel'),
    ...Array(4).fill('See all people'),
  ]);
});

// PPL-01
it('draws the long text field in its five states, each with a 10,000 character limit', async () => {
  await show();

  const section = within(
    screen.getByRole('region', { name: 'Long text field' })
  );
  const areas = section.getAllByRole('textbox');

  expect(areas.map(area => area.getAttribute('maxlength'))).toEqual(
    Array(5).fill('10000')
  );
  expect(areas.map(area => area.parentElement!.dataset.state)).toEqual([
    undefined,
    'hover',
    'focus',
    undefined,
    undefined,
  ]);
  expect((areas[3] as HTMLTextAreaElement).disabled).toBe(true);
  expect((areas[4] as HTMLTextAreaElement).value.split('\n')).toHaveLength(7);
});

// PIN-04
it('draws the fuzzy date field in its six states, after the long text field', async () => {
  await show();

  const section = within(
    screen.getByRole('region', { name: 'Fuzzy date field' })
  );
  const inputs = section.getAllByRole('textbox') as HTMLInputElement[];

  expect(inputs.map(input => input.value)).toEqual([
    '',
    'BET 1850 AND 18',
    'BET 1850 AND 1855',
    '',
    '31 FEB 1850',
    '',
  ]);
  expect(inputs.map(input => input.parentElement!.dataset.state)).toEqual([
    undefined,
    'focus',
    undefined,
    'focus',
    undefined,
    undefined,
  ]);
  expect(inputs[4].getAttribute('aria-invalid')).toBe('true');
  expect(section.getByRole('alert').textContent).toBe(
    'February 1850 has 28 days.'
  );
  expect(inputs[2].closest('div')!.textContent).toContain(
    'Reads as Between 1850 and 1855'
  );
  expect(inputs[5].disabled).toBe(true);
  expect(
    screen
      .getAllByRole('region')
      .map(region => region.getAttribute('aria-label'))
      .slice(-3)
  ).toEqual(['Long text field', 'Fuzzy date field', 'Person row']);
});

// PPL-01
it('draws Person row in five forms and four states, as links that are only drawn', async () => {
  await show();

  const section = screen.getByRole('region', { name: 'Person row' });
  const rows = [...section.querySelectorAll('a')];

  expect(rows.map(row => row.dataset.state)).toEqual([
    ...Array(5).fill(undefined),
    undefined,
    'hover',
    'focus',
    'active',
  ]);
  expect(rows.every(row => row.closest('[inert]'))).toBe(true);
  expect(section.textContent).toContain(
    'née Rossouw · Matches the spelling “Dutoit”'
  );
  expect(section.textContent).toContain('Died —');
  expect(section.textContent).toContain('Died Deceased');
  expect(section.querySelector('.desktopOnly')).toBeTruthy();
});

it('puts each section in one of four phone parts and one of two desktop parts', async () => {
  await show();

  expect(
    screen
      .getAllByRole('region')
      .map(section => [
        section.getAttribute('aria-label'),
        section.getAttribute('data-part'),
        section.getAttribute('data-desktop-part'),
      ])
  ).toEqual([
    ['Buttons', '1', '1'],
    ['Text fields', '1', '1'],
    ['Chips', '2', '1'],
    ['Tabs', '3', '1'],
    ['Checkbox field', '3', '1'],
    ['Alerts', '3', '1'],
    ['Dividers', '3', '1'],
    ['Key hints', '3', '1'],
    ['Page header', '4', '2'],
    ['Back link', '4', '2'],
    ['Action bar', '4', '2'],
    ['Button as a link', '2', '2'],
    ['Long text field', '2', '2'],
    ['Fuzzy date field', '4', '2'],
    ['Person row', '4', '2'],
  ]);
});
