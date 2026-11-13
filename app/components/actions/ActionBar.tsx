import type { ReactNode } from 'react';

import styles from '@ks/app/components/actions/ActionBar.module.css';

/**
 * The bar fixed to the bottom of the window, with the page's buttons as children: a primary, then a secondary.
 * Save is `type='submit'` with a `form` attribute, because the bar sits outside the page's form.
 * It draws a spacer of its own height, so the end of the page is not behind it.
 */
export const ActionBar = ({ children }: { children: ReactNode }) => (
  <div className={styles.wrap}>
    <div aria-hidden='true' className={styles.spacer} data-spacer />
    <div className={styles.bar}>
      <div className={styles.inner}>{children}</div>
    </div>
  </div>
);
