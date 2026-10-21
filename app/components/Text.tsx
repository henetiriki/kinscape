import type { ComponentProps } from 'react';

import styles from './Text.module.css';

export type TextVariant = Heading | Other;
type Heading = 'display' | 'h1' | 'h2' | 'h3';
type Other =
  | 'body'
  | 'bodyL'
  | 'button'
  | 'caption'
  | 'label'
  | 'mono'
  | 'monoL'
  | 'overline'
  | 'small'
  | 'title';

type Tag =
  'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'p' | 'span';

// Body text is a paragraph; every other style that isn't a heading is inline.
const DEFAULT_TAG: Record<Other, Tag> = {
  body: 'p',
  bodyL: 'p',
  button: 'span',
  caption: 'span',
  label: 'span',
  mono: 'span',
  monoL: 'span',
  overline: 'span',
  small: 'span',
  title: 'span',
};

type Props = ({ as: Tag; variant: Heading } | { as?: Tag; variant: Other }) &
  Omit<ComponentProps<'span'>, 'className' | 'ref'>;

export const Text = ({ as, variant, ...rest }: Props) => {
  const Element = as ?? DEFAULT_TAG[variant as Other];

  return <Element className={styles[variant]} {...rest} />;
};
