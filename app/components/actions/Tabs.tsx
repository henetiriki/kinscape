'use client';

import type { KeyboardEvent } from 'react';

import { useRef } from 'react';

import type { Tab } from '@ks/app/components/actions/types';

import styles from '@ks/app/components/actions/Tabs.module.css';

export const Tabs = ({
  disabled,
  fill,
  label,
  onSelect,
  selected,
  tabs,
}: {
  disabled?: boolean;
  /** The tabs share the row, 44 tall (a phone sheet head). */
  fill?: boolean;
  label: string;
  onSelect?: (value: string) => void;
  selected: string;
  tabs: Tab[];
}) => {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // Left and Right select the neighbour and wrap at the ends.
  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

    if (!step) return;
    event.preventDefault();

    const next = (index + step + tabs.length) % tabs.length;

    buttons.current[next]!.focus();
    onSelect?.(tabs[next].value);
  };

  return (
    <div
      aria-label={label}
      className={fill ? `${styles.tabs} ${styles.fill}` : styles.tabs}
      role='tablist'>
      {tabs.map((tab, index) => (
        <button
          aria-controls={tab.controls}
          aria-label={
            tab.count ? `${tab.label}, ${tab.count} active` : undefined
          }
          aria-selected={tab.value === selected}
          className={styles.tab}
          data-state={tab.state}
          disabled={disabled}
          key={tab.value}
          onClick={() => onSelect?.(tab.value)}
          onKeyDown={event => onKeyDown(event, index)}
          ref={node => {
            buttons.current[index] = node;
          }}
          role='tab'
          tabIndex={tab.value === selected ? 0 : -1}
          type='button'>
          {tab.label}
          {tab.count ? (
            <span aria-hidden='true' className={styles.count}>
              {tab.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
};
