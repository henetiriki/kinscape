import type { ComponentProps, ReactNode } from 'react';

import { useId } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

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
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? helper;
  const describedBy = [rest['aria-describedby'], message ? messageId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      <Text as='label' htmlFor={id} variant='label'>
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
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          id={id}
        />
        {error && <Icon name='error' />}
      </span>
      {message && (
        <Text
          id={messageId}
          role={error ? 'alert' : undefined}
          tone={error ? 'error' : undefined}
          variant='small'>
          {message}
        </Text>
      )}
    </div>
  );
};
