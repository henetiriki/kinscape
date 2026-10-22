import type { ReactNode } from 'react';

import styles from './Alert.module.css';
import { FilledIcon, type FilledIconName } from './Icon';

/** A problem or note about one part of the screen. An error is announced at once; the rest politely. */
export const Alert = ({
  children,
  title,
  tone,
}: {
  children: ReactNode;
  title: string;
  tone: FilledIconName;
}) => (
  <div
    className={`${styles.alert} ${styles[tone]}`}
    role={tone === 'error' ? 'alert' : 'status'}>
    <FilledIcon name={tone} />
    <span className={styles.body}>
      <span className={styles.title}>{title}</span>
      <span className={styles.line}>{children}</span>
    </span>
  </div>
);
