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
import { ColumnLayout } from '@ks/app/components/layout/ColumnLayout';
import { AccountMenu } from '@ks/features/people/components/AccountMenu';
import { datesOf } from '@ks/features/people/components/dates';
import { findPeople } from '@ks/lib/domain/persons/list.mts';

import styles from '@ks/features/people/components/PeopleList.module.css';

const plural = (count: number) => (count === 1 ? 'person' : 'people');

type PeopleListProps = {
  email: string;
  failed?: boolean;
  initial: string;
  onSignOut: () => Promise<unknown>;
  people: PersonSummary[];
};

const usePeopleSearch = (people: PersonSummary[], failed?: boolean) => {
  const [query, setQuery] = useState('');
  const total = people.length;
  const empty = total === 0 && !failed;
  const shown = findPeople(people, query);
  const filtering = query.trim() !== '';

  let count: null | string = null;

  if (!failed && !empty) {
    count = filtering
      ? `${shown.length} of ${total} ${shown.length === 1 && total === 1 ? 'person matches' : 'people match'}`
      : `${total} ${plural(total)} in this Tree, by surname`;
  }

  return { count, empty, filtering, query, setQuery, shown };
};

type Search = ReturnType<typeof usePeopleSearch>;

const Top = ({ count, phone }: { count: null | string; phone: boolean }) => (
  <div className={styles.top}>
    <div className={styles.heading}>
      <Text as='h1' variant={phone ? 'h1Phone' : 'h1'}>
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
);

const Filter = ({
  failed,
  phone,
  query,
  setQuery,
}: {
  failed?: boolean;
  phone: boolean;
} & Pick<Search, 'query' | 'setQuery'>) => (
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
);

const Failed = () => {
  const router = useRouter();

  return (
    <div className={styles.failed}>
      <Alert title="People didn't load" tone='error'>
        Check your connection, then try again. Nothing in your Tree has changed.
      </Alert>
      <Button onClick={() => router.refresh()}>Try again</Button>
    </div>
  );
};

const Empty = ({ phone }: { phone: boolean }) => (
  <div className={styles.empty}>
    <NoticeCard icon='people' size='large' title='No people yet'>
      {phone
        ? 'Add people on a computer. Once people are in it, you can pin their lives to the map.'
        : 'Use Add a person to start your Tree. Once people are in it, you can pin their lives to the map.'}
    </NoticeCard>
  </div>
);

const NoMatch = ({
  phone,
  query,
  setQuery,
}: { phone: boolean } & Pick<Search, 'query' | 'setQuery'>) => (
  <div className={styles.noMatch}>
    <NoticeCard
      actions={[{ label: 'Clear the filter', onClick: () => setQuery('') }]}
      icon='search'
      title={`No one matches “${query.trim()}”`}>
      {phone
        ? 'Check the spelling.'
        : 'Check the spelling, or add them with Add a person.'}
    </NoticeCard>
  </div>
);

const PhoneRows = ({ shown }: Pick<Search, 'shown'>) => (
  <ul aria-label='People, by surname' className={styles.phoneRows}>
    {shown.map(({ match, person }) => (
      <li key={person.id}>
        <PersonRow
          {...datesOf(person)}
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
);

const DesktopRows = ({ shown }: Pick<Search, 'shown'>) => (
  <section aria-label='People, by surname' className={styles.list}>
    <div aria-hidden='true' className={styles.heads} data-testid='header-row'>
      <Text variant='overline'>Name</Text>
      <Text variant='overline'>Dates</Text>
      <span />
      <span className={styles.linkSlot} />
    </div>
    <ul className={styles.rows}>
      {shown.map(({ match, person }) => (
        <li className={styles.item} key={person.id}>
          <PersonRow
            {...datesOf(person)}
            givenNames={person.givenNames}
            href={`/people/${person.id}`}
            maidenName={person.maidenName}
            matchedVariant={match.variant}
            relationshipsHref={`/people/${person.id}/relationships`}
            surname={person.surname}
          />
        </li>
      ))}
    </ul>
  </section>
);

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
}: PeopleListProps) => {
  const phone = usePhone();
  const { count, empty, filtering, query, setQuery, shown } = usePeopleSearch(
    people,
    failed
  );

  return (
    <ColumnLayout
      column='list'
      header={
        <PageHeader
          avatar={
            <AccountMenu
              email={email}
              initial={initial}
              onSignOut={onSignOut}
            />
          }
          backHref='/'
          backLabel='Map'
        />
      }>
      <Top count={count} phone={phone} />
      {!empty && (
        <Filter
          failed={failed}
          phone={phone}
          query={query}
          setQuery={setQuery}
        />
      )}
      {phone && !empty && (
        <Text variant='small'>To add or edit people, use a computer.</Text>
      )}
      {failed && <Failed />}
      {empty && <Empty phone={phone} />}
      {!failed && !empty && filtering && shown.length === 0 && (
        <NoMatch phone={phone} query={query} setQuery={setQuery} />
      )}
      {shown.length > 0 && phone && <PhoneRows shown={shown} />}
      {shown.length > 0 && !phone && <DesktopRows shown={shown} />}
    </ColumnLayout>
  );
};
