import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RelationshipSaveResult } from '@ks/features/people/components/types';
import type { RelationshipGroup } from '@ks/lib/domain/relationships/types';

import { alertCodes } from '@ks/features/people/components/relationship-messages';
import { RelationshipDetails } from '@ks/features/people/components/RelationshipDetails';
import { fuzzyDateOf } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { parsePersonId, parseRelationshipId } from '@ks/lib/domain/ids/ids.mts';

const refresh = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const SELF = '01900000-0000-7000-8000-000000000001';
const OTHER = '01900000-0000-7000-8000-000000000002';
const RELATIONSHIP = '01900000-0000-7000-9000-000000000001';

const other = {
  born: '1878',
  bornReading: 'In 1878',
  deceased: true,
  died: '1951',
  diedReading: 'In 1951',
  givenNames: 'Hendrik Willem',
  id: OTHER,
  surname: 'du Toit',
};

const saved = (): RelationshipSaveResult => ({
  ok: true,
  value: {
    childId: parsePersonId(SELF)!,
    id: parseRelationshipId(RELATIONSHIP)!,
    parentId: parsePersonId(OTHER)!,
    subtype: 'biological',
    type: 'parent',
    version: 1,
  },
});

const parent = {
  childId: parsePersonId(SELF)!,
  id: parseRelationshipId(RELATIONSHIP)!,
  parentId: parsePersonId(OTHER)!,
  subtype: 'step' as const,
  type: 'parent' as const,
  version: 3,
};

const spouse = {
  divorce: fuzzyDateOf('EXACT', '1890'),
  id: parseRelationshipId(RELATIONSHIP)!,
  marriage: fuzzyDateOf('EXACT', '1875'),
  personAId: parsePersonId(SELF)!,
  personBId: parsePersonId(OTHER)!,
  type: 'spouse' as const,
  version: 2,
};

type Props = Partial<Parameters<typeof RelationshipDetails>[0]>;

/** The dialog with stub actions; `props` changes any prop. */
const open = (
  props: Props & { create?: () => Promise<unknown> } = {},
  group: RelationshipGroup = 'parents'
) => {
  const create = vi.fn(props.create ?? (async () => saved()));
  const update = vi.fn(async () => saved());
  const onClose = vi.fn();
  const onBack = vi.fn();

  render(
    <RelationshipDetails
      actions={{
        create: create as never,
        update: update as never,
      }}
      group={group}
      onBack={onBack}
      onClose={onClose}
      open
      other={other}
      self={SELF}
      {...props}
    />
  );

  return { create, onBack, onClose, update };
};

const save = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

beforeEach(() => {
  vi.clearAllMocks();
});

// PPL-02
describe('the add dialog', () => {
  it.each([
    ['parents', 'Add a parent', 'Type of parent'],
    ['children', 'Add a child', 'Type of child'],
  ] as const)(
    'titles %s as %s and labels the type %s',
    (group, title, label) => {
      open({}, group);

      screen.getByRole('heading', { name: title });
      screen.getByText('Step 2 of 2. Say how they are linked.');
      screen.getByRole('radiogroup', { name: label });
      expect(screen.getByRole('radio', { name: 'Biological' })).toHaveProperty(
        'checked',
        true
      );
    }
  );

  it('shows the other Person with the dates', () => {
    open();

    screen.getByText('du Toit, Hendrik Willem');
    screen.getByText('1878 – 1951');
  });

  it('titles a spouse "Add a spouse" and shows both date fields, with their helpers', () => {
    open({}, 'spouses');

    screen.getByRole('heading', { name: 'Add a spouse' });
    screen.getByLabelText('Marriage');
    screen.getByLabelText('Divorce');
    screen.getByText('Leave it empty if they did not divorce.');
    screen.getByText('For example 1850, ABT 1850 or BET 1850 AND 1855.');
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('starts the marriage with the text of a screen board', () => {
    open({ startMarriage: 'ABT 1875' }, 'spouses');

    expect(screen.getByLabelText('Marriage')).toHaveProperty(
      'value',
      'ABT 1875'
    );
    screen.getByText('About 1875');
  });

  it('saves a parent: the other Person is the parent, and the dialog then closes with no toast', async () => {
    const { create, onClose } = open();

    fireEvent.click(screen.getByRole('radio', { name: 'Adoptive' }));
    save();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith({
      childId: SELF,
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      parentId: OTHER,
      subtype: 'adoptive',
      type: 'parent',
    });
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('saves a child: the other Person is the child', async () => {
    const { create, onClose } = open({}, 'children');

    save();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ childId: OTHER, parentId: SELF })
    );
  });

  it('saves a spouse with the dates as typed', async () => {
    const { create, onClose } = open({}, 'spouses');

    fireEvent.input(screen.getByLabelText('Marriage'), {
      target: { value: '1875' },
    });
    fireEvent.input(screen.getByLabelText('Divorce'), {
      target: { value: '1890' },
    });
    save();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith({
      divorce: '1890',
      id: expect.any(String),
      marriage: '1875',
      personAId: SELF,
      personBId: OTHER,
      type: 'spouse',
    });
  });

  it('shows "Back", and it runs onBack', () => {
    const { onBack } = open();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });

  it('disables "Save" while the action runs', async () => {
    let finish: (result: RelationshipSaveResult) => void = () => {};

    open({
      create: () =>
        new Promise<RelationshipSaveResult>(resolve => {
          finish = resolve;
        }),
    });
    save();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty(
        'disabled',
        true
      )
    );
    finish(saved());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty(
        'disabled',
        false
      )
    );
  });
});

// PPL-02
describe('an edit', () => {
  it('fills the type of a parent, names the version, and has "Cancel" and no "Back"', async () => {
    const { onClose, update } = open(
      { existing: parent, onBack: undefined },
      'parents'
    );

    screen.getByRole('heading', { name: 'Edit parent' });
    screen.getByText('Change the type.');
    expect(screen.getByRole('radio', { name: 'Step' })).toHaveProperty(
      'checked',
      true
    );
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Adoptive' }));
    save();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith({
      relationship: {
        childId: SELF,
        id: RELATIONSHIP,
        parentId: OTHER,
        subtype: 'adoptive',
        type: 'parent',
      },
      version: 3,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('titles the edit of a child', () => {
    open(
      { existing: { ...parent, parentId: parsePersonId(SELF)! } },
      'children'
    );

    screen.getByRole('heading', { name: 'Edit child' });
  });

  it('fills the dates of a spouse and saves a changed divorce', async () => {
    const { onClose, update } = open(
      { existing: spouse, onBack: undefined },
      'spouses'
    );

    screen.getByRole('heading', { name: 'Edit marriage' });
    screen.getByText('Change the dates.');
    expect(screen.getByLabelText('Marriage')).toHaveProperty('value', '1875');
    expect(screen.getByLabelText('Divorce')).toHaveProperty('value', '1890');

    fireEvent.input(screen.getByLabelText('Divorce'), {
      target: { value: '' },
    });
    save();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith({
      relationship: {
        divorce: '',
        id: RELATIONSHIP,
        marriage: '1875',
        personAId: SELF,
        personBId: OTHER,
        type: 'spouse',
      },
      version: 2,
    });
  });

  it('starts a spouse with no dates as empty fields', () => {
    open(
      { existing: { ...spouse, divorce: undefined, marriage: undefined } },
      'spouses'
    );

    expect(screen.getByLabelText('Marriage')).toHaveProperty('value', '');
    expect(screen.getByLabelText('Divorce')).toHaveProperty('value', '');
  });
});

// PPL-02
describe('a refusal or an error', () => {
  const refused = (error: string) => ({
    create: async () => ({ error, ok: false }),
  });

  it.each(alertCodes)(
    'shows the alert of %s, keeps the dialog open and saves nothing more',
    async code => {
      const { onClose } = open(refused(code));

      save();

      const alert = await screen.findByRole('alert');

      expect(alert.textContent).not.toBe('');
      expect(alert.textContent).not.toContain("Couldn't save the link");
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    }
  );

  it('names the other Person in the cycle line', async () => {
    open(refused('cycle'));
    save();

    await screen.findByText("This link isn't possible");
    screen.getByText(
      'This would make Hendrik Willem du Toit their own ancestor.'
    );
  });

  it('shows "Reload" for a conflict, and it reads the page again', async () => {
    open(refused('conflict'));
    save();

    await screen.findByText('This link changed while you were editing');
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('shows "Go to People" for a link that is gone', async () => {
    open(refused('not-found'));
    save();

    await screen.findByText('This person or link no longer exists');

    expect(
      screen.getByRole('link', { name: 'Go to People' }).getAttribute('href')
    ).toBe('/people');
  });

  it('shows the alert of a divorce before the marriage, and calls no action', async () => {
    const { create, onClose } = open({}, 'spouses');

    fireEvent.input(screen.getByLabelText('Marriage'), {
      target: { value: '1890' },
    });
    fireEvent.input(screen.getByLabelText('Divorce'), {
      target: { value: '1875' },
    });
    save();

    await screen.findByText('The divorce is before the marriage');
    screen.getByText('Nothing was saved. Change one of the dates.');
    expect(create).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clears an alert at the next save', async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({ error: 'duplicate', ok: false })
      .mockResolvedValueOnce(saved());
    const { onClose } = open({ create });

    save();
    await screen.findByText('These people are already linked');
    save();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

// PPL-02
describe('any other failure', () => {
  it('shows the error toast for `invalid`, with "Try again" that repeats the same create', async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({ error: 'invalid', ok: false })
      .mockResolvedValueOnce(saved());
    const { onClose } = open({ create });

    save();
    await screen.findByText(
      "Couldn't save the link. Your picks are still here."
    );
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].id).toBe(create.mock.calls[0][0].id);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the error toast when the action throws', async () => {
    const { onClose } = open({
      create: async () => {
        throw new Error('offline');
      },
    });

    save();

    await screen.findByText(
      "Couldn't save the link. Your picks are still here."
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows the error toast for a date that does not read, and calls no action', async () => {
    const { create } = open({}, 'spouses');

    fireEvent.input(screen.getByLabelText('Marriage'), {
      target: { value: 'soon' },
    });
    save();

    await screen.findByText(
      "Couldn't save the link. Your picks are still here."
    );
    expect(create).not.toHaveBeenCalled();
  });
});

// PPL-02
describe('the screen boards', () => {
  it.each(['cycle', 'conflict'] as const)(
    'start with the alert of %s',
    code => {
      open({ shown: code });

      screen.getByRole('alert');
    }
  );

  it('starts with the toast when `shown` is "failed"', () => {
    open({ shown: 'failed' });

    screen.getByRole('button', { name: 'Try again' });
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });
});
