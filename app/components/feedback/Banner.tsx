import type { IconName } from '@/app/components/foundation/types';

import { Icon } from '@/app/components/foundation/Icon';

import styles from './Toast.module.css';

/** A problem with the app that doesn't stop the map, with one action. */
export const Banner = ({
  action,
  children,
  icon,
  onAction,
  placed,
}: {
  action: string;
  children: string;
  icon: IconName;
  onAction?: () => void;
  /** Fix it at its phone position, under the search bar. */
  placed?: boolean;
}) => (
  <div
    className={`${styles.shape} ${styles.banner}`}
    data-placed={placed ? '' : undefined}
    role='alert'>
    <Icon name={icon} />
    <span className={styles.message}>{children}</span>
    <button
      className={`${styles.action} ${styles.bannerAction}`}
      onClick={onAction}
      type='button'>
      {action}
    </button>
  </div>
);
