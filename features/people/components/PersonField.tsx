'use client';

import type { KeyboardEvent, ReactNode, RefObject } from 'react';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { ControlState } from '@ks/app/components/foundation/types';
import type { PersonSummary } from '@ks/lib/domain/persons/types';

import { PickerRow } from '@ks/app/components/actions/PickerRow';
import { TextField } from '@ks/app/components/forms/TextField';
import { Text } from '@ks/app/components/foundation/Text';
import { datesOf } from '@ks/features/people/components/dates';
import { findPeople } from '@ks/lib/domain/persons/list.mts';

import styles from '@ks/features/people/components/PersonField.module.css';

const VISIBLE_ROWS = 3;

/** The text of a picked Person. */
const nameOf = ({ givenNames, surname }: PersonSummary) =>
  `${givenNames} ${surname}`;

/** The id of the row of a Person, as `PersonField` names it in `aria-activedescendant`. */
const rowId = (list: string, person: PersonSummary) => `${list}-${person.id}`;

type ListProps = {
  /** The id of the row with the focus look: `id`, a hyphen and the Person's id. */
  activeId?: string;
  id: string;
  onPick: (person: PersonSummary) => void;
  /** The viewport point of the list's top left corner. */
  place?: { left: number; top: number };
  /** The text that the user typed. The no-match notice quotes it. */
  query: string;
  /** Each match, with the spelling variant that matched. */
  rows: Rows;
};

type Rows = { person: PersonSummary; variant?: string }[];

const useListLayout = (
  listRef: RefObject<HTMLDivElement | null>,
  rows: Rows,
  activeId?: string
) => {
  // A row with a note is taller than one without, so the list measures its first three rows.
  useLayoutEffect(() => {
    const list = listRef.current!;
    const height = [...list.children]
      .slice(0, rows.length === 0 ? 0 : VISIBLE_ROWS)
      .reduce((sum, row) => sum + (row as HTMLElement).offsetHeight, 0);

    list.style.maxHeight =
      height > 0 ? `calc(${height}px + 2 * var(--space-inset-2xs))` : '';
  }, [listRef, rows]);

  // Keep the active row inside the list's view.
  useLayoutEffect(() => {
    const list = listRef.current!;
    const row = list.querySelector<HTMLElement>('[aria-selected="true"]');

    if (!row) return;

    const { offsetHeight, offsetTop } = row;

    list.scrollTop = Math.min(
      Math.max(list.scrollTop, offsetTop + offsetHeight - list.clientHeight),
      offsetTop
    );
  }, [activeId, listRef]);
};

const Options = ({
  activeId,
  id,
  onPick,
  rows,
}: Pick<ListProps, 'activeId' | 'id' | 'onPick' | 'rows'>) =>
  rows.map(({ person, variant }) => {
    const optionId = rowId(id, person);

    return (
      <div
        aria-selected={optionId === activeId}
        className={styles.item}
        id={optionId}
        key={person.id}
        role='option'>
        <PickerRow
          {...datesOf(person)}
          givenNames={person.givenNames}
          maidenName={person.maidenName}
          matchedVariant={variant}
          onClick={() => onPick(person)}
          state={optionId === activeId ? 'focus' : undefined}
          surname={person.surname}
          tabIndex={-1}
        />
      </div>
    );
  });

const NoMatch = ({ query }: { query: string }) => (
  <>
    <Text variant='title'>No one matches “{query.trim()}”</Text>
    <Text variant='small'>
      Check the spelling, or add the person to the Tree first.
    </Text>
  </>
);

/**
 * The list of a `PersonField`: a row for each match, or the no-match notice. It shows three rows
 * and scrolls past them. With `place` it is fixed at that point; without it, it sits in the flow.
 */
export const PersonFieldList = ({
  activeId,
  id,
  onPick,
  place,
  query,
  rows,
}: ListProps) => {
  const list = useRef<HTMLDivElement>(null);

  useListLayout(list, rows, activeId);

  return (
    <div
      aria-label='People'
      className={styles.list}
      data-empty={rows.length === 0 || undefined}
      data-fixed={place ? true : undefined}
      id={id}
      // A press on the list keeps the focus in the text box.
      onMouseDown={event => event.preventDefault()}
      ref={list}
      role='listbox'
      style={place}
      tabIndex={-1}>
      {rows.length === 0 ? (
        <NoMatch query={query} />
      ) : (
        <Options activeId={activeId} id={id} onPick={onPick} rows={rows} />
      )}
    </div>
  );
};

type PersonFieldArgs = {
  /** A Person to start with, picked. */
  defaultPerson?: PersonSummary;
  /** The problem, shown under the field. The field is also required. */
  error?: ReactNode;
  /** Called with the Person that a pick chose, and with `undefined` when the user types after a pick. */
  onChange: (person: PersonSummary | undefined) => void;
  /** Every Person of the Tree. The caller gives no empty list. */
  people: PersonSummary[];
  state?: ControlState;
};

type Place = { left: number; top: number };

// The list sits 4px under the field box, on its left edge, and follows the box on resize. A scroll
// outside the field and the list closes it (the input scrolls its own text to the caret), so it never floats away from a field that scrolled out of its panel.
// It is placed before the first paint, so it never shows in the flow.
const usePlace = (
  wrap: RefObject<HTMLDivElement | null>,
  listId: string,
  open: boolean,
  setOpen: (open: boolean) => void
) => {
  const [place, setPlace] = useState<Place>();

  useLayoutEffect(() => {
    if (!open) return;

    const follow = () => {
      const box = wrap.current!.querySelector('input')!.parentElement!;
      const { bottom, left } = box.getBoundingClientRect();

      setPlace({ left, top: bottom + 4 });
    };
    const closeOnScroll = (event: Event) => {
      const target = event.target as Node;

      if (
        wrap.current!.contains(target) ||
        document.getElementById(listId)!.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    follow();
    window.addEventListener('resize', follow);
    window.addEventListener('scroll', closeOnScroll, true);

    return () => {
      window.removeEventListener('resize', follow);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [listId, open, setOpen, wrap]);

  return place;
};

// A press outside the field and the list closes the list.
const useCloseOutside = (
  wrap: RefObject<HTMLDivElement | null>,
  listId: string,
  open: boolean,
  setOpen: (open: boolean) => void
) => {
  useEffect(() => {
    if (!open) return;

    const close = (event: MouseEvent) => {
      if (
        !wrap.current!.contains(event.target as Node) &&
        !document.getElementById(listId)!.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', close);

    return () => document.removeEventListener('mousedown', close);
  }, [listId, open, setOpen, wrap]);
};

type KeyContext = {
  activeRow?: Rows[number];
  move: (step: -1 | 1) => void;
  open: boolean;
  pick: (person: PersonSummary) => void;
  rows: Rows;
  setOpen: (open: boolean) => void;
};

const handleKey = (
  event: KeyboardEvent<HTMLInputElement>,
  { activeRow, move, open, pick, rows, setOpen }: KeyContext
) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (rows.length > 0) move(event.key === 'ArrowDown' ? 1 : -1);
    else setOpen(true);
  } else if (event.key === 'Enter' && activeRow) {
    // In a form, Enter would also submit.
    event.preventDefault();
    pick(activeRow.person);
  } else if (event.key === 'Escape' && open) {
    // The panel that holds the field stays open: a native listener on `document` reads
    // `defaultPrevented`, and `stopPropagation` does not stop a listener on the same node.
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
  }
};

const usePersonPick = (
  {
    defaultPerson,
    onChange,
    people,
  }: Pick<PersonFieldArgs, 'defaultPerson' | 'onChange' | 'people'>,
  wrap: RefObject<HTMLDivElement | null>
) => {
  const id = useId();
  const listId = `${id}-list`;
  const [text, setText] = useState(defaultPerson ? nameOf(defaultPerson) : '');
  const [picked, setPicked] = useState(defaultPerson);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rows = findPeople(people, text).map(({ match, person }) => ({
    person,
    variant: match.variant,
  }));
  const activeRow = open ? rows[active] : undefined;
  const place = usePlace(wrap, listId, open, setOpen);

  useCloseOutside(wrap, listId, open, setOpen);

  const pick = (person: PersonSummary) => {
    setText(nameOf(person));
    setPicked(person);
    setOpen(false);
    onChange(person);
  };
  const move = (step: -1 | 1) => {
    setOpen(true);
    // On a closed list, Down starts at the first row and Up at the last.
    const from = open && active >= 0 ? active : step === 1 ? -1 : 0;

    setActive((from + step + rows.length) % rows.length);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    handleKey(event, { activeRow, move, open, pick, rows, setOpen });
  const onType = (value: string) => {
    setText(value);
    setActive(-1);
    setOpen(true);
    if (picked) {
      setPicked(undefined);
      onChange(undefined);
    }
  };

  return {
    activeRow,
    listId,
    onKeyDown,
    onType,
    open,
    pick,
    place,
    rows,
    setOpen,
    text,
  };
};

/**
 * A text field that picks one Person (PIN-01). When the user types, the field filters the Persons
 * as the People list does, and a list of at most three rows opens under the field. The focus stays
 * in the text box: Down and Up move the active row, Enter picks it and Esc closes the list. When
 * the user types after a pick, the pick clears.
 */
export const PersonField = ({
  defaultPerson,
  error,
  onChange,
  people,
  state,
}: PersonFieldArgs) => {
  const wrap = useRef<HTMLDivElement>(null);
  const f = usePersonPick({ defaultPerson, onChange, people }, wrap);
  const activeId = f.activeRow
    ? rowId(f.listId, f.activeRow.person)
    : undefined;

  return (
    <div ref={wrap}>
      <TextField
        aria-activedescendant={activeId}
        aria-autocomplete='list'
        aria-controls={f.open ? f.listId : undefined}
        aria-expanded={f.open}
        aria-haspopup='listbox'
        aria-required='true'
        autoComplete='off'
        error={error}
        label='Person'
        onBlur={() => f.setOpen(false)}
        onChange={event => f.onType(event.target.value)}
        onKeyDown={f.onKeyDown}
        role='combobox'
        spellCheck={false}
        state={state}
        value={f.text}
      />
      {f.open &&
        createPortal(
          <PersonFieldList
            activeId={activeId}
            id={f.listId}
            onPick={f.pick}
            place={f.place}
            query={f.text}
            rows={f.rows}
          />,
          document.body
        )}
    </div>
  );
};
