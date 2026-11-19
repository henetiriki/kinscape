import type { ReactNode } from 'react';

import type { Tab } from '@ks/app/components/actions/types';

import { Tabs } from '@ks/app/components/actions/Tabs';

import styles from '@ks/features/map/components/Panel.module.css';

/** The map's side panel: a tabs head and a body that scrolls. The body ends with the `end` node. */
export const Panel = ({
  bodyId,
  children,
  end,
  gap = 14,
  label,
  onSelect,
  selected,
  tabs,
}: {
  /** The id the tabs' `controls` point to. */
  bodyId?: string;
  children: ReactNode;
  /** The legend, or "Clear filters". It sits at the end of the body, after the children. */
  end?: ReactNode;
  /** Space between the body's groups, as the tab draws it. */
  gap?: 14 | 20;
  label: string;
  onSelect?: (value: string) => void;
  selected: string;
  tabs: Tab[];
}) => (
  <aside aria-label={label} className={styles.panel}>
    <div className={styles.head}>
      <Tabs
        fill
        label={`${label} sections`}
        onSelect={onSelect}
        selected={selected}
        tabs={tabs}
      />
    </div>
    <div
      className={styles.body}
      data-gap={gap}
      id={bodyId}
      role='tabpanel'
      tabIndex={0}>
      {children}
      {end && <div className={styles.end}>{end}</div>}
    </div>
  </aside>
);
