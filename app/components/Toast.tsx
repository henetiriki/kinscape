'use client';

import { useEffect } from 'react';

import rawTokens from '../../design/tokens.json';
import { Icon } from './Icon';
import styles from './Toast.module.css';

const SUCCESS_MS = Number.parseInt(rawTokens.motion.toast, 10);

/**
 * The result of an action. A success toast asks to be removed after 4 seconds; an error stays until Esc,
 * its action, or the owner calls `onDismiss`. The owner removes the toast.
 */
export const Toast = ({
  action,
  children,
  onAction,
  onDismiss,
  tone,
}: {
  action?: string;
  children: string;
  onAction?: () => void;
  onDismiss?: () => void;
  tone: 'error' | 'success';
}) => {
  useEffect(() => {
    if (tone !== 'success' || !onDismiss) return;

    const timer = setTimeout(onDismiss, SUCCESS_MS);

    return () => clearTimeout(timer);
  }, [onDismiss, tone]);

  return (
    <div
      className={`${styles.shape} ${styles.toast} ${styles[tone]}`}
      onKeyDown={event => {
        if (event.key === 'Escape') onDismiss?.();
      }}
      role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={tone} />
      <span className={styles.message}>{children}</span>
      {action && (
        <button
          className={styles.action}
          onClick={() => {
            onAction?.();
            onDismiss?.();
          }}
          type='button'>
          {action}
        </button>
      )}
    </div>
  );
};
