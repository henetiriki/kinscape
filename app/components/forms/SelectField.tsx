import type { ComponentProps, ReactNode } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { useFieldMessage } from '@ks/app/components/forms/useFieldMessage';
import { Icon } from '@ks/app/components/foundation/Icon';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/forms/TextField.module.css';

/** A native select with its label and a drawn chevron. The open list is the browser's. */
export const SelectField = ({
  error,
  hideLabel,
  label,
  options,
  state,
  ...rest
}: {
  /** The problem, shown under the field. Marks the field as in error. */
  error?: ReactNode;
  /** Names the select without showing the label. */
  hideLabel?: boolean;
  label: string;
  options: { label: string; value: string }[];
  state?: ControlState;
} & Omit<ComponentProps<'select'>, 'children' | 'className' | 'id'>) => {
  const field = useFieldMessage({
    describedBy: rest['aria-describedby'],
    error,
  });

  return (
    <div className={styles.field}>
      {!hideLabel && (
        <Text as='label' htmlFor={field.id} variant='label'>
          {label}
        </Text>
      )}
      <span
        className={styles.box}
        data-mark={error ? 'error' : undefined}
        data-state={state}>
        <select
          aria-label={hideLabel ? label : undefined}
          className={styles.select}
          {...rest}
          aria-describedby={field.describedBy}
          aria-invalid={error ? true : undefined}
          id={field.id}>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron}>
          <Icon name='chevronDown' />
        </span>
        {error && <Icon name='error' />}
      </span>
      {field.message}
    </div>
  );
};
