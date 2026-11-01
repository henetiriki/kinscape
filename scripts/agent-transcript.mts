// Reads the transcript claude-code-action leaves in claude-execution-output.json: a JSON array of
// events. Its summary is what a run uploads, and what the run summary and weekly denial audit read.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';

import type { Transcript } from './types.ts';

type Block = {
  id?: string;
  input?: Record<string, unknown>;
  name?: string;
  type?: string;
};

type Event = {
  cwd?: string;
  duration_ms?: number;
  message?: { content?: Block[]; id?: string; model?: string; usage?: Usage };
  model?: string;
  modelUsage?: Record<string, { costUSD?: number; outputTokens?: number }>;
  num_turns?: number;
  permission_denials?: {
    tool_input?: Record<string, unknown>;
    tool_name?: string;
    tool_use_id?: string;
  }[];
  result?: string;
  subtype?: string;
  total_cost_usd?: number;
  type?: string;
  usage?: Usage;
};

type Turn = { calls: Set<string>; model: string; usage: Usage };

type Usage = {
  cache_creation?: {
    ephemeral_1h_input_tokens?: number;
    ephemeral_5m_input_tokens?: number;
  };
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
};

// A turn's weight is its tokens times the API price ratios: input 1, cache write 1.25 (1-hour
// writes 2), cache read 0.1, output 5. Only the ratios matter: they split a run's real cost.
// `outputScale` corrects the event's `output_tokens`, which is a snapshot taken as the turn began.
const weightOf = (usage: Usage, outputScale: number): number => {
  const hour = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const write = usage.cache_creation
    ? (usage.cache_creation.ephemeral_5m_input_tokens ?? 0)
    : (usage.cache_creation_input_tokens ?? 0);

  return (
    (usage.input_tokens ?? 0) +
    write * 1.25 +
    hour * 2 +
    (usage.cache_read_input_tokens ?? 0) * 0.1 +
    (usage.output_tokens ?? 0) * outputScale * 5
  );
};

// The turns of a run: the assistant events sharing one message id count once, as each repeats the
// turn's usage.
const turnsOf = (events: Event[]): Turn[] => {
  const turns = new Map<string, Turn>();

  for (const { message } of events.filter(({ type }) => type === 'assistant')) {
    if (!message?.id) {
      continue;
    }

    const turn = turns.get(message.id) ?? {
      calls: new Set<string>(),
      model: message.model ?? '',
      usage: message.usage ?? {},
    };

    for (const block of message.content ?? []) {
      if (block.type === 'tool_use' && block.id) {
        turn.calls.add(block.id);
      }
    }

    turns.set(message.id, turn);
  }

  return [...turns.values()];
};

// What each turn cost: its share of its model's cost in `modelUsage`, else of the run's total. The
// events' `output_tokens` are scaled so the turns sum to the output tokens the result reports.
const turnCosts = (turns: Turn[], result: Event | undefined): number[] =>
  turns.map(turn => {
    const used = result?.modelUsage?.[turn.model];
    const [cost, output, peers] =
      used?.costUSD === undefined
        ? [result?.total_cost_usd, result?.usage?.output_tokens, turns]
        : [
            used.costUSD,
            used.outputTokens,
            turns.filter(({ model }) => model === turn.model),
          ];
    const seen = peers.reduce(
      (sum, { usage }) => sum + (usage.output_tokens ?? 0),
      0
    );
    const scale = output === undefined || seen === 0 ? 1 : output / seen;
    const total = peers.reduce(
      (sum, { usage }) => sum + weightOf(usage, scale),
      0
    );

    return total === 0 || cost === undefined
      ? 0
      : (cost * weightOf(turn.usage, scale)) / total;
  });

// Each denial's cost: its turn's share, split between that turn's denied calls.
const costDenials = (
  denials: NonNullable<Event['permission_denials']>,
  events: Event[],
  result: Event | undefined
): (number | undefined)[] => {
  const turns = turnsOf(events);
  const costs = turnCosts(turns, result);
  const turnOf = (id?: string): number =>
    id === undefined ? -1 : turns.findIndex(({ calls }) => calls.has(id));
  const places = denials.map(({ tool_use_id }) => turnOf(tool_use_id));

  return places.map(at =>
    at < 0 ? undefined : costs[at] / places.filter(place => place === at).length
  );
};

// What a denied call was trying to do, on one line: the command, else the file, else nothing.
const detailOf = (input: Record<string, unknown> | undefined): string => {
  const value = input?.command ?? input?.file_path ?? '';

  return String(value).replace(/\s+/g, ' ').trim().slice(0, 200);
};

// The Bash calls the hook cut a `cd` from: they start with `cd <dir>` then `;` or `&&`, and weren't
// denied (a denied call never ran, so nothing was cut).
const countStripped = (
  events: Event[],
  dir: string | undefined,
  denied: Set<string | undefined>
): number => {
  if (!dir) {
    return 0;
  }

  const start = new RegExp(
    `^\\s*cd\\s+["']?${dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?\\s*(;|&&)`
  );

  return events
    .filter(({ type }) => type === 'assistant')
    .flatMap(({ message }) => message?.content ?? [])
    .filter(
      ({ id, input, name, type }) =>
        type === 'tool_use' &&
        name === 'Bash' &&
        !denied.has(id) &&
        start.test(String(input?.command ?? ''))
    ).length;
};

// Text as inline code in Markdown; a backtick inside it would end the span, so it becomes a quote.
export const inlineCode = (text: string): string =>
  `\`${text.replaceAll('`', "'")}\``;

export const parseTranscript = (text: string): Transcript | undefined => {
  let events: unknown;

  try {
    events = JSON.parse(text);
  } catch {
    return undefined;
  }

  if (!Array.isArray(events)) {
    return undefined;
  }

  const list = events as Event[];
  const init = list.find(
    ({ subtype, type }) => type === 'system' && subtype === 'init'
  );
  const result = list.findLast(({ type }) => type === 'result');
  const tools: Record<string, number> = {};

  for (const block of list
    .filter(({ type }) => type === 'assistant')
    .flatMap(({ message }) => message?.content ?? [])) {
    if (block.type === 'tool_use' && block.name) {
      const first = detailOf(block.input).split(' ')[0];
      const key = block.name === 'Bash' && first ? `Bash:${first}` : block.name;

      tools[key] = (tools[key] ?? 0) + 1;
    }
  }

  const denied = result?.permission_denials ?? [];
  const costs = costDenials(denied, list, result);

  return {
    costUsd: result?.total_cost_usd,
    denials: denied.map((denial, at) => ({
      costUsd: costs[at],
      detail: detailOf(denial.tool_input),
      tool: denial.tool_name ?? 'unknown',
    })),
    durationMs: result?.duration_ms,
    finalText: result?.result ?? '',
    model: init?.model,
    outcome: result?.subtype ?? 'no result',
    stripped: countStripped(
      list,
      init?.cwd,
      new Set(denied.map(({ tool_use_id }) => tool_use_id))
    ),
    tools,
    turns: result?.num_turns,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const numberOrUndefined = (value: unknown): number | undefined =>
  typeof value === 'number' ? value : undefined;

// Reads the summary `run` uploads. A transcript array, which runs before the summary uploaded, gives
// nothing (plan C415, D1).
export const readSummary = (text: string): Transcript | undefined => {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }

  if (
    !isRecord(value) ||
    !Array.isArray(value.denials) ||
    !value.denials.every(isRecord) ||
    typeof value.finalText !== 'string' ||
    typeof value.outcome !== 'string' ||
    !isRecord(value.tools)
  ) {
    return undefined;
  }

  return {
    costUsd: numberOrUndefined(value.costUsd),
    denials: value.denials.map(({ costUsd, detail, tool }) => ({
      costUsd: numberOrUndefined(costUsd),
      detail: String(detail ?? ''),
      tool: String(tool ?? 'unknown'),
    })),
    durationMs: numberOrUndefined(value.durationMs),
    finalText: value.finalText,
    model: typeof value.model === 'string' ? value.model : undefined,
    outcome: value.outcome,
    // Summaries uploaded before the hook have no count.
    stripped: numberOrUndefined(value.stripped) ?? 0,
    tools: Object.fromEntries(
      Object.entries(value.tools).filter(
        (entry): entry is [string, number] => typeof entry[1] === 'number'
      )
    ),
    turns: numberOrUndefined(value.turns),
  };
};

// Writes the transcript's summary, the only part of a run that is uploaded: the transcript holds
// every tool result, so any token a command printed. A file already there is removed first, and
// no transcript writes nothing. The summary is scanned before upload, so it has one field per line, and no
// `gitleaks:allow`, which makes gitleaks skip its line.
// Usage: node scripts/agent-transcript.mts <claude-execution-output.json> <summary.json>
export const run = (args: string[]): number => {
  const [input, output] = args;

  if (!input || !output) {
    console.error(
      'Usage: agent-transcript <claude-execution-output.json> <summary.json>'
    );

    return 1;
  }

  rmSync(output, { force: true });

  const transcript = existsSync(input)
    ? parseTranscript(readFileSync(input, 'utf8'))
    : undefined;

  if (transcript) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(
      output,
      JSON.stringify(transcript, null, 2).replaceAll(
        'gitleaks:allow',
        'gitleaks-allow'
      )
    );
  }

  return 0;
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(process.argv.slice(2));
}
