import type { ComponentProps } from 'react';

import { Button } from './Button';

type Props = Omit<
  ComponentProps<typeof Button>,
  'children' | 'icon' | 'label' | 'variant'
>;

/** Play through time: a pill with the word, or `round` with the icon alone. Both are named "Play through time". */
export const PlayButton = ({ round, ...rest }: Props) =>
  round ? (
    <Button
      icon='play'
      label='Play through time'
      round
      variant='primary'
      {...rest}
    />
  ) : (
    <Button icon='play' label='Play through time' variant='primary' {...rest}>
      Play
    </Button>
  );
