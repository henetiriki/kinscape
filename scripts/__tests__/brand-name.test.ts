import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const SPELLINGS = new Set(['KinScape', 'kinscape', 'KINSCAPE']);

// `[ ]` keeps this file from matching its own pattern.
const wrongSpellings = () =>
  execFileSync('git', ['grep', '-n', '-I', '-i', '-o', '-E', 'kin[ ]?scape'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .split('\n')
    .filter(Boolean)
    .filter(line => !SPELLINGS.has(line.split(':').slice(2).join(':')));

describe('the brand name', () => {
  it('has the spelling KinScape, kinscape or KINSCAPE in each tracked text file', () => {
    expect(
      wrongSpellings(),
      'Write the name as KinScape in text, kinscape in code and KINSCAPE in a constant'
    ).toEqual([]);
  });
});
