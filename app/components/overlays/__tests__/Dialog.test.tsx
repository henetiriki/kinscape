import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';

import { Dialog, DialogPanel } from '@ks/app/components/overlays/Dialog';

const setup = window.matchMedia;

afterEach(() => {
  window.matchMedia = setup;
});

/** A phone query the test can flip. */
const mockMedia = (matches: boolean) => {
  let listener = () => {};
  const remove = vi.fn();

  const query = {
    addEventListener: (_: string, next: () => void) => {
      listener = next;
    },
    matches,
    removeEventListener: remove,
  };

  window.matchMedia = (() => query) as unknown as typeof window.matchMedia;

  return {
    flip: (next: boolean) => {
      query.matches = next;
      act(() => listener());
    },
    remove,
  };
};

const renderDialog = (props: Partial<Parameters<typeof Dialog>[0]> = {}) =>
  render(
    <Dialog
      footnote='Foot'
      onClose={vi.fn()}
      open
      subtitle='Sub'
      title='Example'
      {...props}>
      <p>Body</p>
    </Dialog>
  );

const dialog = () => screen.getByRole('dialog', { hidden: true });

// NFR-05, NFR-06
it('is named by its title, with a subtitle, the body and a footnote', () => {
  renderDialog();

  expect(dialog().getAttribute('aria-labelledby')).toBe(
    screen.getByRole('heading', { hidden: true, name: 'Example' }).id
  );
  expect(screen.getByText('Sub')).toBeTruthy();
  expect(screen.getByText('Body')).toBeTruthy();
  expect(screen.getByText('Foot')).toBeTruthy();
});

it('leaves out the subtitle and footnote it is not given', () => {
  renderDialog({ footnote: undefined, subtitle: undefined });

  expect(screen.queryByText('Sub')).toBeNull();
  expect(screen.queryByText('Foot')).toBeNull();
});

it('puts Close first in the tab order and asks to close from it', () => {
  const onClose = vi.fn();

  renderDialog({ onClose });

  const buttons = screen.getAllByRole('button', { hidden: true });

  expect(buttons[0].getAttribute('aria-label')).toBe('Close');
  fireEvent.click(buttons[0]);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('is centred on a desktop and a sheet on a phone, following the window', () => {
  const media = mockMedia(false);
  const { unmount } = renderDialog();

  expect(dialog().getAttribute('data-form')).toBe('centred');
  media.flip(true);
  expect(dialog().getAttribute('data-form')).toBe('sheet');
  unmount();
  expect(media.remove).toHaveBeenCalled();
});

it('takes the form it is given, whatever the window', () => {
  mockMedia(true);
  renderDialog({ form: 'centred' });

  expect(dialog().getAttribute('data-form')).toBe('centred');
});

it('renders on the server as the centred dialog', () => {
  expect(
    renderToString(
      <Dialog onClose={vi.fn()} open={false} title='Example'>
        <p>Body</p>
      </Dialog>
    )
  ).toContain('data-form="centred"');
});

it('draws a panel without a dialog around it, for the design kit', () => {
  render(
    <DialogPanel form='sheet' title='Example' titleId='t'>
      <p>Body</p>
    </DialogPanel>
  );

  expect(screen.getByRole('heading', { name: 'Example' }).id).toBe('t');
});
