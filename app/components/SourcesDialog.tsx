'use client';

import { useEffect, useRef } from 'react';

import type { Source } from '@/lib/boundaries/model.mts';

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
      className='scrim'
      onKeyDown={event => {
        if (event.key === 'Escape') onClose();
      }}
      role='presentation'>
      <div
        aria-labelledby='sources-title'
        aria-modal='true'
        className='dialog'
        role='dialog'>
        <button
          aria-label='Close'
          className='dialog-close'
          onClick={onClose}
          ref={close}
          type='button'>
          ×
        </button>
        <h2 id='sources-title'>Sources and attributions</h2>
        <table>
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
                  <span className='source-detail'>
                    {source.author}
                    {source.processing ? `. ${source.processing}` : ''}
                  </span>
                </td>
                <td>
                  <a href={source.licenceLink} rel='noreferrer' target='_blank'>
                    {source.licence}
                  </a>
                </td>
                <td className='mono'>{source.dateChecked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
