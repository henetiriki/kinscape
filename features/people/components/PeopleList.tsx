'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { PersonSummary } from '@ks/lib/domain/persons/types';

import { Button } from '@ks/app/components/actions/Button';
import { PersonRow } from '@ks/app/components/actions/PersonRow';
import { Alert } from '@ks/app/components/feedback/Alert';
import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { TextField } from '@ks/app/components/forms/TextField';
import { PageHeader } from '@ks/app/components/foundation/PageHeader';
import { Text } from '@ks/app/components/foundation/Text';
import { usePhone } from '@ks/app/components/foundation/usePhone';
import { AccountMenu } from '@ks/features/people/components/AccountMenu';
import { byName, matchesQuery } from '@ks/lib/domain/persons/list.mts';

import styles from '@ks/features/people/components/PeopleList.module.css';

const plural = (count: number) => (count === 1 ? 'person' : 'people');

/**
 * The People page (PPL-01): the header, the count, the filter and the rows, or the notice or alert
 * for the state. `failed` is a load that threw. `onSignOut` is a server action.
 */
export const PeopleList = ({
  email,
  failed,
  initial,
  onSignOut,
  people,
}: {
  email: string;
  failed?: boolean;
  initial: string;
  onSignOut: () => Promise<unknown>;
  people: PersonSummary[];
}) => {
  const router = useRouter();
  const phone = usePhone();
  const [query, setQuery] = useState('');
  const total = people.length;
  const empty = total === 0 && !failed;
  const shown = people.toSorted(byName).flatMap(person => {
    const match = matchesQuery(person, query);

    return match === undefined ? [] : [{ match, person }];
  });
  const filtering = query.trim() !== '';

  let count: null | string = null;

  if (!failed && !empty) {
    count = filtering
      ? `${shown.length} of ${total} ${shown.length === 1 && total === 1 ? 'person matches' : 'people match'}`
      : `${total} ${plural(total)} in this Tree, by surname`;
  }

  return (
    <div className={styles.page}>
      <PageHeader
        avatar={
          <AccountMenu email={email} initial={initial} onSignOut={onSignOut} />
        }
        backHref='/'
        backLabel='Map'
      />
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.top}>
            <div className={styles.heading}>
              <Text as='h1' variant='h1'>
                People
              </Text>
              {count && (
                <Text role='status' variant='small'>
                  {count}
                </Text>
              )}
            </div>
            {!phone && (
              <Button href='/people/new' size='m' variant='primary'>
                Add a person
              </Button>
            )}
          </div>
          {!empty && (
            <div className={styles.filter}>
              <TextField
                disabled={failed}
                helper={
                  phone
                    ? 'Matches names, maiden names and spelling variants.'
                    : 'Matches given names, surnames, maiden names and spelling variants.'
                }
                label='Find a person'
                onChange={event => setQuery(event.target.value)}
                shortcut={phone ? undefined : '/'}
                type='search'
                value={query}
              />
            </div>
          )}
          {phone && !empty && (
            <Text variant='small'>To add or edit people, use a computer.</Text>
          )}
          {failed && (
            <div className={styles.failed}>
              <Alert title="People didn't load" tone='error'>
                Check your connection, then try again. Nothing in your Tree has
                changed.
              </Alert>
              <Button onClick={() => router.refresh()}>Try again</Button>
            </div>
          )}
          {empty && (
            <div className={styles.empty}>
              <NoticeCard icon='people' size='large' title='No people yet'>
                {phone
                  ? 'Add people on a computer. Once people are in it, you can pin their lives to the map.'
                  : 'Use Add a person to start your Tree. Once people are in it, you can pin their lives to the map.'}
              </NoticeCard>
            </div>
          )}
          {!failed && !empty && filtering && shown.length === 0 && (
            <div className={styles.noMatch}>
              <NoticeCard
                actions={[
                  { label: 'Clear the filter', onClick: () => setQuery('') },
                ]}
                icon='search'
                title={`No one matches “${query.trim()}”`}>
                {phone
                  ? 'Check the spelling.'
                  : 'Check the spelling, or add them with Add a person.'}
              </NoticeCard>
            </div>
          )}
          {shown.length > 0 && phone && (
            <ul aria-label='People, by surname' className={styles.phoneRows}>
              {shown.map(({ match, person }) => (
                <li key={person.id}>
                  <PersonRow
                    born={person.born}
                    deceased={person.deceased}
                    died={person.died}
                    form='phone'
                    givenNames={person.givenNames}
                    href={`/people/${person.id}`}
                    maidenName={person.maidenName}
                    matchedVariant={match.variant}
                    surname={person.surname}
                  />
                </li>
              ))}
            </ul>
          )}
          {shown.length > 0 && !phone && (
            <section aria-label='People, by surname' className={styles.list}>
              <div aria-hidden='true' className={styles.heads}>
                <Text variant='overline'>Name</Text>
                <Text variant='overline'>Born</Text>
                <Text variant='overline'>Died</Text>
                <span />
              </div>
              <ul className={styles.rows}>
                {shown.map(({ match, person }) => (
                  <li className={styles.item} key={person.id}>
                    <PersonRow
                      born={person.born}
                      deceased={person.deceased}
                      died={person.died}
                      givenNames={person.givenNames}
                      href={`/people/${person.id}`}
                      maidenName={person.maidenName}
                      matchedVariant={match.variant}
                      surname={person.surname}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};
