import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  mediaProblems,
  queriesOf,
  withQueries,
} from '@ks/lib/design/breakpoints.mts';
import { withSteps } from '@ks/lib/design/scales.mts';
import { trackedFiles } from '@ks/scripts/__tests__/tracked';

const px = (value: number) => ({ unit: 'px', value });

const tokens = {
  breakpoint: {
    $extensions: {
      kinscape: {
        queries: {
          phone:
            '(max-width: {breakpoint.phone-width}), (max-height: {breakpoint.phone-height})',
        },
      },
    },
    'phone-height': { $type: 'dimension', $value: px(499.98) },
    'phone-width': { $type: 'dimension', $value: px(639.98) },
  },
};

const PHONE = '(max-width: 639.98px), (max-height: 499.98px)';
const queries = { phone: PHONE };

describe('queriesOf', () => {
  it('resolves each reference in a named query', () => {
    expect(queriesOf(tokens)).toEqual(queries);
  });

  it('follows a changed width', () => {
    const wider = structuredClone(tokens);

    wider.breakpoint['phone-width'].$value = px(600);

    expect(queriesOf(wider).phone).toBe(
      '(max-width: 600px), (max-height: 499.98px)'
    );
  });

  it('gives no query when the file names none', () => {
    expect(queriesOf({})).toEqual({});
    expect(queriesOf({ breakpoint: {} })).toEqual({});
  });
});

describe('mediaProblems', () => {
  const problems = (text: string, list = queries) =>
    mediaProblems('a.module.css', text, list);

  it('accepts a marked condition that matches the list', () => {
    expect(
      problems(`@media ${PHONE} /* breakpoint: phone */ {\n  .a { x: y; }\n}`)
    ).toEqual([]);
  });

  it('ignores a media query on neither width nor height', () => {
    expect(
      problems('@media (hover: hover) {\n}\n@media (prefers-reduced-motion) {}')
    ).toEqual([]);
  });

  it('names the file and the line of an unmarked width', () => {
    expect(problems('.a { x: y; }\n\n@media (max-width: 700px) {\n}')).toEqual([
      'a.module.css:3: @media on a width or height has no `/* breakpoint: name */` marker',
    ]);
  });

  it('names an unknown marker', () => {
    expect(problems(`@media ${PHONE} /* breakpoint: tablet */ {\n}`)).toEqual([
      'a.module.css:1: unknown breakpoint marker "tablet"',
    ]);
  });

  it('names the file of a stale condition', () => {
    expect(
      problems('@media (max-width: 600px) /* breakpoint: phone */ {\n}')
    ).toEqual([
      `a.module.css:1: the condition of breakpoint "phone" is not "${PHONE}"`,
    ]);
  });
});

describe('withQueries', () => {
  it('rewrites only the condition of a marked @media', () => {
    const before = [
      '@media (max-width: 600px) /* breakpoint: phone */ {',
      '  .a { width: 600px; }',
      '}',
      '@media (hover: hover) {',
      '}',
    ].join('\n');

    expect(withQueries(before, queries)).toBe(
      [
        `@media ${PHONE} /* breakpoint: phone */ {`,
        '  .a { width: 600px; }',
        '}',
        '@media (hover: hover) {',
        '}',
      ].join('\n')
    );
  });

  it('leaves a file with no marker as it is', () => {
    expect(withQueries('.a { x: y; }', queries)).toBe('.a { x: y; }');
  });

  it('throws on an unknown marker and names it', () => {
    expect(() =>
      withQueries(
        '@media (max-width: 1px) /* breakpoint: tablet */ {\n}',
        queries
      )
    ).toThrow('unknown breakpoint marker "tablet"');
  });
});

describe('the tracked CSS', () => {
  it('marks each width or height @media with the list condition', () => {
    const root = process.cwd();
    const list = queriesOf(
      withSteps(
        JSON.parse(
          readFileSync(join(root, 'design/kinscape.tokens.json'), 'utf8')
        )
      )
    );
    const found = trackedFiles()
      .filter(
        file => file.endsWith('.module.css') || file === 'app/globals.css'
      )
      .flatMap(file =>
        mediaProblems(file, readFileSync(join(root, file), 'utf8'), list)
      );

    expect(found).toEqual([]);
  });
});
