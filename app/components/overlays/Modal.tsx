'use client';

import type { ComponentProps } from 'react';

import { useEffect, useRef } from 'react';

import { Icon } from '@/app/components/foundation/Icon';

import styles from './Modal.module.css';

type ModalProps = {
  /** Called when the scrim or Esc dismisses the modal. */
  onClose: () => void;
  open: boolean;
} & Omit<ComponentProps<'dialog'>, 'onClick' | 'onClose'>;

/** A modal on a native `<dialog>`: the browser handles Esc, the inert page and focus return. */
export const Modal = ({ children, onClose, open, ...rest }: ModalProps) => {
  const dialog = useRef<HTMLDialogElement>(null);

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
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onClose={onClose}
      ref={dialog}
      {...rest}>
      {children}
    </dialog>
  );
};

/** The round 44 × 44 Close button that ends every Dialog and Sheet head. */
export const ModalClose = ({
  iconSize,
  onClick,
}: {
  iconSize: 18 | 20;
  /** Left off in the design kit, where the head is only drawn. */
  onClick?: () => void;
}) => (
  <button
    aria-label='Close'
    className={styles.close}
    onClick={onClick}
    type='button'>
    <Icon name='close' size={iconSize} />
  </button>
);
