import type { ReactNode } from 'react';

import type { Column } from '@ks/app/components/layout/types';

import { ActionBar } from '@ks/app/components/actions/ActionBar';

import styles from '@ks/app/components/layout/ColumnLayout.module.css';

/**
 * The frame of a page with one centred column: a header, a main area that scrolls and an optional
 * action bar. `column` sets the width, gap and padding of the column: `list`, `detail`, `form`,
 * `notice` (a notice 120px under the header) or `phone-notice` (a notice 64px under it).
 * `actions` are the buttons of the bar.
 */
export const ColumnLayout = ({
  actions,
  children,
  column,
  header,
}: {
  actions?: ReactNode;
  children: ReactNode;
  column: Column;
  header: ReactNode;
}) => (
  <div className={styles.page} data-column={column} data-testid='column-frame'>
    {header}
    <main className={styles.main}>
      <div className={styles.content}>{children}</div>
    </main>
    {actions && <ActionBar>{actions}</ActionBar>}
  </div>
);
