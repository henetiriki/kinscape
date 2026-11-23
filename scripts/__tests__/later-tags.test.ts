import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The tag is built from parts, so this file does not match itself.
const TAG = ['@', 'later'].join('');

/** Each `path:line` where the tag has no ` #<number>` after it. */
const untagged = (files: Record<string, string>): string[] =>
  Object.entries(files).flatMap(([path, text]) =>
    text
      .split('\n')
      .flatMap((line, index) =>
        new RegExp(`${TAG}(?! #\\d)`).test(line) ? [`${path}:${index + 1}`] : []
      )
  );

const tracked = (): string[] =>
  execFileSync('git', ['ls-files', '*.ts', '*.tsx', '*.mts'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(path => path !== '' && !path.startsWith('design/canvas/'));

describe('untagged', () => {
  it('flags the tag with no number', () => {
    expect(untagged({ 'a.ts': `/** ${TAG} */` })).toEqual(['a.ts:1']);
  });

  it('flags the tag on its own line, with the line number', () => {
    expect(untagged({ 'a.ts': `x\n * ${TAG} soon\ny` })).toEqual(['a.ts:2']);
  });

  it('accepts the tag with an issue number', () => {
    expect(untagged({ 'a.ts': `/** ${TAG} #884 */` })).toEqual([]);
  });
});

describe('the tracked source', () => {
  it('tags each unused export with an issue number', () => {
    const files = Object.fromEntries(
      tracked().map(path => [path, readFileSync(path, 'utf8')])
    );

    expect(Object.keys(files)).toContain('app/@map/actions.ts');
    expect(untagged(files)).toEqual([]);
  });
});
