import { describe, expect, it } from 'vitest';

import { parseTranscript } from '../agent-transcript.mts';

const init = { model: 'claude-opus-5-5', subtype: 'init', type: 'system' };

const assistant = (...content: unknown[]) => ({
  message: { content },
  type: 'assistant',
});

const toolUse = (name: string, input: Record<string, unknown> = {}) => ({
  input,
  name,
  type: 'tool_use',
});

const result = (extra: Record<string, unknown> = {}) => ({
  duration_ms: 281759,
  num_turns: 80,
  permission_denials: [],
  result: 'Done.',
  subtype: 'success',
  total_cost_usd: 2.07,
  type: 'result',
  ...extra,
});

const parse = (events: unknown) => parseTranscript(JSON.stringify(events));

describe('parseTranscript', () => {
  it.each([['not json'], [''], ['{"type":"result"}'], ['null']])(
    'gives nothing for %j',
    text => {
      expect(parseTranscript(text)).toBeUndefined();
    }
  );

  it('reads the run figures from the init and result events', () => {
    expect(parse([init, result()])).toEqual({
      costUsd: 2.07,
      denials: [],
      durationMs: 281759,
      finalText: 'Done.',
      model: 'claude-opus-5-5',
      outcome: 'success',
      tools: {},
      turns: 80,
    });
  });

  it('uses the last result event', () => {
    expect(
      parse([init, result({ result: 'first' }), result({ result: 'last' })])
        ?.finalText
    ).toBe('last');
  });

  it('counts tools, and a Bash call by the command it starts with', () => {
    const transcript = parse([
      init,
      assistant(
        toolUse('Read', { file_path: 'a.ts' }),
        toolUse('Bash', { command: 'git status' }),
        { text: 'thinking', type: 'text' }
      ),
      assistant(
        toolUse('Read', { file_path: 'b.ts' }),
        toolUse('Bash', { command: 'git diff' }),
        toolUse('Bash', { command: 'npm   run lint' }),
        toolUse('Bash', { command: '' }),
        { type: 'tool_use' }
      ),
      { message: {}, type: 'assistant' },
      { type: 'user' },
      result(),
    ]);

    expect(transcript?.tools).toEqual({
      Bash: 1,
      'Bash:git': 2,
      'Bash:npm': 1,
      Read: 2,
    });
  });

  it('describes each denial by its command, else its file, else nothing', () => {
    const transcript = parse([
      init,
      result({
        permission_denials: [
          {
            tool_input: { command: 'cat a |\n   tail -5' },
            tool_name: 'Bash',
          },
          { tool_input: { file_path: '/tmp/x' }, tool_name: 'Write' },
          { tool_input: {}, tool_name: 'Agent' },
          {},
        ],
      }),
    ]);

    expect(transcript?.denials).toEqual([
      { detail: 'cat a | tail -5', tool: 'Bash' },
      { detail: '/tmp/x', tool: 'Write' },
      { detail: '', tool: 'Agent' },
      { detail: '', tool: 'unknown' },
    ]);
  });

  it('cuts a long command to 200 characters', () => {
    const transcript = parse([
      init,
      result({
        permission_denials: [
          { tool_input: { command: 'x'.repeat(500) }, tool_name: 'Bash' },
        ],
      }),
    ]);

    expect(transcript?.denials[0].detail).toHaveLength(200);
  });

  it('describes a run that stopped before a result', () => {
    expect(parse([assistant(toolUse('Read'))])).toEqual({
      costUsd: undefined,
      denials: [],
      durationMs: undefined,
      finalText: '',
      model: undefined,
      outcome: 'no result',
      tools: { Read: 1 },
      turns: undefined,
    });
  });

  it('describes a result with no denials list', () => {
    const bare = { subtype: 'success', type: 'result' };

    expect(parse([init, bare])?.denials).toEqual([]);
  });
});
