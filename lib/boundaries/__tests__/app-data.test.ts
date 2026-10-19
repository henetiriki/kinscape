import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadAppData } from '../app-data';

describe('loadAppData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the repo's data without errors", () => {
    const data = loadAppData();

    expect(data.polities).toHaveLength(11);
    expect(data.boundaries).toHaveLength(11);
    expect(data.names).toHaveLength(11);
    expect(data.sources.length).toBeGreaterThan(0);
  });

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
