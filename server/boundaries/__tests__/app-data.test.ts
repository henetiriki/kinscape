import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadAppData } from '@ks/server/boundaries/app-data';

describe('loadAppData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the repo's data without errors", () => {
    const data = loadAppData();

    expect(data.polities).toHaveLength(15);
    expect(data.boundaries).toHaveLength(35);
    expect(data.names).toHaveLength(24);
    expect(data.sources.length).toBeGreaterThan(0);
  });

  // NFR-08, BND-06
  it.each(['natural-earth-admin-1-v4', 'afrith-provinces-1910'])(
    'fails when the %s source has no licence or no check date',
    id => {
      const sources = loadAppData().sources;
      const root = mkdtempSync(join(tmpdir(), 'app-data-'));

      try {
        for (const field of ['licence', 'dateChecked']) {
          mkdirSync(join(root, 'data'), { recursive: true });
          writeFileSync(
            join(root, 'data', 'sources.json'),
            JSON.stringify({
              sources: sources.map(source =>
                source.id === id ? { ...source, [field]: undefined } : source
              ),
            })
          );
          vi.spyOn(process, 'cwd').mockReturnValue(root);

          expect(loadAppData).toThrow(/sources\[\d+\] is not a valid row/);
          vi.restoreAllMocks();
        }
      } finally {
        rmSync(root, { force: true, recursive: true });
      }
    }
  );

  it('throws when a data file is invalid', () => {
    const root = mkdtempSync(join(tmpdir(), 'app-data-'));

    try {
      mkdirSync(join(root, 'data'));
      writeFileSync(join(root, 'data', 'sources.json'), '{ nope');
      vi.spyOn(process, 'cwd').mockReturnValue(root);

      expect(loadAppData).toThrow(/Boundary data is invalid[^]*not valid JSON/);
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});
