import { Icon, type IconName } from './Icon';
import styles from './Toast.module.css';

/** A problem with the app that doesn't stop the map, with one action. */
export const Banner = ({
  action,
  children,
  icon,
  onAction,
}: {
  action: string;
  children: string;
  icon: IconName;
  onAction?: () => void;
}) => (
  <div className={`${styles.shape} ${styles.banner}`} role='alert'>
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
