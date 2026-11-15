import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, it } from 'vitest';

const PEOPLE = join(process.cwd(), 'app/people');

const loadingFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : loadingFiles(path);
    }

    return entry.name === 'loading.tsx' ? [relative(process.cwd(), path)] : [];
  });

// PPL-01
it('puts the People loading screen on the list route only, so a form load shows no list header', () => {
  expect(loadingFiles(PEOPLE)).toEqual(['app/people/(list)/loading.tsx']);
});
