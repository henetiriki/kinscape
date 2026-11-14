import { fireEvent, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { useDismiss } from '@ks/app/components/overlays/useDismiss';

const added: Element[] = [];

const place = (tag: string, attributes: Record<string, string> = {}) => {
  const element = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }

  document.body.append(element);
  added.push(element);

  return element;
};

afterEach(() => {
  for (const element of added.splice(0)) element.remove();
});

it('dismisses on Esc while active, and on no other key', () => {
  const onDismiss = vi.fn();

  renderHook(() => useDismiss(true, onDismiss, { escape: true }));
  fireEvent.keyDown(document, { key: 'a' });
  expect(onDismiss).not.toHaveBeenCalled();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onDismiss).toHaveBeenCalledOnce();
});

it('listens for Esc only when asked, and only while active', () => {
  const onDismiss = vi.fn();
  const { rerender } = renderHook(
    ({ active, escape }) => useDismiss(active, onDismiss, { escape }),
    { initialProps: { active: true, escape: false } }
  );

  fireEvent.keyDown(document, { key: 'Escape' });
  rerender({ active: false, escape: true });
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onDismiss).not.toHaveBeenCalled();
});

it('leaves an Esc that a dialog, a text field or another handler owns', () => {
  const onDismiss = vi.fn();
  const dialog = place('div', { role: 'dialog' });
  const inDialog = document.createElement('button');
  const text = place('input', { type: 'text' });
  const area = place('textarea');
  const handled = (event: Event) => event.preventDefault();

  dialog.append(inDialog);
  renderHook(() => useDismiss(true, onDismiss, { escape: true }));

  for (const owner of [inDialog, text, area]) {
    fireEvent.keyDown(owner, { key: 'Escape' });
  }

  document.addEventListener('keydown', handled, { capture: true });
  fireEvent.keyDown(document.body, { key: 'Escape' });
  document.removeEventListener('keydown', handled, { capture: true });
  expect(onDismiss).not.toHaveBeenCalled();
});

it('takes an Esc from a checkbox or the page', () => {
  const onDismiss = vi.fn();
  const box = place('input', { type: 'checkbox' });

  renderHook(() => useDismiss(true, onDismiss, { escape: true }));
  fireEvent.keyDown(box, { key: 'Escape' });
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onDismiss).toHaveBeenCalledTimes(2);
});

it('dismisses on a press outside, not on one inside or in a dialog', () => {
  const onDismiss = vi.fn();
  const inside = place('div');
  const child = document.createElement('span');
  const dialog = place('dialog');

  inside.append(child);
  renderHook(() =>
    useDismiss(true, onDismiss, { outside: { current: inside } })
  );
  fireEvent.pointerDown(child);
  fireEvent.pointerDown(dialog);
  expect(onDismiss).not.toHaveBeenCalled();
  fireEvent.pointerDown(document.body);
  fireEvent.pointerDown(document);
  expect(onDismiss).toHaveBeenCalledTimes(2);
});

it('listens for a press only when given `outside`, and only while active', () => {
  const onDismiss = vi.fn();
  const inside = place('div');
  const { rerender } = renderHook(
    ({ active, outside }) => useDismiss(active, onDismiss, { outside }),
    {
      initialProps: {
        active: true,
        outside: undefined as { current: Element } | undefined,
      },
    }
  );

  fireEvent.pointerDown(document.body);
  rerender({ active: false, outside: { current: inside } });
  fireEvent.pointerDown(document.body);
  expect(onDismiss).not.toHaveBeenCalled();
});

it('stops listening when it unmounts', () => {
  const onDismiss = vi.fn();
  const inside = place('div');
  const { unmount } = renderHook(() =>
    useDismiss(true, onDismiss, { escape: true, outside: { current: inside } })
  );

  unmount();
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.pointerDown(document.body);
  expect(onDismiss).not.toHaveBeenCalled();
});
