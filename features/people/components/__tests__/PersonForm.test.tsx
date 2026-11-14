import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SaveResult } from '@ks/features/people/components/types.ts';
import type { PersonView } from '@ks/lib/domain/persons/types.ts';

import { PersonForm } from '@ks/features/people/components/PersonForm';
import { SavedToast } from '@ks/features/people/components/SavedToast';
import { parseFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { parsePersonId } from '@ks/lib/domain/ids/ids.mts';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => nav }));

const ID = '01900000-0000-7000-8000-0000000000a1';

const date = (text: string) => {
  const parsed = parseFuzzyDate(text);

  return parsed.ok ? parsed.value : undefined;
};

const saved: PersonView = {
  birth: date('ABT 1856'),
  death: date('14 MAR 1930'),
  deceased: true,
  givenNames: 'Maria Magdalena',
  id: parsePersonId(ID)!,
  living: false,
  maidenName: 'Rossouw',
  notes: 'A note.',
  sex: 'F',
  surname: 'du Toit',
  variants: ['Du Toit', 'Dutoit'],
  version: 3,
};

const ok = (person: PersonView = saved): SaveResult => ({
  ok: true,
  value: person,
});

const open = (
  props: Partial<Parameters<typeof PersonForm>[0]> = {},
  stub: SaveResult = ok()
) => {
  const create = vi.fn(() => Promise.resolve(stub));
  const update = vi.fn(() => Promise.resolve(stub));

  render(
    <SavedToast>
      <PersonForm
        create={create}
        email='a@example.test'
        initial='A'
        onSignOut={() => Promise.resolve()}
        update={update}
        {...props}
      />
    </SavedToast>
  );

  return { create, update };
};

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const save = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  });
};

const fill = () => {
  type('Given names', 'Ana');
  type('Surname', 'Smit');
};

beforeEach(() => {
  nav.push.mockClear();
  nav.refresh.mockClear();
});

// PPL-01
describe('a new Person', () => {
  it('shows the title, the hint, the helpers and Unknown', () => {
    open();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Add a person' })
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Given names and surname are required. Everything else can wait.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Surname at birth, if it changed.')).toBeTruthy();
    expect(
      screen.getByText('For example 1850, ABT 1850 or BET 1850 AND 1855.')
    ).toBeTruthy();
    expect(screen.getByText("Leave it empty if you don't know.")).toBeTruthy();
    expect(
      screen.getByText(
        'Other spellings in the records, up to 20. Press Enter after each.'
      )
    ).toBeTruthy();
    expect((screen.getByLabelText('Sex') as HTMLSelectElement).value).toBe('U');
    expect(
      screen
        .getAllByRole('textbox')
        .filter(box => box.getAttribute('aria-required') === 'true')
        .map(box => box.id)
    ).toHaveLength(2);
  });

  it('creates with the typed values, tells the toast and goes to the list', async () => {
    const { create, update } = open();

    fill();
    type('Maiden name', 'Botha');
    type('Sex', 'F');
    fireEvent.input(screen.getByLabelText('Birth'), {
      target: { value: 'ABT 1850' },
    });
    type('Notes', 'Note');
    fireEvent.change(screen.getByLabelText('Spelling variants'), {
      target: { value: 'Smith' },
    });
    fireEvent.keyDown(screen.getByLabelText('Spelling variants'), {
      key: 'Enter',
    });
    await save();

    expect(update).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({
      birth: 'ABT 1850',
      death: '',
      deceased: false,
      givenNames: 'Ana',
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      maidenName: 'Botha',
      notes: 'Note',
      sex: 'F',
      surname: 'Smit',
      variants: ['Smith'],
    });
    expect(nav.push).toHaveBeenCalledWith('/people');
    expect(screen.getByRole('status').textContent).toBe(
      'Saved Maria Magdalena du Toit.'
    );
  });

  it('repeats the same id when Try again sends the create again', async () => {
    const sent: string[] = [];
    const create = vi.fn((input: unknown): Promise<SaveResult> => {
      sent.push((input as { id: string }).id);

      return sent.length === 1
        ? Promise.reject(new Error('offline'))
        : Promise.resolve(ok());
    });

    open({ create });
    fill();
    await save();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });

    expect(sent).toHaveLength(2);
    expect(sent[1]).toBe(sent[0]);
    expect(nav.push).toHaveBeenCalledWith('/people');
  });
});

// PPL-01
describe('validation', () => {
  it('shows a name error on leaving an edited field, not an untouched one', () => {
    open();

    fireEvent.blur(screen.getByLabelText('Given names'));
    expect(screen.queryByText('Enter the given names.')).toBeNull();

    type('Given names', 'A');
    type('Given names', '  ');
    fireEvent.blur(screen.getByLabelText('Given names'));
    expect(screen.getByText('Enter the given names.')).toBeTruthy();
    expect(
      screen.getByLabelText('Given names').getAttribute('aria-invalid')
    ).toBe('true');

    type('Given names', 'Ana');
    expect(screen.queryByText('Enter the given names.')).toBeNull();
  });

  it('keeps a name without an error when it has text on blur', () => {
    open();
    type('Surname', 'Smit');
    fireEvent.blur(screen.getByLabelText('Surname'));

    expect(screen.queryByText('Enter the surname.')).toBeNull();
  });

  it('saves nothing for blank names, and the alert counts the errors', async () => {
    const { create } = open();

    await save();

    expect(create).not.toHaveBeenCalled();
    expect(screen.getByText('Enter the given names.')).toBeTruthy();
    expect(screen.getByText('Enter the surname.')).toBeTruthy();
    expect(screen.getByText('2 fields need fixing')).toBeTruthy();
    expect(
      screen.getByText(
        'Nothing was saved. Each problem is marked at its field.'
      )
    ).toBeTruthy();
  });

  it('says "1 field needs fixing" for one error', async () => {
    open();
    type('Given names', 'Ana');
    await save();

    expect(screen.getByText('1 field needs fixing')).toBeTruthy();
  });

  it('saves nothing for a birth of 31 FEB 1850 and shows its message', async () => {
    const { create } = open();

    fill();
    fireEvent.input(screen.getByLabelText('Birth'), {
      target: { value: '31 FEB 1850' },
    });
    fireEvent.blur(screen.getByLabelText('Birth'));
    await save();

    expect(create).not.toHaveBeenCalled();
    expect(screen.getAllByText('February 1850 has 28 days.')).toHaveLength(1);
    expect(screen.getByText('1 field needs fixing')).toBeTruthy();
  });

  it('shows the message of a bad birth that never lost focus when Save checks it', async () => {
    const { create } = open();

    fill();
    fireEvent.input(screen.getByLabelText('Birth'), {
      target: { value: '31 FEB 1850' },
    });
    await save();

    expect(create).not.toHaveBeenCalled();
    expect(screen.getAllByText('February 1850 has 28 days.')).toHaveLength(1);
    expect(screen.getByLabelText('Birth').getAttribute('aria-invalid')).toBe(
      'true'
    );
  });

  it('shows the message of a bad death that never lost focus when Save checks it', async () => {
    const { create } = open();

    fill();
    fireEvent.input(screen.getByLabelText('Death'), {
      target: { value: '31 FEB 1850' },
    });
    await save();

    expect(create).not.toHaveBeenCalled();
    expect(screen.getAllByText('February 1850 has 28 days.')).toHaveLength(1);
    expect(screen.getByLabelText('Death').getAttribute('aria-invalid')).toBe(
      'true'
    );
  });

  it('shows 21 spelling variants as an error with aria-invalid', async () => {
    const { update } = open({
      person: {
        ...saved,
        variants: Array.from({ length: 21 }, (_, i) => `v${i}`),
      },
    });

    await save();

    expect(update).not.toHaveBeenCalled();
    expect(screen.getByText('Use at most 20 spellings.')).toBeTruthy();
    expect(
      screen.getByLabelText('Spelling variants').getAttribute('aria-invalid')
    ).toBe('true');
  });
});

// PPL-01
describe('Deceased', () => {
  it('is ticked and disabled while the death has text', () => {
    open();

    const box = screen.getByLabelText('Deceased') as HTMLInputElement;

    expect(box.checked).toBe(false);
    expect(
      screen.getByText("Tick if this person has died but the date isn't known.")
    ).toBeTruthy();

    fireEvent.input(screen.getByLabelText('Death'), {
      target: { value: '1930' },
    });
    expect(box.checked).toBe(true);
    expect(box.disabled).toBe(true);
    expect(
      screen.getByText('Ticked because a death date is entered.')
    ).toBeTruthy();

    fireEvent.input(screen.getByLabelText('Death'), { target: { value: '' } });
    expect(box.checked).toBe(false);
    expect(box.disabled).toBe(false);
  });

  it('saves a box the user ticked', async () => {
    const { create } = open();

    fill();
    fireEvent.click(screen.getByLabelText('Deceased'));
    await save();

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ deceased: true })
    );
  });
});

// PPL-01
describe('an existing Person', () => {
  it('shows the title and the saved values', () => {
    open({ person: saved });

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Edit Maria Magdalena du Toit',
      })
    ).toBeTruthy();
    expect(
      (screen.getByLabelText('Given names') as HTMLInputElement).value
    ).toBe('Maria Magdalena');
    expect((screen.getByLabelText('Birth') as HTMLInputElement).value).toBe(
      'ABT 1856'
    );
    expect((screen.getByLabelText('Sex') as HTMLSelectElement).value).toBe('F');
    expect(screen.getByRole('button', { name: 'Remove Dutoit' })).toBeTruthy();
    expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).value).toBe(
      'A note.'
    );
  });

  it('updates with the version it read', async () => {
    const { create, update } = open({ person: saved });

    type('Surname', 'Smit');
    await save();

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      person: expect.objectContaining({ id: ID, surname: 'Smit' }),
      version: 3,
    });
    expect(nav.push).toHaveBeenCalledWith('/people');
  });

  it('shows the conflict state, saves nothing more, and Reload refreshes', async () => {
    open({ person: saved }, { error: 'conflict', ok: false });

    await save();

    expect(
      screen.getByText('This person changed while you were editing')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Nothing was saved. Reload to see the latest version, then make your changes again.'
      )
    ).toBeTruthy();
    expect(nav.push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(nav.refresh).toHaveBeenCalledOnce();
  });
});

// PPL-01
describe('a failed save', () => {
  it.each([
    ['not-found', { error: 'not-found', ok: false } as const],
    ['invalid', { error: 'invalid', ok: false } as const],
  ])('shows the toast and keeps every value for %s', async (_kind, stub) => {
    open({}, stub);
    fill();
    await save();

    expect(
      screen.getByText("Couldn't save. Your changes are still here.")
    ).toBeTruthy();
    expect((screen.getByLabelText('Surname') as HTMLInputElement).value).toBe(
      'Smit'
    );
    expect(nav.push).not.toHaveBeenCalled();
  });

  it('shows the toast, and sends nothing, for an input the form cannot name a field for', async () => {
    const { create } = open();

    fill();
    fireEvent.change(screen.getByLabelText('Spelling variants'), {
      target: { value: 'x'.repeat(201) },
    });
    fireEvent.keyDown(screen.getByLabelText('Spelling variants'), {
      key: 'Enter',
    });
    await save();

    expect(create).not.toHaveBeenCalled();
    expect(
      screen.getByText("Couldn't save. Your changes are still here.")
    ).toBeTruthy();
  });

  it('shows the toast when the action throws, and Esc dismisses it', async () => {
    open({ create: () => Promise.reject(new Error('offline')) });
    fill();
    await save();

    const toast = screen.getByText(
      "Couldn't save. Your changes are still here."
    );

    fireEvent.keyDown(toast, { key: 'Escape' });
    expect(
      screen.queryByText("Couldn't save. Your changes are still here.")
    ).toBeNull();
  });

  it('shows a field error that the server gives', async () => {
    open({}, { error: { fields: { surname: 'required' } }, ok: false });
    fill();
    await save();

    expect(screen.getByText('Enter the surname.')).toBeTruthy();
    expect(screen.getByText('1 field needs fixing')).toBeTruthy();
  });
});

// PPL-01
describe('leaving', () => {
  it('links Cancel and the back link to the list with no prompt', () => {
    open();
    fill();

    expect(
      screen.getByRole('link', { name: 'Cancel' }).getAttribute('href')
    ).toBe('/people');
    expect(
      screen.getByRole('link', { name: 'People' }).getAttribute('href')
    ).toBe('/people');
  });
});
