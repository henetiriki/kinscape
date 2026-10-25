import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Button } from '@/app/components/actions/Button';
import { IconButton } from '@/app/components/actions/IconButton';

// NFR-06
it('is a secondary button that does not submit a form unless asked', () => {
  render(<Button>Copy chain</Button>);

  const button = screen.getByRole('button', { name: 'Copy chain' });

  expect(button.className).toBe('btn btnSecondary');
  expect(button.getAttribute('type')).toBe('button');
});

it('is primary on request, shows a given state and can be disabled', () => {
  render(
    <Button disabled state='hover' variant='primary'>
      Sign in
    </Button>
  );

  const button = screen.getByRole('button', {
    name: 'Sign in',
  }) as HTMLButtonElement;

  expect(button.className).toContain('btnPrimary');
  expect(button.dataset.state).toBe('hover');
  expect(button.disabled).toBe(true);
});

it('sets the height, width, shape and icon of a button from its props', () => {
  render(
    <>
      <Button full icon='copy' size='xs'>
        Copy chain
      </Button>
      <Button icon='play' round size='l' variant='primary'>
        Play
      </Button>
    </>
  );

  const xs = screen.getByRole('button', { name: 'Copy chain' });
  const play = screen.getByRole('button', { name: 'Play' });

  expect(xs.dataset.size).toBe('xs');
  expect(xs.dataset.full).toBe('true');
  expect(xs.dataset.iconOnly).toBeUndefined();
  expect(xs.querySelector('svg')!.getAttribute('width')).toBe('14');
  expect(play.dataset.round).toBe('true');
  expect(play.querySelector('svg')!.getAttribute('width')).toBe('20');
});

it('names an icon-only button, and the type check rejects one without a name', () => {
  render(
    <Button icon='play' label='Play through time' round variant='primary' />
  );

  const button = screen.getByRole('button', { name: 'Play through time' });

  expect(button.dataset.iconOnly).toBe('true');
  expect(button.textContent).toBe('');

  // @ts-expect-error An icon-only Button needs a label (NFR-06).
  render(<Button icon='play' />);
});

it('names an icon button and passes clicks on', () => {
  const onClick = vi.fn();

  render(
    <IconButton label='Zoom in' onClick={onClick}>
      +
    </IconButton>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  expect(onClick).toHaveBeenCalledOnce();
});
