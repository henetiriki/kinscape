import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// GitHub collapses a file marked linguist-generated in the PR diff, and the review skips its content
// (.github/agent/review.md). Only the files that design-agent-shots.yml commits carry the mark.
const attribute = (file: string) =>
  execFileSync('git', ['check-attr', 'linguist-generated', '--', file], {
    encoding: 'utf8',
  })
    .trim()
    .split(': ')
    .pop();

describe('.gitattributes', () => {
  it.each(['design/source/add-pin.html', 'design/add-pin.jpg'])(
    'marks the generated file %s',
    file => {
      expect(attribute(file)).toBe('set');
    }
  );

  it.each(['design/canvas/project/Map.dc.html', 'design/source/fonts.css'])(
    'leaves the hand-made file %s unmarked',
    file => {
      expect(attribute(file)).toBe('unspecified');
    }
  );
});
