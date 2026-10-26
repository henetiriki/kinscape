import type { ComponentProps } from 'react';

import type { Heading, Other, Tone } from './types';

import styles from './Text.module.css';

type Tag =
  'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'p' | 'span';

// Body text is a paragraph; every other style that isn't a heading is inline.
const DEFAULT_TAG: Record<Other, Tag> = {
  body: 'p',
  bodyL: 'p',
  button: 'span',
  buttonS: 'span',
  caption: 'span',
  chip: 'span',
  chipOff: 'span',
  control: 'span',
  credits: 'span',
  h1Phone: 'span',
  label: 'span',
  link: 'span',
  linkS: 'span',
  mono: 'span',
  monoL: 'span',
  overline: 'span',
  small: 'span',
  title: 'span',
};

type Props = {
  /** For `as='label'`. */
  htmlFor?: string;
  /** The colour of a message; the style's own colour without it. */
  tone?: Tone;
} & ({ as: Tag; variant: Heading } | { as?: Tag; variant: Other }) &
  Omit<ComponentProps<'span'>, 'className' | 'ref'>;

export const Text = ({ as, tone, variant, ...rest }: Props) => {
  const Element = as ?? DEFAULT_TAG[variant as Other];

  return (
    <Element
      className={tone ? `${styles[variant]} ${styles[tone]}` : styles[variant]}
      {...rest}
    />
  );
};
