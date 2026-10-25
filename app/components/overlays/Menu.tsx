'use client';

import {
  type KeyboardEvent,
  type Ref,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { ControlState } from '@/app/components/foundation/controls';

import { Avatar } from '@/app/components/map/Avatar';
import { Icon, type IconName } from '@/app/components/foundation/Icon';
import styles from './Menu.module.css';
import { Surface } from '@/app/components/foundation/Surface';

export type MenuEntry = {
  detail?: string;
  /** Stays in the arrow-key order but does nothing. */
  disabled?: boolean;
  icon: IconName;
  id: string;
  label: string;
};

/** One row: an icon and a label, with a second line if `detail` is set. A look when `state` is. */
export const MenuItem = ({
  entry,
  onSelect,
  state,
}: {
  entry: MenuEntry;
  onSelect?: (id: string) => void;
  state?: ControlState;
}) => (
  <button
    aria-disabled={entry.disabled || undefined}
    className={styles.item}
    data-detail={entry.detail ? '' : undefined}
    data-state={state}
    onClick={() => {
      if (!entry.disabled) {
        onSelect?.(entry.id);
      }
    }}
    role='menuitem'
    tabIndex={-1}
    type='button'>
    <Icon name={entry.icon} />
    <span className={styles.text}>
      <span className={styles.label}>{entry.label}</span>
      {entry.detail && <span className={styles.detail}>{entry.detail}</span>}
    </span>
  </button>
);

type PanelProps = {
  email: string;
  footer: string;
  groups: MenuEntry[][];
  /** The item drawn hovered. */
  hovered?: string;
  /** Only drawn: out of the tab order and the accessibility tree. */
  inert?: boolean;
  menuRef?: Ref<HTMLDivElement>;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onSelect?: (id: string) => void;
};

/** The account Menu's card: who is signed in, the item groups split by dividers, and a footer line. */
export const MenuPanel = ({
  email,
  footer,
  groups,
  hovered,
  inert,
  menuRef,
  onKeyDown,
  onSelect,
}: PanelProps) => (
  <Surface className={styles.panel} level='floating'>
    <div inert={inert}>
      <div className={styles.header}>
        <span className={styles.caption}>Signed in as</span>
        <span className={styles.label}>{email}</span>
      </div>
      <hr className={styles.divider} />
      {/* The items are the tab stop; the menu only moves focus between them. */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div aria-label='Account' onKeyDown={onKeyDown} ref={menuRef} role='menu'>
        {groups.map((group, index) => (
          <div key={group[0].id} role='none'>
            {index > 0 && <hr className={styles.divider} />}
            {group.map(entry => (
              <MenuItem
                entry={entry}
                key={entry.id}
                onSelect={onSelect}
                state={entry.id === hovered ? 'hover' : undefined}
              />
            ))}
          </div>
        ))}
      </div>
      <span className={`${styles.caption} ${styles.footer}`}>{footer}</span>
    </div>
  </Surface>
);

type MenuProps = Pick<PanelProps, 'email' | 'footer' | 'groups'> & {
  initial: string;
  /** Called after the menu has closed and the Avatar has focus. */
  onSelect: (id: string) => void;
};

/** The Avatar and its Menu, 8 below it and right-aligned. */
export const Menu = ({ initial, onSelect, ...panel }: MenuProps) => {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const avatar = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const items = () => [
    ...menu.current!.querySelectorAll<HTMLElement>('[role=menuitem]'),
  ];

  // Opening focuses the first item.
  useEffect(() => {
    if (open) {
      items()[0].focus();
    }
  }, [open]);

  // A pointer outside closes the menu.
  useEffect(() => {
    if (!open) {
      return;
    }

    const close = (event: PointerEvent) => {
      if (!anchor.current!.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', close);

    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const closeToAvatar = () => {
    avatar.current!.focus();
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);

    if (event.key === 'Escape') {
      // Innermost first: a Dialog around the menu keeps its own Esc for the next press.
      event.preventDefault();
      event.stopPropagation();
      closeToAvatar();
    } else if (event.key === 'Tab') {
      setOpen(false);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      list[
        (at + (event.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length
      ].focus();
    }
  };

  return (
    <div className={styles.anchor} ref={anchor}>
      <Avatar
        expanded={open}
        initial={initial}
        onClick={() => setOpen(!open)}
        ref={avatar}
      />
      {open && (
        <div className={styles.drop}>
          <MenuPanel
            {...panel}
            menuRef={menu}
            onKeyDown={onKeyDown}
            onSelect={id => {
              closeToAvatar();
              onSelect(id);
            }}
          />
        </div>
      )}
    </div>
  );
};
