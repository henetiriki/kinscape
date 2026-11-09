import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const read = (file: string) =>
  readFileSync(join(process.cwd(), '.github/workflows', file), 'utf8');

// Agent mode posts nothing until Claude does, so each run puts :eyes: and a "Working" comment on
// its thread, and removes the comment when it ends. The comment must go before any step that counts
// or edits the bot's comments, or that step would take it for Claude's.
describe('the working signal', () => {
  it.each([
    [
      'claude-run.yml',
      'Run Claude Code',
      'If Claude left no comment, post one',
    ],
    ['claude-code-review.yml', 'Run Claude Code', 'Report a missing review'],
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

  // Tag mode, which a respond run uses, posts its own :eyes: and comment; a second one would double them.
  it('in claude-run.yml is not shown on a respond run', () => {
    const { jobs } = parse(read('claude-run.yml')) as {
      jobs: Record<string, { steps: { if?: string; name?: string }[] }>;
    };
    const start = jobs.run.steps.find(
      step => step.name === 'Show that the run started'
    );

    expect(start?.if).toBe("inputs.kind != 'respond'");
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
