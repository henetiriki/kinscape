import { join } from 'node:path';

import type { BoundaryData } from './model.mts';

import { loadBoundaryData } from './load.mts';

/** The repo's `data/` folder, read on the server. A bad file stops the build. */
export const loadAppData = (): BoundaryData => {
  const { data, errors } = loadBoundaryData(join(process.cwd(), 'data'));

  if (errors.length > 0) {
    throw new Error(`Boundary data is invalid:\n${errors.join('\n')}`);
  }

  return data;
};
