import type { ReactNode } from 'react';

import styles from '@ks/app/components/feedback/Callout.module.css';

/** The error box of one control; the control points at it with `aria-describedby={id}`. */
export const Callout = ({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id: string;
}) => (
  <div
    className={className ? `${styles.callout} ${className}` : styles.callout}
    id={id}
    role='alert'>
    {children}
  </div>
);

/** Decoration, never read: a square turned 45°. The caller sets `bottom` and `left` on `className`. */
export const CalloutPointer = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={className ? `${styles.pointer} ${className}` : styles.pointer}
  />
);
