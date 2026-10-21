'use client';

import type { ControlState } from './controls';

import styles from './Tabs.module.css';

export type Tab = { label: string; state?: ControlState; value: string };

export const Tabs = ({
  disabled,
  label,
  onSelect,
  selected,
  tabs,
}: {
  disabled?: boolean;
  label: string;
  onSelect?: (value: string) => void;
  selected: string;
  tabs: Tab[];
}) => (
  <div aria-label={label} className={styles.tabs} role='tablist'>
    {tabs.map(tab => (
      <button
        aria-selected={tab.value === selected}
        className={styles.tab}
        data-state={tab.state}
        disabled={disabled}
        key={tab.value}
        onClick={() => onSelect?.(tab.value)}
        role='tab'
        type='button'>
        {tab.label}
      </button>
    ))}
  </div>
);
