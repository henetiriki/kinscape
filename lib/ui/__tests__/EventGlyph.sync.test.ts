import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import type { EventType } from '@ks/lib/ui/types';

import { EVENT_PATHS } from '@ks/lib/ui/EventGlyph';

const SOURCE = join(import.meta.dirname, '../../../design/source');

// Baptism's file carries both names the design uses.
const FILE_FOR: Record<EventType, string> = {
  baptism: 'kse-baptism-christening.svg',
  birth: 'kse-birth.svg',
  burial: 'kse-burial.svg',
  death: 'kse-death.svg',
  divorce: 'kse-divorce.svg',
  land: 'kse-land.svg',
  marriage: 'kse-marriage.svg',
  occupation: 'kse-occupation.svg',
  other: 'kse-other.svg',
  residence: 'kse-residence.svg',
};

const pathsIn = (file: string) =>
  [
    ...readFileSync(join(SOURCE, file), 'utf8').matchAll(/<path d="([^"]+)"/g),
  ].map(match => match[1]);

// PIN-03, NFR-06
it('has one kse-*.svg in design/source for each Event type, and no other', () => {
  expect(
    readdirSync(SOURCE)
      .filter(file => file.startsWith('kse-'))
      .sort()
  ).toEqual(Object.values(FILE_FOR).sort());
});

it.each(Object.entries(FILE_FOR))(
  'copies the %s path from %s unchanged',
  (event, file) => {
    expect(pathsIn(file)).toEqual([EVENT_PATHS[event as EventType]]);
  }
);
