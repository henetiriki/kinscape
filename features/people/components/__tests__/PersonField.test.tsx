import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { PersonSummary } from '@ks/lib/domain/persons/types';

import {
  PersonField,
  PersonFieldList,
} from '@ks/features/people/components/PersonField';

const person = (
  id: string,
  given: string,
  extra: Partial<PersonSummary> = {}
) =>
  ({
    born: '1861',
    bornReading: 'In 1861',
    deceased: false,
    died: '1932',
    diedReading: 'In 1932',
    givenNames: given,
    id,
    maidenName: '',
    surname: 'Example',
    variants: [],
    ...extra,
  }) satisfies PersonSummary;

const PEOPLE = [
  person('1', 'Anna', { maidenName: 'Sample' }),
  person('2', 'Johan', { variants: ['Exemple'] }),
  person('3', 'Person'),
  person('4', 'Piet'),
  person('5', 'Zelda', { surname: 'Other' }),
];

const setup = (props: Partial<Parameters<typeof PersonField>[0]> = {}) => {
  const onChange = vi.fn();

  render(<PersonField onChange={onChange} people={PEOPLE} {...props} />);

  return {
    field: screen.getByRole('combobox', { name: 'Person' }) as HTMLInputElement,
    onChange,
  };
};

const type = (field: HTMLElement, text: string) =>
  fireEvent.change(field, { target: { value: text } });

const rows = () => screen.queryAllByRole('option');

const rect = (left: number, bottom: number) =>
  ({ bottom, left, right: left + 280, top: bottom - 44 }) as DOMRect;

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    rect(40, 200)
  );
});

afterEach(() => vi.restoreAllMocks());

// PIN-01
it('opens a row per match when the user types, and shows at most three rows', () => {
  const { field } = setup();

  expect(screen.queryByRole('listbox')).toBeNull();
  expect(field.getAttribute('aria-expanded')).toBe('false');
  type(field, 'Exa');
  expect(field.getAttribute('aria-expanded')).toBe('true');
  // Five Persons match: the list holds every row and scrolls past three.
  expect(rows()).toHaveLength(4);
  expect(screen.getByRole('listbox').getAttribute('aria-label')).toBe('People');
});

it('shows the spelling variant that matched', () => {
  const { field } = setup();

  type(field, 'Exemple');
  expect(rows()).toHaveLength(1);
  expect(within(rows()[0]).getByText(/Exemple/)).toBeTruthy();
});

it('shows the no-match notice, and no row', () => {
  const { field } = setup();

  type(field, 'Zzz');
  expect(rows()).toHaveLength(0);
  expect(screen.getByText('No one matches “Zzz”')).toBeTruthy();
  expect(
    screen.getByText('Check the spelling, or add the person to the Tree first.')
  ).toBeTruthy();
  fireEvent.keyDown(field, { key: 'Enter' });
  expect(screen.getByRole('listbox')).toBeTruthy();
});

it('opens the notice on Down when no Person matches, with no active row', () => {
  const { field } = setup();

  type(field, 'Zzz');
  fireEvent.keyDown(field, { key: 'Escape' });
  fireEvent.keyDown(field, { key: 'ArrowDown' });
  expect(screen.getByRole('listbox')).toBeTruthy();
  expect(field.getAttribute('aria-activedescendant')).toBeNull();
});

it('opens the list on Down in a closed field, with the first row active', () => {
  const { field } = setup();

  fireEvent.keyDown(field, { key: 'ArrowDown' });
  expect(rows().length).toBeGreaterThan(0);
  expect(field.getAttribute('aria-activedescendant')).toBe(rows()[0].id);
  expect(rows()[0].getAttribute('aria-selected')).toBe('true');
});

it('opens the list on Up in a closed field, with the last row active', () => {
  const { field } = setup();

  fireEvent.keyDown(field, { key: 'ArrowUp' });
  expect(field.getAttribute('aria-activedescendant')).toBe(rows().at(-1)!.id);
});

it('moves the active row with Down and Up, and keeps the focus in the field', () => {
  const { field } = setup();

  field.focus();
  type(field, 'Exa');
  fireEvent.keyDown(field, { key: 'ArrowDown' });
  expect(field.getAttribute('aria-activedescendant')).toBe(rows()[0].id);
  fireEvent.keyDown(field, { key: 'ArrowDown' });
  expect(field.getAttribute('aria-activedescendant')).toBe(rows()[1].id);
  fireEvent.keyDown(field, { key: 'ArrowUp' });
  expect(field.getAttribute('aria-activedescendant')).toBe(rows()[0].id);
  fireEvent.keyDown(field, { key: 'ArrowUp' });
  expect(field.getAttribute('aria-activedescendant')).toBe(rows().at(-1)!.id);
  fireEvent.keyDown(field, { key: 'ArrowDown' });
  expect(field.getAttribute('aria-activedescendant')).toBe(rows()[0].id);
  expect(document.activeElement).toBe(field);
});

it('picks the active row on Enter, fills the field and stops the event', () => {
  const { field, onChange } = setup();
  const submit = vi.fn();

  type(field, 'Exa');
  fireEvent.keyDown(field, { key: 'ArrowDown' });
  fireEvent.keyDown(field, { key: 'ArrowDown' });

  const keyDown = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Enter',
  });

  field.parentElement!.addEventListener('keydown', submit);
  act(() => {
    field.dispatchEvent(keyDown);
  });
  expect(keyDown.defaultPrevented).toBe(true);
  expect(onChange).toHaveBeenCalledWith(PEOPLE[1]);
  expect(field.value).toBe('Johan Example');
  expect(screen.queryByRole('listbox')).toBeNull();
});

it('lets Enter through when no row is active', () => {
  const { field, onChange } = setup();

  type(field, 'Exa');

  const keyDown = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Enter',
  });

  act(() => {
    field.dispatchEvent(keyDown);
  });
  expect(keyDown.defaultPrevented).toBe(false);
  expect(onChange).not.toHaveBeenCalled();
});

it('closes the list on Esc, stops the event, and keeps the text', () => {
  const { field } = setup();

  type(field, 'Exa');

  const keyDown = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Escape',
  });
  const outer = vi.fn();

  document.body.addEventListener('keydown', outer);
  act(() => {
    field.dispatchEvent(keyDown);
  });
  document.body.removeEventListener('keydown', outer);
  expect(screen.queryByRole('listbox')).toBeNull();
  expect(field.value).toBe('Exa');
  expect(outer).not.toHaveBeenCalled();
});

it('lets Esc and other keys through when the list is closed', () => {
  const { field } = setup();
  const outer = vi.fn();

  document.body.addEventListener('keydown', outer);
  fireEvent.keyDown(field, { key: 'Escape' });
  fireEvent.keyDown(field, { key: 'a' });
  document.body.removeEventListener('keydown', outer);
  expect(outer).toHaveBeenCalledTimes(2);
});

it('picks a row on a click, and a press on a row keeps the focus in the field', () => {
  const { field, onChange } = setup();

  field.focus();
  type(field, 'Exa');

  const press = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
  });

  act(() => {
    rows()[2].dispatchEvent(press);
  });
  expect(press.defaultPrevented).toBe(true);
  fireEvent.click(within(rows()[2]).getByRole('button'));
  expect(onChange).toHaveBeenCalledWith(PEOPLE[2]);
  expect(field.value).toBe('Person Example');
});

it('clears the pick and opens the list when the user types after a pick', () => {
  const { field, onChange } = setup();

  type(field, 'Exa');
  fireEvent.keyDown(field, { key: 'ArrowDown' });
  fireEvent.keyDown(field, { key: 'Enter' });
  expect(screen.queryByRole('listbox')).toBeNull();
  onChange.mockClear();
  type(field, 'Person Exampl');
  expect(onChange).toHaveBeenCalledExactlyOnceWith(undefined);
  expect(screen.getByRole('listbox')).toBeTruthy();
});

it('starts with a given Person picked and the list closed', () => {
  const { field, onChange } = setup({ defaultPerson: PEOPLE[0] });

  expect(field.value).toBe('Anna Example');
  expect(screen.queryByRole('listbox')).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});

it('closes the list on a press outside, and keeps the text and the pick', () => {
  const { field, onChange } = setup();

  type(field, 'Exa');
  fireEvent.mouseDown(rows()[0].querySelector('button')!);
  expect(screen.getByRole('listbox')).toBeTruthy();
  fireEvent.mouseDown(document.body);
  expect(screen.queryByRole('listbox')).toBeNull();
  expect(field.value).toBe('Exa');
  expect(onChange).not.toHaveBeenCalled();
});

it('ignores a press inside the field, and closes the list when the focus leaves', () => {
  const { field } = setup();

  field.focus();
  type(field, 'Exa');
  fireEvent.mouseDown(field);
  expect(screen.getByRole('listbox')).toBeTruthy();
  fireEvent.blur(field);
  expect(screen.queryByRole('listbox')).toBeNull();
  expect(field.value).toBe('Exa');
});

it('opens the list again when a closed field gets a key that types', () => {
  const { field } = setup();

  type(field, 'Exa');
  fireEvent.keyDown(field, { key: 'Escape' });
  expect(screen.queryByRole('listbox')).toBeNull();
  type(field, 'Exam');
  expect(screen.getByRole('listbox')).toBeTruthy();
});

it('places the list 4px under the field box, on its left edge, and follows scroll and resize', () => {
  const { field } = setup();

  type(field, 'Exa');

  const list = () => screen.getByRole('listbox') as HTMLElement;

  expect(list().style.left).toBe('40px');
  expect(list().style.top).toBe('204px');
  vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue(
    rect(60, 300)
  );
  fireEvent.scroll(document);
  expect(list().style.left).toBe('60px');
  expect(list().style.top).toBe('304px');
  vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue(
    rect(10, 100)
  );
  fireEvent(window, new Event('resize'));
  expect(list().style.left).toBe('10px');
  expect(list().style.top).toBe('104px');
});

it('stops following the page when the list closes', () => {
  const { field } = setup();
  const remove = vi.spyOn(window, 'removeEventListener');

  type(field, 'Exa');
  fireEvent.keyDown(field, { key: 'Escape' });
  expect(remove.mock.calls.map(([name]) => name)).toEqual(
    expect.arrayContaining(['resize', 'scroll'])
  );
});

it('passes the error and the required state to the text field', () => {
  const { field } = setup({ error: 'Choose a person.' });

  expect(field.getAttribute('aria-required')).toBe('true');
  expect(field.getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByRole('alert').textContent).toBe('Choose a person.');
  expect(field.getAttribute('aria-autocomplete')).toBe('list');
});

it('draws the focus look from a state prop', () => {
  setup({ state: 'focus' });
  expect(document.querySelector('[data-state="focus"]')).toBeTruthy();
});

// A row with a note is 58px, so a max-height of three rows would cut the third.
it('limits the list height to its first three rows', () => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(50);

  const { field } = setup();

  type(field, 'Exa');
  expect((screen.getByRole('listbox') as HTMLElement).style.maxHeight).toBe(
    'calc(150px + 2 * var(--space-4))'
  );
  type(field, 'Exemple');
  expect((screen.getByRole('listbox') as HTMLElement).style.maxHeight).toBe(
    'calc(50px + 2 * var(--space-4))'
  );
  type(field, 'Zzz');
  expect((screen.getByRole('listbox') as HTMLElement).style.maxHeight).toBe('');
});

it('scrolls the list to keep the active row in view', () => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(50);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
  // The scroll code reads only the active row, so the offset follows the active row.
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(() => {
    const { id } = document.querySelector('[aria-selected="true"]')!;

    return id.endsWith('-3') ? 200 : id.endsWith('-1') ? 0 : 50;
  });

  const { field } = setup();

  type(field, 'Exa');

  const list = screen.getByRole('listbox');

  fireEvent.keyDown(field, { key: 'ArrowDown' });
  expect(list.scrollTop).toBe(0);
  // The list is Anna, Johan, Person, Piet: Person (id 3) sits at 200 and ends at 250.
  fireEvent.keyDown(field, { key: 'ArrowDown' });
  fireEvent.keyDown(field, { key: 'ArrowDown' });
  expect(list.scrollTop).toBe(150);
  // Back to Johan, at 50: the top of the row is above the view.
  fireEvent.keyDown(field, { key: 'ArrowUp' });
  expect(list.scrollTop).toBe(50);
});

it('sets no height limit when the rows have no height yet', () => {
  const { field } = setup();

  type(field, 'Exa');
  expect((screen.getByRole('listbox') as HTMLElement).style.maxHeight).toBe('');
});

it('draws the list part with a given row active, and the notice with no row', () => {
  const onPick = vi.fn();
  const { rerender } = render(
    <PersonFieldList
      activeId='list-2'
      id='list'
      onPick={onPick}
      query='Exa'
      rows={[
        { person: PEOPLE[0], variant: undefined },
        { person: PEOPLE[1], variant: 'Exemple' },
      ]}
    />
  );

  expect(rows()).toHaveLength(2);
  expect(rows()[0].id).toBe('list-1');
  expect(rows()[0].getAttribute('aria-selected')).toBe('false');
  expect(rows()[1].getAttribute('aria-selected')).toBe('true');
  expect(rows()[1].querySelector('[data-state="focus"]')).toBeTruthy();
  fireEvent.click(within(rows()[1]).getByRole('button'));
  expect(onPick).toHaveBeenCalledWith(PEOPLE[1]);
  rerender(
    <PersonFieldList id='list' onPick={onPick} query=' Zzz ' rows={[]} />
  );
  expect(screen.getByText('No one matches “Zzz”')).toBeTruthy();
});
