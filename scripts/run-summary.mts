import { appendFileSync, existsSync, readFileSync } from 'node:fs';

import type { Transcript } from './types.ts';

import { inlineCode, readSummary } from './agent-transcript.mts';

// Writes a Claude run's summary page from the summary it uploads (agent-transcript.mts). GitHub lists
// no steps for a job in a called workflow, and claude.yml's log ends where Claude starts, so this is
// what the run page shows.
// Usage: node scripts/run-summary.mts <claude-execution-output.json>
// The Markdown goes to $GITHUB_STEP_SUMMARY, or to the terminal when that is not set.

const MAX_TEXT = 2500;

export const formatDuration = (ms: number | undefined): string => {
  if (ms === undefined) {
    return 'n/a';
  }

  const seconds = Math.round(ms / 1000);

  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

// A fence longer than any run of backticks in the text, so Claude's words can't close it.
const fence = (text: string): string =>
  '`'.repeat(
    Math.max(3, ...[...text.matchAll(/`+/g)].map(([run]) => run.length + 1))
  );

export const render = (transcript: Transcript | undefined): string => {
  if (!transcript) {
    return [
      '### Claude run',
      '',
      'No summary was uploaded: Claude may not have started, the secret scan may have held it back (see the thread), or the run used a run-claude from before summaries.',
    ].join('\n');
  }

  const cost =
    transcript.costUsd === undefined
      ? 'n/a'
      : `$${transcript.costUsd.toFixed(2)}`;
  const tools = Object.entries(transcript.tools)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => `${name} ${count}`)
    .join(', ');
  const text =
    transcript.finalText.length > MAX_TEXT
      ? `${transcript.finalText.slice(0, MAX_TEXT)}…`
      : transcript.finalText;

  return [
    '### Claude run',
    '',
    '| Model | Turns | Cost | Duration | Outcome |',
    '| --- | ---: | ---: | ---: | --- |',
    `| ${transcript.model ?? 'n/a'} | ${transcript.turns ?? 'n/a'} | ${cost} | ${formatDuration(transcript.durationMs)} | ${transcript.outcome} |`,
    '',
    `**Permission denials:** ${transcript.denials.length === 0 ? 'none' : transcript.denials.length}`,
    ...transcript.denials.map(
      ({ detail, tool }) =>
        `- ${inlineCode(detail ? `${tool}: ${detail}` : tool)}`
    ),
    '',
    `**Tools used:** ${tools || 'none'}`,
    ...(text
      ? [
          '',
          "<details><summary>Claude's final message</summary>",
          '',
          fence(text),
          text,
          fence(text),
          '',
          '</details>',
        ]
      : []),
  ].join('\n');
};

export const run = (
  args: string[],
  env: Record<string, string | undefined>
) => {
  const [path] = args;

  if (!path) {
    console.error('Usage: run-summary <claude-execution-output.json>');

    return 1;
  }

  const markdown = render(
    existsSync(path) ? readSummary(readFileSync(path, 'utf8')) : undefined
  );

  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  } else {
    console.log(markdown);
  }

  return 0;
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(process.argv.slice(2), process.env);
}
