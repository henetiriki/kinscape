'use client';

import type { Source } from '@/lib/boundaries/model.mts';

import { TextLink } from '@/app/components/actions/TextLink';
import { Text } from '@/app/components/foundation/Text';
import { Dialog } from '@/app/components/overlays/Dialog';
import { SOURCES_WORDS } from '@/app/components/overlays/sourcesWords';

import styles from './SourcesDialog.module.css';

const COLUMNS = ['Layer', 'Source', 'Licence', 'Checked'];

const detail = (source: Source) =>
  `${source.author}${source.processing ? `. ${source.processing}` : ''}`;

const Licence = ({ source }: { source: Source }) => (
  <TextLink
    href={source.licenceLink}
    rel='noreferrer'
    size='small'
    target='_blank'>
    {source.licence}
  </TextLink>
);

/** Every source as layer, source, licence and date checked: a table in the centred Dialog, a list in the sheet. */
export const SourcesList = ({ sources }: { sources: Source[] }) => (
  <>
    <table className={styles.table}>
      <colgroup>
        {COLUMNS.map(column => (
          <col key={column} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {COLUMNS.map(column => (
            <th key={column} scope='col'>
              <Text variant='overline'>{column}</Text>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sources.map(source => (
          <tr key={source.id}>
            <th scope='row'>
              <Text variant='label'>{source.layer}</Text>
            </th>
            <td>
              {source.title}
              <span className={styles.detail}>{detail(source)}</span>
            </td>
            <td>
              <Licence source={source} />
            </td>
            <td className={styles.date}>
              <Text variant='mono'>{source.dateChecked}</Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <ul className={styles.list}>
      {sources.map(source => (
        <li key={source.id}>
          <Text variant='label'>{source.layer}</Text>
          <span className={styles.line}>
            <span>{source.title}</span>
            <Licence source={source} />
            <span className={styles.date}>
              <Text variant='mono'>Checked {source.dateChecked}</Text>
            </span>
          </span>
          <span className={styles.detail}>{detail(source)}</span>
        </li>
      ))}
    </ul>
  </>
);

export const SourcesDialog = ({
  onClose,
  open,
  sources,
}: {
  onClose: () => void;
  open: boolean;
  sources: Source[];
}) => (
  <Dialog {...SOURCES_WORDS} onClose={onClose} open={open}>
    <SourcesList sources={sources} />
  </Dialog>
);
