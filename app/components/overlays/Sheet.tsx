'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useId } from 'react';

import type { Tab } from '@/app/components/actions/types';

import { Tabs } from '@/app/components/actions/Tabs';
import { Text } from '@/app/components/foundation/Text';
import { Modal, ModalClose } from '@/app/components/overlays/Modal';

import styles from './Sheet.module.css';

type PanelProps = SheetHead & {
  children: ReactNode;
  onClose?: () => void;
  titleId: string;
};

type SheetHead =
  | { subtitle?: string; tabs?: undefined; title: string }
  | {
      subtitle?: undefined;
      tabs: {
        /** The sheet's name, whichever tab is selected. */
        label: string;
        onSelect?: (value: string) => void;
        selected: string;
        tabs: Tab[];
      };
      title?: undefined;
    };

/** The handle, one of three heads (title, title and subtitle, or tabs) and the content. A Sheet puts it on a dialog. */
export const SheetPanel = ({
  children,
  onClose,
  subtitle,
  tabs,
  title,
  titleId,
}: PanelProps) => (
  <div
    className={styles.content}
    data-head={tabs ? 'tabs' : subtitle ? 'subtitle' : 'title'}>
    <span aria-hidden='true' className={styles.handle} />
    <div className={styles.head}>
      {tabs ? (
        <Tabs fill {...tabs} />
      ) : (
        <div className={styles.titles}>
          <Text as='h2' id={titleId} variant='h2'>
            {title}
          </Text>
          {subtitle && <Text variant='body'>{subtitle}</Text>}
        </div>
      )}
      <ModalClose iconSize={20} onClick={onClose} />
    </div>
    {children}
  </div>
);

type SheetProps = SheetHead &
  Pick<ComponentProps<typeof SheetPanel>, 'children'> & {
    /** Called when the Close button, the scrim or Esc dismisses the sheet. */
    onClose: () => void;
    open: boolean;
  };

/** A modal bottom sheet on a native `<dialog>`. */
export const Sheet = ({ children, onClose, open, ...head }: SheetProps) => {
  const titleId = useId();

  return (
    <Modal
      aria-label={head.tabs?.label}
      aria-labelledby={head.tabs ? undefined : titleId}
      className={styles.sheet}
      onClose={onClose}
      open={open}>
      <SheetPanel {...head} onClose={onClose} titleId={titleId}>
        {children}
      </SheetPanel>
    </Modal>
  );
};
