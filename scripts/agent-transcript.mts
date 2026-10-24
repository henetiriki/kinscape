// Reads the transcript claude-code-action leaves in claude-execution-output.json: a JSON array of
// events. Shared by the run summary and the weekly denial audit.

export type Denial = { detail: string; tool: string };

export type Transcript = {
  costUsd: number | undefined;
  denials: Denial[];
  durationMs: number | undefined;
  finalText: string;
  model: string | undefined;
  // The result event's subtype ("success", "error_max_turns", ...), or "no result" if the run
  // stopped before one.
  outcome: string;
  // Tool calls by name; a Bash call is counted by the command it starts with (`Bash:npm`).
  tools: Record<string, number>;
  turns: number | undefined;
};

type Block = { input?: Record<string, unknown>; name?: string; type?: string };

type Event = {
  duration_ms?: number;
  message?: { content?: Block[] };
  model?: string;
  num_turns?: number;
  permission_denials?: {
    tool_input?: Record<string, unknown>;
    tool_name?: string;
  }[];
  result?: string;
  subtype?: string;
  total_cost_usd?: number;
  type?: string;
};

// What a denied call was trying to do, on one line: the command, else the file, else nothing.
const detailOf = (input: Record<string, unknown> | undefined): string => {
  const value = input?.command ?? input?.file_path ?? '';

  return String(value).replace(/\s+/g, ' ').trim().slice(0, 200);
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

  return {
    costUsd: result?.total_cost_usd,
    denials: (result?.permission_denials ?? []).map(denial => ({
      detail: detailOf(denial.tool_input),
      tool: denial.tool_name ?? 'unknown',
    })),
    durationMs: result?.duration_ms,
    finalText: result?.result ?? '',
    model: init?.model,
    outcome: result?.subtype ?? 'no result',
    tools,
    turns: result?.num_turns,
  };
};
