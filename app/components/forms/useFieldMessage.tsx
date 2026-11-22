import type { ReactNode } from 'react';

import { useId } from 'react';

import { Text } from '@ks/app/components/foundation/Text';

/** The id of a field's control, and the message under it: the error, or else the helper. `describedBy` adds the message to the `aria-describedby` that the caller gave. */
export const useFieldMessage = ({
  describedBy,
  error,
  helper,
}: {
  describedBy?: string;
  error?: ReactNode;
  helper?: ReactNode;
}) => {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? helper;

  return {
    describedBy:
      [describedBy, message ? messageId : null].filter(Boolean).join(' ') ||
      undefined,
    id,
    message: message && (
      <Text
        id={messageId}
        role={error ? 'alert' : undefined}
        tone={error ? 'error' : undefined}
        variant='small'>
        {message}
      </Text>
    ),
  };
};
