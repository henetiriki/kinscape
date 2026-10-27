import type { ReactNode } from 'react';

import type { FilledIconName } from '@ks/app/components/foundation/types';

import { FilledIcon } from '@ks/app/components/foundation/Icon';

import styles from '@ks/app/components/feedback/Alert.module.css';

/** A problem or note about one part of the screen. An error is announced at once; the rest politely. */
export const Alert = ({
  aside,
  children,
  title,
  tone,
}: {
  /** A note at the right of the title line. */
  aside?: ReactNode;
  children: ReactNode;
  title?: string;
  tone: FilledIconName;
}) => (
  <div
    className={`${styles.alert} ${styles[tone]}`}
    role={tone === 'error' ? 'alert' : 'status'}>
    <FilledIcon name={tone} />
    <span className={styles.body}>
      {title && (
        <span className={styles.titleRow}>
          <span className={styles.title}>{title}</span>
          {aside}
        </span>
      )}
      <span className={styles.line}>{children}</span>
    </span>
  </div>
);
