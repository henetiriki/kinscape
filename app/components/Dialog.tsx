'use client';

import { type ReactNode, useId, useSyncExternalStore } from 'react';

import rawTokens from '../../design/tokens.json';
import styles from './Dialog.module.css';
import { Modal, ModalClose } from './Modal';
import { Text } from './Text';

export type DialogForm = 'centred' | 'sheet';

// Below 640 wide or below 500 tall is a phone (Intent 104).
const { 'phone-height': height, 'phone-width': width } = rawTokens.breakpoint;
const PHONE = `(max-width: ${width}), (max-height: ${height})`;

const subscribe = (notify: () => void) => {
  const query = window.matchMedia(PHONE);

  query.addEventListener('change', notify);

  return () => query.removeEventListener('change', notify);
};

const usePhone = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE).matches,
    () => false
  );

type PanelProps = {
  children: ReactNode;
  /** A line under the body. */
  footnote?: string;
  form: DialogForm;
  /** Left off in the design kit, where the panel is only drawn. */
  onClose?: () => void;
  subtitle?: string;
  title: string;
  titleId: string;
};

/** The Dialog as drawn: a modal Surface with a fixed head and a body that scrolls. */
export const DialogPanel = ({
  children,
  footnote,
  form,
  onClose,
  subtitle,
  title,
  titleId,
}: PanelProps) => (
  <div className={styles.panel} data-form={form}>
    <span aria-hidden='true' className={styles.handle} />
    <div className={styles.head}>
      <div className={styles.titles}>
        <Text as='h2' id={titleId} variant='h2'>
          {title}
        </Text>
        {subtitle && <Text variant='body'>{subtitle}</Text>}
      </div>
      <ModalClose iconSize={form === 'sheet' ? 20 : 18} onClick={onClose} />
    </div>
    <div className={styles.body}>
      {children}
      {footnote && <Text variant='small'>{footnote}</Text>}
    </div>
  </div>
);

type DialogProps = Omit<PanelProps, 'form' | 'onClose' | 'titleId'> & {
  /** Forces a form; without it a phone gets the sheet and anything else the centred dialog. */
  form?: DialogForm;
  /** Called when the Close button, the scrim or Esc dismisses the dialog. */
  onClose: () => void;
  open: boolean;
};

/** A modal for a task or a long read: centred over the scrim, or a bottom sheet on a phone. */
export const Dialog = ({ form, onClose, open, ...panel }: DialogProps) => {
  const titleId = useId();
  const phone = usePhone();
  const shape = form ?? (phone ? 'sheet' : 'centred');

  return (
    <Modal
      aria-labelledby={titleId}
      className={styles.dialog}
      data-form={shape}
      onClose={onClose}
      open={open}>
      <DialogPanel
        {...panel}
        form={shape}
        onClose={onClose}
        titleId={titleId}
      />
    </Modal>
  );
};
