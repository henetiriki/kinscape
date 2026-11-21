'use client';

import type { RefObject } from 'react';

import { useEffect } from 'react';

const DIALOG = 'dialog, [role=dialog]';
// A dialog and a text field own their Esc; a checkbox, radio or range does not.
const OWNS_ESC = `${DIALOG}, textarea, input:not([type=checkbox], [type=radio], [type=range])`;

const within = (target: EventTarget | null, selector: string) =>
  target instanceof Element && target.closest(selector) !== null;

/** An Esc that nothing else owns: no handler prevented it, and it is not inside a dialog or a text field. */
export const isFreeEscape = (event: KeyboardEvent) =>
  event.key === 'Escape' &&
  !event.defaultPrevented &&
  !within(event.target, OWNS_ESC);

/**
 * Calls `onDismiss` while `active`: on Esc (`escape`), and on a press outside the element in `outside`.
 * An Esc that a dialog, a text field or another handler owns is left alone, and a press in a dialog is not outside.
 */
export const useDismiss = (
  active: boolean,
  onDismiss: () => void,
  { escape, outside }: { escape?: boolean; outside?: RefObject<Element | null> }
) => {
  useEffect(() => {
    if (!active) return;

    const onEsc = (event: KeyboardEvent) => {
      if (isFreeEscape(event)) onDismiss();
    };
    const onPress = (event: PointerEvent) => {
      if (
        !outside!.current!.contains(event.target as Node) &&
        !within(event.target, DIALOG)
      )
        onDismiss();
    };

    if (escape) document.addEventListener('keydown', onEsc);
    if (outside) document.addEventListener('pointerdown', onPress);

    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('pointerdown', onPress);
    };
  }, [active, escape, onDismiss, outside]);
};
