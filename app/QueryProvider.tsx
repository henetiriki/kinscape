'use client';

import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { retryQuery } from '@ks/app/query-retry';

/**
 * One `QueryClient` for each page load, so the map and later screens share one cache. It lives in
 * state, because a module-level client on the server holds the data of every request.
 */
export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [client] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { retry: retryQuery } } })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
