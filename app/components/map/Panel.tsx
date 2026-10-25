import type { ReactNode } from 'react';

import { type Tab, Tabs } from '@/app/components/actions/Tabs';

import styles from './Panel.module.css';

/** The map's side panel: a tabs head, a body that scrolls, and a footer at the bottom. */
export const Panel = ({
  bodyId,
  children,
  footer,
  gap = 14,
  label,
  onSelect,
  selected,
  tabs,
}: {
  /** The id the tabs' `controls` point to. */
  bodyId?: string;
  children: ReactNode;
  /** The legend, or "Clear filters". */
  footer?: ReactNode;
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
    </div>
    {footer && <div className={styles.footer}>{footer}</div>}
  </aside>
);
