'use client';

import { type ReactNode, useEffect, useId, useRef } from 'react';

import { Icon } from './Icon';
import { IconButton } from './IconButton';
import styles from './Sheet.module.css';
import { Text } from './Text';

type SheetProps = {
  children: ReactNode;
  /** Called when the Close button, the scrim or Esc dismisses the sheet. */
  onClose: () => void;
  open: boolean;
  title: string;
};

/** A modal bottom sheet on a native `<dialog>`: the browser handles Esc, the inert page and focus return. */
export const Sheet = ({ children, onClose, open, title }: SheetProps) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current!;

    if (open && !element.open) {
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    // The dialog is filled by its content, so a click on the dialog itself is a click on the scrim.
    // The scrim is a pointer shortcut: Esc and Close are the keyboard's.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      aria-labelledby={titleId}
      className={styles.sheet}
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onClose={onClose}
      ref={dialog}>
      <div className={styles.content}>
        <span aria-hidden='true' className={styles.handle} />
        <div className={styles.head}>
          <Text as='h2' id={titleId} variant='h2'>
            {title}
          </Text>
          <IconButton label='Close' onClick={onClose}>
            <Icon name='close' size={24} />
          </IconButton>
        </div>
        {children}
      </div>
    </dialog>
  );
};
