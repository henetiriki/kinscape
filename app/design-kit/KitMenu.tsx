'use client';

import { usePathname } from 'next/navigation';
import { useId, useRef } from 'react';

import { Button } from '@/app/components/Button';
import { Icon } from '@/app/components/Icon';
import { IconButton } from '@/app/components/IconButton';
import { Text } from '@/app/components/Text';
import { TextLink } from '@/app/components/TextLink';

import { BOARDS } from './boards';
import styles from './KitMenu.module.css';

/** On a phone, a "Boards" button that opens the boards as a bottom sheet. */
export const KitMenu = () => {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialog.current?.close();

  return (
    <div className={styles.menu}>
      <Button
        aria-haspopup='dialog'
        onClick={() => dialog.current?.showModal()}>
        <span className={styles.buttonContent}>
          <Icon name='menu' />
          Boards
        </span>
      </Button>
      {/* The dialog is filled by its content, so a click on the dialog itself is a click on the scrim.
          The scrim is a pointer shortcut: Esc and Close are the keyboard's. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        aria-labelledby={titleId}
        className={styles.sheet}
        onClick={event => {
          if (event.target === event.currentTarget) {
            close();
          }
        }}
        ref={dialog}>
        <div className={styles.content}>
          <span aria-hidden='true' className={styles.handle} />
          <div className={styles.head}>
            <Text as='h2' id={titleId} variant='h2'>
              Boards
            </Text>
            <IconButton label='Close' onClick={close}>
              <Icon name='close' size={24} />
            </IconButton>
          </div>
          <ul className={styles.rows}>
            {BOARDS.map(({ eyebrow, slug, title }) => {
              const href = `/design-kit/${slug}`;
              const current = pathname === href;

              return (
                <li key={slug}>
                  <a
                    aria-current={current ? 'page' : undefined}
                    className={styles.row}
                    href={href}
                    onClick={close}>
                    <Text variant='overline'>{eyebrow}</Text>
                    <span className={styles.rowTitle}>{title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
          <TextLink
            aria-current={pathname === '/design-kit' ? 'page' : undefined}
            href='/design-kit'
            onClick={close}>
            All boards
          </TextLink>
        </div>
      </dialog>
    </div>
  );
};
