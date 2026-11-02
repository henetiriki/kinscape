import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const REQUIREMENTS = 'docs/requirements.md';
const ID = '(?:MAP|BND|PPL|PIN|EXP|NFR)-\\d+';
const LOWER_ID = '(?:map|bnd|ppl|pin|exp|nfr)-\\d+';
const IN_PAGE_LINK = new RegExp(`\\(#(${LOWER_ID})\\)`, 'g');
const CROSS_FILE_LINK = new RegExp(`requirements\\.md#(${LOWER_ID})`, 'g');

// ID cells that lack an `<a id="<lower-case id>"></a>` anchor.
const unanchoredRows = (text: string) =>
  [
    ...text.matchAll(
      new RegExp(`^\\| *(?:(<a id="[^"]*"></a>))?(${ID}) *\\|`, 'gm')
    ),
  ]
    .filter(([, anchor, id]) => anchor !== `<a id="${id.toLowerCase()}"></a>`)
    .map(([, , id]) => id);

const anchors = (text: string) =>
  new Set([...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map(m => m[1]));

// Link targets that name no anchor: `(#id)` in the requirements, `requirements.md#id` elsewhere.
const brokenLinks = (text: string, known: Set<string>, pattern: RegExp) =>
  [...text.matchAll(pattern)].map(m => m[1]).filter(id => !known.has(id));

const trackedMarkdown = () =>
  execFileSync('git', ['ls-files', '*.md'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

describe('requirement anchors (fixtures)', () => {
  it('names an ID row with no anchor', () => {
    expect(unanchoredRows('| MAP-03 | Date control | Must |')).toEqual([
      'MAP-03',
    ]);
  });

  it('names an ID row whose anchor does not match', () => {
    expect(
      unanchoredRows('| <a id="map-04"></a>MAP-03 | Date | Must |')
    ).toEqual(['MAP-03']);
  });

  it('accepts an anchored row', () => {
    expect(
      unanchoredRows('| <a id="map-03"></a>MAP-03 | Date | Must |')
    ).toEqual([]);
  });

  it('names a link to a missing anchor', () => {
    const known = anchors('| <a id="map-03"></a>MAP-03 | Date | Must |');

    expect(
      brokenLinks('[a](#map-03) [b](#map-99)', known, IN_PAGE_LINK)
    ).toEqual(['map-99']);
  });

  it('names a cross-file link to a missing anchor', () => {
    const known = anchors('| <a id="map-03"></a>MAP-03 | Date | Must |');

    expect(
      brokenLinks(
        '[x](../docs/requirements.md#map-99) [y](requirements.md#map-03)',
        known,
        CROSS_FILE_LINK
      )
    ).toEqual(['map-99']);
  });
});

describe('requirement anchors (repo)', () => {
  const text = readFileSync(REQUIREMENTS, 'utf8');

  it('every ID row has its anchor', () => {
    expect(unanchoredRows(text)).toEqual([]);
  });

  it('every in-page ID link has an anchor', () => {
    expect(brokenLinks(text, anchors(text), IN_PAGE_LINK)).toEqual([]);
  });

  it('every requirements.md#<id> link in tracked markdown has an anchor', () => {
    const known = anchors(text);
    const broken = trackedMarkdown().flatMap(file =>
      brokenLinks(readFileSync(file, 'utf8'), known, CROSS_FILE_LINK).map(
        id => `${file}#${id}`
      )
    );

    expect(broken).toEqual([]);
  });
});
