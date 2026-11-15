import type { ComponentProps } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { Icon } from '@ks/app/components/foundation/Icon';
import { KitLink } from '@ks/app/components/foundation/link';

import styles from '@ks/app/components/actions/ArrowLink.module.css';

/**
 * A text and the forward icon, in the link font with no underline. With `href` it is a link. Without
 * `href` it is a label, for use inside a row that is one link: it turns `--brand-pressed` while that
 * link is pressed.
 */
export const ArrowLink = ({
  children,
  href,
  state,
  ...rest
}: {
  /** A label has none. */
  href?: string;
  state?: ControlState;
} & Omit<ComponentProps<'a'>, 'className' | 'href'>) => {
  const content = (
    <>
      {children}
      <Icon name='forward' size={16} />
    </>
  );

  return href === undefined ? (
    <span className={styles.arrowLink}>{content}</span>
  ) : (
    <KitLink className={styles.link} data-state={state} href={href} {...rest}>
      {content}
    </KitLink>
  );
};
