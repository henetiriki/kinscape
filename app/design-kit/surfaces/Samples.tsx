'use client';

import { useState } from 'react';

import type { Source } from '@/lib/boundaries/model.mts';

import { Toast } from '@/app/components/feedback/Toast';
import { Menu } from '@/app/components/overlays/Menu';
import {
  chainText,
  Popup,
  PopupPointer,
} from '@/app/components/overlays/Popup';
import { SourcesDialog } from '@/app/components/overlays/SourcesDialog';

import { CHAIN, MENU_GROUPS, MENU_WORDS, PINS } from './data';
import styles from './page.module.css';

/** A live account Menu: Sources and attributions opens the Sources dialog, the other items only close. */
export const AccountMenu = ({ sources }: { sources: Source[] }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Menu
        {...MENU_WORDS}
        groups={MENU_GROUPS}
        onSelect={id => setOpen(id === 'sources')}
      />
      <SourcesDialog
        onClose={() => setOpen(false)}
        open={open}
        sources={sources}
      />
    </>
  );
};

/** The desktop Popup with Copy chain, and the Toast that says whether it worked. */
export const CopyChainPopup = () => {
  const [toast, setToast] = useState<'error' | 'success' | undefined>();

  const copied = (ok: boolean) => setToast(ok ? 'success' : 'error');
  const retry = () =>
    navigator.clipboard.writeText(chainText(CHAIN)).then(
      () => copied(true),
      () => copied(false)
    );

  return (
    <div className={styles.popupStack}>
      <div className={styles.popupHolder}>
        <Popup
          chain={CHAIN}
          coordinates='28.738° S · 24.764° E'
          form='floating'
          onCopied={copied}
          pins={PINS}
          place='Kimberley'
          year={1901}
        />
        <PopupPointer className={styles.popupPointer} />
      </div>
      {toast === 'success' && (
        <Toast onDismiss={() => setToast(undefined)} tone='success'>
          Jurisdiction chain copied.
        </Toast>
      )}
      {toast === 'error' && (
        <Toast
          action='Try again'
          onAction={retry}
          onDismiss={() => setToast(undefined)}
          tone='error'>
          Couldn&rsquo;t copy the chain.
        </Toast>
      )}
    </div>
  );
};
