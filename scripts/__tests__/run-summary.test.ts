import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Transcript } from '../types.ts';

import { formatDuration, render, run } from '../run-summary.mts';

// What the page says with no summary: a scan that held it back is as likely as a run that never started.
const NO_SUMMARY =
  'No summary was uploaded: Claude may not have started, the secret scan may have held it back (see the thread), or the run used a run-claude from before summaries.';

const transcript = (extra: Partial<Transcript> = {}): Transcript => ({
  costUsd: 2.0762,
  denials: [],
  durationMs: 281759,
  finalText: 'I opened PR #248.',
  model: 'claude-opus-5-5',
  outcome: 'success',
  stripped: 0,
  tools: { 'Bash:git': 5, Read: 32, Write: 1 },
  turns: 80,
  ...extra,
});

describe('formatDuration', () => {
  it.each([
    [undefined, 'n/a'],
    [0, '0s'],
    [45_000, '45s'],
    [59_400, '59s'],
    [60_000, '1m 0s'],
    [281_759, '4m 42s'],
  ])('%s is %s', (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});

describe('render', () => {
  it('says so when there is no transcript', () => {
    expect(render(undefined)).toContain(NO_SUMMARY);
  });

  it('shows the figures in a table', () => {
    expect(render(transcript())).toContain(
      '| claude-opus-5-5 | 80 | $2.08 | 4m 42s | success |'
    );
  });

  it('shows n/a for figures a run did not reach', () => {
    const markdown = render(
      transcript({
        costUsd: undefined,
        durationMs: undefined,
        model: undefined,
        outcome: 'no result',
        turns: undefined,
      })
    );

    expect(markdown).toContain('| n/a | n/a | n/a | n/a | no result |');
  });

  it('lists tools by use, most used first', () => {
    expect(render(transcript())).toContain(
      '**Tools used:** Read 32, Bash:git 5, Write 1'
    );
    expect(render(transcript({ tools: {} }))).toContain('**Tools used:** none');
  });

  it('says none when nothing was denied', () => {
    expect(render(transcript())).toContain('**Permission denials:** none');
  });

  it('lists each denial as code, with backticks neutralised', () => {
    const markdown = render(
      transcript({
        denials: [
          { detail: 'cat a | tail', tool: 'Bash' },
          { detail: 'echo `id`', tool: 'Bash' },
          { detail: '', tool: 'Agent' },
        ],
      })
    );

    expect(markdown).toContain('**Permission denials:** 3');
    expect(markdown).toContain('- `Bash: cat a | tail`');
    expect(markdown).toContain("- `Bash: echo 'id'`");
    expect(markdown).toContain('- `Agent`');
  });

  it("puts Claude's message in a fenced block inside details", () => {
    const markdown = render(transcript());

    expect(markdown).toContain("<summary>Claude's final message</summary>");
    expect(markdown).toContain('```\nI opened PR #248.\n```');
  });

  it('fences longer than any backticks in the message', () => {
    const markdown = render(transcript({ finalText: 'a ```` b' }));

    expect(markdown).toContain('`````\na ```` b\n`````');
  });

  it('cuts a long message', () => {
    const markdown = render(transcript({ finalText: 'y'.repeat(5000) }));

    expect(markdown).toContain(`${'y'.repeat(2500)}…`);
    expect(markdown).not.toContain('y'.repeat(2501));
  });

  it('leaves out the message section when there is none', () => {
    expect(render(transcript({ finalText: '' }))).not.toContain('<details>');
  });
});

describe('run', () => {
  let dir: string;
  let summary: string;
  let input: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'run-summary-'));
    summary = join(dir, 'summary.md');
    input = join(dir, 'claude-execution-output.json');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true });
    vi.restoreAllMocks();
  });

  it('needs a file argument', () => {
    expect(run([], {})).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Usage')
    );
  });

  it("appends the run's summary to $GITHUB_STEP_SUMMARY", () => {
    writeFileSync(summary, 'earlier\n');
    writeFileSync(
      input,
      JSON.stringify(
        transcript({
          costUsd: undefined,
          durationMs: undefined,
          model: undefined,
          turns: 3,
        })
      )
    );

    expect(run([input], { GITHUB_STEP_SUMMARY: summary })).toBe(0);

    const written = readFileSync(summary, 'utf8');

    expect(written.startsWith('earlier\n### Claude run')).toBe(true);
    expect(written).toContain('| n/a | 3 | n/a | n/a | success |');
  });

  // Runs before the change uploaded the transcript itself (plan C415, D1).
  it('says so when the file is a transcript, not a summary', () => {
    writeFileSync(
      input,
      JSON.stringify([
        { num_turns: 3, result: 'Done.', subtype: 'success', type: 'result' },
      ])
    );

    expect(run([input], { GITHUB_STEP_SUMMARY: summary })).toBe(0);
    expect(readFileSync(summary, 'utf8')).toContain(NO_SUMMARY);
  });

  it('says so when the file is missing', () => {
    expect(
      run([join(dir, 'gone.json')], { GITHUB_STEP_SUMMARY: summary })
    ).toBe(0);
    expect(readFileSync(summary, 'utf8')).toContain(NO_SUMMARY);
  });

  it('says so when the file cannot be read as a summary', () => {
    writeFileSync(input, 'half a fi');

    expect(run([input], { GITHUB_STEP_SUMMARY: summary })).toBe(0);
    expect(readFileSync(summary, 'utf8')).toContain(NO_SUMMARY);
  });

  it('prints to the terminal when $GITHUB_STEP_SUMMARY is not set', () => {
    expect(run([join(dir, 'gone.json')], {})).toBe(0);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(NO_SUMMARY)
    );
  });
});
