import type { ComponentProps } from 'react';

import { Button } from '@ks/app/components/actions/Button';

type Props = Omit<
  Extract<ComponentProps<typeof Button>, { href?: undefined }>,
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
