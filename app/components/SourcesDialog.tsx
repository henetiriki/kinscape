'use client';

import { useEffect, useRef } from 'react';

import type { Source } from '@/lib/boundaries/model.mts';

import styles from './SourcesDialog.module.css';
import { Text } from './Text';

export const SourcesDialog = ({
  onClose,
  sources,
}: {
  onClose: () => void;
  sources: Source[];
}) => {
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement;

    close.current?.focus();

    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  return (
    <div
      className={styles.scrim}
      onKeyDown={event => {
        if (event.key === 'Escape') onClose();
      }}
      role='presentation'>
      <div
        aria-labelledby='sources-title'
        aria-modal='true'
        className={styles.dialog}
        role='dialog'>
        <button
          aria-label='Close'
          className={styles.close}
          onClick={onClose}
          ref={close}
          type='button'>
          ×
        </button>
        <div className={styles.title}>
          <Text as='h2' id='sources-title' variant='h2'>
            Sources and attributions
          </Text>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope='col'>Layer</th>
              <th scope='col'>Source</th>
              <th scope='col'>Licence</th>
              <th scope='col'>Date checked</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(source => (
              <tr key={source.id}>
                <td>{source.layer}</td>
                <td>
                  {source.title}
                  <span className={styles.detail}>
                    {source.author}
                    {source.processing ? `. ${source.processing}` : ''}
                  </span>
                </td>
                <td>
                  <a href={source.licenceLink} rel='noreferrer' target='_blank'>
                    {source.licence}
                  </a>
                </td>
                <td className={styles.date}>
                  <Text variant='mono'>{source.dateChecked}</Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
