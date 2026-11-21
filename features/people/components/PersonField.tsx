'use client';

import type { KeyboardEvent, ReactNode } from 'react';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

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
}: {
  /** The id of the row with the focus look: `id`, a hyphen and the Person's id. */
  activeId?: string;
  id: string;
  onPick: (person: PersonSummary) => void;
  /** The viewport point of the list's top left corner. */
  place?: { left: number; top: number };
  /** The text that the user typed. The no-match notice quotes it. */
  query: string;
  /** Each match, with the spelling variant that matched. */
  rows: { person: PersonSummary; variant?: string }[];
}) => {
  const list = useRef<HTMLDivElement>(null);

  // A row with a note is taller than one without, so the list measures its first three rows.
  useLayoutEffect(() => {
    const height = [...list.current!.children]
      .slice(0, rows.length === 0 ? 0 : VISIBLE_ROWS)
      .reduce((sum, row) => sum + (row as HTMLElement).offsetHeight, 0);

    list.current!.style.maxHeight =
      height > 0 ? `calc(${height}px + 2 * var(--space-4))` : '';
  }, [rows]);

  // Keep the active row inside the list's view.
  useLayoutEffect(() => {
    const row = list.current!.querySelector<HTMLElement>(
      '[aria-selected="true"]'
    );

    if (!row) return;

    const { offsetHeight, offsetTop } = row;

    list.current!.scrollTop = Math.min(
      Math.max(
        list.current!.scrollTop,
        offsetTop + offsetHeight - list.current!.clientHeight
      ),
      offsetTop
    );
  }, [activeId]);

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
        <>
          <Text variant='title'>No one matches “{query.trim()}”</Text>
          <Text variant='small'>
            Check the spelling, or add the person to the Tree first.
          </Text>
        </>
      ) : (
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
        })
      )}
    </div>
  );
};

/**
 * A text field that picks one Person (PIN-01). Typing filters the Persons as the People list does,
 * and a list of at most three rows opens under the field. The focus stays in the text box: Down and
 * Up move the active row, Enter picks it and Esc closes the list. Typing after a pick clears it.
 */
export const PersonField = ({
  defaultPerson,
  error,
  onChange,
  people,
  state,
}: {
  /** A Person to start with, picked. */
  defaultPerson?: PersonSummary;
  /** The problem, shown under the field. The field is also required. */
  error?: ReactNode;
  /** Called with the Person that a pick chose, and with `undefined` when typing clears the pick. */
  onChange: (person: PersonSummary | undefined) => void;
  /** Every Person of the Tree. The caller gives no empty list. */
  people: PersonSummary[];
  state?: ControlState;
}) => {
  const id = useId();
  const listId = `${id}-list`;
  const wrap = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(defaultPerson ? nameOf(defaultPerson) : '');
  const [picked, setPicked] = useState(defaultPerson);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState<{ left: number; top: number }>();
  const rows = findPeople(people, text).map(({ match, person }) => ({
    person,
    variant: match.variant,
  }));
  const activeRow = open ? rows[active] : undefined;

  // The list sits 4px under the field box, on its left edge, and follows the box on scroll and resize.
  // It is placed before the first paint, so it never shows in the flow.
  useLayoutEffect(() => {
    if (!open) return;

    const follow = () => {
      const box = wrap.current!.querySelector('input')!.parentElement!;
      const { bottom, left } = box.getBoundingClientRect();

      setPlace({ left, top: bottom + 4 });
    };

    follow();
    window.addEventListener('resize', follow);
    window.addEventListener('scroll', follow, true);

    return () => {
      window.removeEventListener('resize', follow);
      window.removeEventListener('scroll', follow, true);
    };
  }, [open]);

  // A press outside the field and the list closes the list.
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
  }, [listId, open]);

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
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (rows.length > 0) move(event.key === 'ArrowDown' ? 1 : -1);
      else setOpen(true);
    } else if (event.key === 'Enter' && activeRow) {
      // In a form, Enter would also submit.
      event.preventDefault();
      pick(activeRow.person);
    } else if (event.key === 'Escape' && open) {
      // The panel that holds the field stays open.
      event.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div ref={wrap}>
      <TextField
        aria-activedescendant={
          activeRow ? rowId(listId, activeRow.person) : undefined
        }
        aria-autocomplete='list'
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        aria-haspopup='listbox'
        aria-required='true'
        autoComplete='off'
        error={error}
        label='Person'
        onBlur={() => setOpen(false)}
        onChange={event => {
          setText(event.target.value);
          setActive(-1);
          setOpen(true);
          if (picked) {
            setPicked(undefined);
            onChange(undefined);
          }
        }}
        onKeyDown={onKeyDown}
        role='combobox'
        spellCheck={false}
        state={state}
        value={text}
      />
      {open && (
        <PersonFieldList
          activeId={activeRow ? rowId(listId, activeRow.person) : undefined}
          id={listId}
          onPick={pick}
          place={place}
          query={text}
          rows={rows}
        />
      )}
    </div>
  );
};
