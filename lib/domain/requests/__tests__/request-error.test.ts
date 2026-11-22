import { expect, it } from 'vitest';

import { requestError } from '@ks/lib/domain/requests/request-error.mts';

// NFR-03. The label names the route in the message.
it('holds the label and the status in the message', () => {
  expect(requestError('People', 401).message).toBe(
    'People request failed: 401'
  );
  expect(requestError('Pins', 503).message).toBe('Pins request failed: 503');
});

it('holds the status for the retry rule of QueryProvider', () => {
  expect(requestError('Pins', 404)).toMatchObject({ status: 404 });
});
