'use client';

import type { ReactNode } from 'react';

import { createContext, useContext, useState } from 'react';

import { Toast } from '@ks/app/components/feedback/Toast';

import styles from '@ks/features/people/components/SavedToast.module.css';

const ShowSaved = createContext<(message: string) => void>(() => {});

/** Sets the success toast of the People pages. It shows after the form returns to the list. */
export const useSavedToast = () => useContext(ShowSaved);

/**
 * The layout of the People pages holds the toast, so it outlives the navigation from the form to
 * the list. A full reload drops it.
 */
export const SavedToast = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState<null | string>(null);

  return (
    <ShowSaved value={setMessage}>
      {children}
      {message !== null && (
        <div className={styles.place}>
          <Toast onDismiss={() => setMessage(null)} tone='success'>
            {message}
          </Toast>
        </div>
      )}
    </ShowSaved>
  );
};
