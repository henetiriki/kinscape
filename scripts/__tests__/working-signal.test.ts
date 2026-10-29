import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) =>
  readFileSync(join(process.cwd(), '.github/workflows', file), 'utf8');

// Agent mode posts nothing until Claude does, so each run puts :eyes: and a "Working" comment on
// its thread, and removes the comment when it ends. The comment must go before any step that counts
// or edits the bot's comments, or that step would take it for Claude's.
describe('the working signal', () => {
  it.each([
    ['claude-run.yml', 'Run Claude Code', 'Comment if Claude left none'],
    [
      'claude-code-review.yml',
      'Run Claude Code Review',
      'Report a missing review',
    ],
  ])('in %s starts before Claude and ends before %s', (file, run, after) => {
    const workflow = read(file);
    const at = (name: string) => workflow.indexOf(`- name: ${name}`);
    const start = /- name: Show that the (run|review) started/.exec(workflow);

    expect(start, `${file} needs a step that shows the run started`).not.toBe(
      null
    );
    expect(start?.index).toBeLessThan(at(run));
    expect(at(run)).toBeLessThan(at('Remove the working comment'));
    expect(at('Remove the working comment')).toBeLessThan(at(after));
  });

  it.each(['claude-run.yml', 'claude-code-review.yml'])(
    'in %s never fails the run and removes the comment even after a failure',
    file => {
      const workflow = read(file);
      const step = (name: string) =>
        workflow.slice(
          workflow.indexOf(`- name: ${name}`),
          workflow.indexOf('- name:', workflow.indexOf(`- name: ${name}`) + 1)
        );

      expect(step('Remove the working comment')).toContain('if: always()');
      expect(step('Remove the working comment')).toContain(
        'continue-on-error: true'
      );
      expect(
        step(
          file === 'claude-run.yml'
            ? 'Show that the run started'
            : 'Show that the review started'
        )
      ).toContain('continue-on-error: true');
    }
  );
});
