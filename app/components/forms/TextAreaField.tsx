import type { ComponentProps, ReactNode } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { useFieldMessage } from '@ks/app/components/forms/useFieldMessage';
import { Icon } from '@ks/app/components/foundation/Icon';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/forms/TextAreaField.module.css';

/** A multi-line field with its label and helper text. It resizes up and down only; long content scrolls inside it. */
export const TextAreaField = ({
  error,
  helper,
  label,
  state,
  ...rest
}: {
  /** The problem, shown under the field in place of `helper`. Marks the field as in error. */
  error?: ReactNode;
  helper?: ReactNode;
  label: string;
  state?: ControlState;
} & Omit<ComponentProps<'textarea'>, 'className' | 'id'>) => {
  const field = useFieldMessage({
    describedBy: rest['aria-describedby'],
    error,
    helper,
  });

  return (
    <div className={styles.field}>
      <Text as='label' htmlFor={field.id} variant='label'>
        {label}
      </Text>
      <span
        className={styles.box}
        data-mark={error ? 'error' : undefined}
        data-state={state}>
        <textarea
          className={styles.area}
          rows={4}
          {...rest}
          aria-describedby={field.describedBy}
          aria-invalid={error ? true : undefined}
          id={field.id}
        />
        {error && <Icon name='error' />}
      </span>
      {field.message}
    </div>
  );
};
