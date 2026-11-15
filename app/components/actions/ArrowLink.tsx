import type { ComponentProps, ReactNode } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { Icon } from '@ks/app/components/foundation/Icon';
import { KitLink } from '@ks/app/components/foundation/link';

import styles from '@ks/app/components/actions/ArrowLink.module.css';

/** With `href` it is a link and takes the attributes of one. Without it, it is a label and takes none. */
type ArrowLinkForm =
  | ({
      [Name in keyof LinkAttributes]?: never;
    } & { children?: ReactNode; href?: undefined; state?: undefined })
  | ({
      children?: ReactNode;
      href: string;
      state?: ControlState;
    } & LinkAttributes);

type LinkAttributes = Omit<
  ComponentProps<'a'>,
  'children' | 'className' | 'href' | 'key'
>;

/**
 * A text and the forward icon, in the link font with no underline. With `href` it is a link. Without
 * `href` it is a label, for use inside a row that is one link: it turns `--brand-pressed` while that
 * link is pressed.
 */
export const ArrowLink = (props: ArrowLinkForm) => {
  if (props.href === undefined) {
    return (
      <span className={styles.arrowLink}>
        {props.children}
        <Icon name='forward' size={16} />
      </span>
    );
  }

  const { children, href, state, ...rest } = props;

  return (
    <KitLink className={styles.link} data-state={state} href={href} {...rest}>
      {children}
      <Icon name='forward' size={16} />
    </KitLink>
  );
};
