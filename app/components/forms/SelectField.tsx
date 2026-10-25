import { type ComponentProps, useId } from 'react';

import type { ControlState } from '@/app/components/foundation/controls';

import { Icon } from '@/app/components/foundation/Icon';
import { Text } from '@/app/components/foundation/Text';

import styles from './TextField.module.css';

/** A native select with its label and a drawn chevron. The open list is the browser's. */
export const SelectField = ({
  hideLabel,
  label,
  options,
  state,
  ...rest
}: {
  /** Names the select without showing the label. */
  hideLabel?: boolean;
  label: string;
  options: { label: string; value: string }[];
  state?: ControlState;
} & Omit<ComponentProps<'select'>, 'children' | 'className' | 'id'>) => {
  const id = useId();

  return (
    <div className={styles.field}>
      {!hideLabel && (
        <Text as='label' htmlFor={id} variant='label'>
          {label}
        </Text>
      )}
      <span className={styles.box} data-state={state}>
        <select
          aria-label={hideLabel ? label : undefined}
          className={styles.select}
          {...rest}
          id={id}>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron}>
          <Icon name='chevronDown' />
        </span>
      </span>
    </div>
  );
};
