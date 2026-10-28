import type { ChipOption } from '@ks/app/components/actions/types';

import { Button } from '@ks/app/components/actions/Button';
import { ChipGroup } from '@ks/app/components/actions/ChipGroup';
import { SelectField } from '@ks/app/components/forms/SelectField';
import { TokenField } from '@ks/app/components/forms/TokenField';

import styles from '@ks/features/map/components/FilterFields.module.css';

type Choice = { label: string; value: string };

/** The Filters tab, in order: Person, Surname, Event type, Branch. The caller holds every value. */
export const FilterFields = ({
  branch,
  branches,
  events,
  eventTypes,
  onBranchChange,
  onEventToggle,
  onPersonChange,
  onSurnamesChange,
  people,
  person,
  surnames,
}: {
  branch: string;
  branches: Choice[];
  /** The chosen Event types. */
  events: string[];
  eventTypes: ChipOption[];
  onBranchChange: (value: string) => void;
  onEventToggle: (value: string) => void;
  onPersonChange: (value: string) => void;
  onSurnamesChange: (values: string[]) => void;
  people: Choice[];
  person: string;
  surnames: string[];
}) => (
  <div className={styles.fields}>
    <SelectField
      label='Person'
      onChange={event => onPersonChange(event.target.value)}
      options={people}
      value={person}
    />
    <TokenField
      label='Surname'
      onChange={onSurnamesChange}
      placeholder='Add a surname'
      values={surnames}
    />
    <ChipGroup
      label='Event type'
      onToggle={onEventToggle}
      options={eventTypes}
      selected={events}
    />
    <SelectField
      label='Branch'
      onChange={event => onBranchChange(event.target.value)}
      options={branches}
      value={branch}
    />
  </div>
);

/** The Panel's footer on the Filters tab. */
export const ClearFilters = ({ onClear }: { onClear: () => void }) => (
  <Button full onClick={onClear}>
    Clear filters
  </Button>
);
