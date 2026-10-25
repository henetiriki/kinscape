'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/app/components/actions/Button';
import { TextLink } from '@/app/components/actions/TextLink';
import { Icon } from '@/app/components/foundation/Icon';
import { Text } from '@/app/components/foundation/Text';
import { Sheet } from '@/app/components/overlays/Sheet';

import { BOARDS } from './boards';
import styles from './KitMenu.module.css';

/** On a phone, a "Boards" button that opens the boards as a bottom sheet. */
export const KitMenu = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className={styles.menu}>
      <Button aria-haspopup='dialog' onClick={() => setOpen(true)}>
        <span className={styles.buttonContent}>
          <Icon name='menu' />
          Boards
        </span>
      </Button>
      <Sheet onClose={close} open={open} title='Boards'>
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
        <div className={styles.all}>
          <TextLink
            aria-current={pathname === '/design-kit' ? 'page' : undefined}
            href='/design-kit'
            onClick={close}>
            All boards
          </TextLink>
        </div>
      </Sheet>
    </div>
  );
};
