import { type ReactNode, useId } from 'react';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import styles from './NoticeCard.module.css';
import { ProgressBar } from './ProgressBar';

type Action = { label: string; onClick?: () => void };

/**
 * Says what is going on in one line and offers at most two ways out. It never takes focus.
 * With `progress` (0 to 100) it is the loading form and announces politely.
 */
export const NoticeCard = ({
  actions,
  children,
  icon,
  phone,
  progress,
  size,
  title,
}: {
  /** Up to two buttons; the first is primary. */
  actions?: [Action, Action] | [Action];
  /** The one line. */
  children: ReactNode;
  icon?: IconName;
  /** The kit's phone sample: 358 wide with 44 buttons. */
  phone?: boolean;
  progress?: number;
  /** `large`: the icon on top, an H3 title, 380 wide. */
  size?: 'large';
  title: string;
}) => {
  const titleId = useId();
  const loading = progress !== undefined;

  return (
    <div
      aria-live={loading ? 'polite' : undefined}
      className={styles.card}
      data-icon={icon}
      data-phone={phone || undefined}
      data-progress={loading || undefined}
      data-size={size}
      role='status'>
      <div className={styles.head}>
        {icon && (
          <span className={styles.icon}>
            <Icon name={icon} size={size === 'large' ? 28 : 20} />
          </span>
        )}
        <div className={styles.text}>
          <span className={styles.title} id={titleId}>
            {title}
          </span>
          {loading && <ProgressBar labelledBy={titleId} value={progress} />}
          <span className={styles.line}>{children}</span>
        </div>
      </div>
      {actions && (
        <div className={styles.actions}>
          {actions.map(({ label, onClick }, i) => (
            <Button
              key={label}
              onClick={onClick}
              size='s'
              variant={i === 0 ? 'primary' : 'secondary'}>
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
