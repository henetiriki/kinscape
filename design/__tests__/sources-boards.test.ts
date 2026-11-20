import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import sources from '@ks/data/sources.json' with { type: 'json' };
import { SOURCES_WORDS } from '@ks/features/map/components/sourcesWords';
import { BOARD_DIR } from '@ks/scripts/design-export.mts';

// A board cannot import a file of the app, so each board holds its own copy of the Sources dialog's words and rows.
const LINE = /^\s*const SOURCES_DIALOG = (\{.*\});$/m;

it.each(['Map', 'Map-phone-states'])(
  'the %s board holds the words and the rows of the Sources dialog',
  name => {
    const board = readFileSync(
      join(process.cwd(), BOARD_DIR, `${name}.dc.html`),
      'utf8'
    );
    const [, json] = LINE.exec(board) ?? [];

    expect(json, `${name}.dc.html has no SOURCES_DIALOG line`).toBeDefined();
    expect(JSON.parse(json!), `${name}.dc.html`).toEqual({
      ...SOURCES_WORDS,
      sources: sources.sources,
    });
  }
);
