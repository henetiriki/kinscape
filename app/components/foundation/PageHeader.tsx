import type { ReactNode } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { Icon } from '@ks/app/components/foundation/Icon';
import { Wordmark } from '@ks/app/components/foundation/Wordmark';

import styles from '@ks/app/components/foundation/PageHeader.module.css';

/** The 44px link back to the page above, with the back icon. It is an anchor, not `next/link`. */
export const BackLink = ({
  href,
  label,
  state,
}: {
  href: string;
  label: string;
  state?: ControlState;
}) => (
  <a className={styles.back} data-state={state} href={href}>
    <Icon name='back' size={16} />
    {label}
  </a>
);

/**
 * The bar at the top of a page: the Wordmark, a divider, the back link and the Avatar at the right.
 * The page passes the Avatar in and decides what it opens. A phone shows the icon-only Wordmark.
 */
export const PageHeader = ({
  avatar,
  backHref,
  backLabel,
}: {
  avatar?: ReactNode;
  backHref: string;
  backLabel: string;
}) => (
  <header className={styles.header}>
    <span className={styles.full}>
      <Wordmark size={32} />
    </span>
    <span className={styles.icon}>
      <Wordmark iconOnly size={32} />
    </span>
    <span aria-hidden='true' className={styles.divider} />
    <BackLink href={backHref} label={backLabel} />
    <span className={styles.grow} />
    {avatar}
  </header>
);
