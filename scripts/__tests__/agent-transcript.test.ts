import { describe, expect, it } from 'vitest';

import { inlineCode, parseTranscript } from '../agent-transcript.mts';

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

describe('inlineCode', () => {
  it('wraps text in backticks, turning any inside into quotes', () => {
    expect(inlineCode('git log')).toBe('`git log`');
    expect(inlineCode('echo `id`')).toBe("`echo 'id'`");
  });
});

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

  describe('denial cost', () => {
    // A turn weighs 5 per output token.
    const turn = (
      id: string,
      calls: string[],
      usage: Record<string, unknown> = { output_tokens: 10 },
      model = 'm1'
    ) => ({
      message: {
        content: calls.map(call => ({
          id: call,
          name: 'Bash',
          type: 'tool_use',
        })),
        id,
        model,
        usage,
      },
      type: 'assistant',
    });

    const denied = (...ids: (string | undefined)[]) =>
      ids.map(tool_use_id => ({ tool_name: 'Bash', tool_use_id }));

    const costs = (events: unknown[]) =>
      parse(events)?.denials.map(({ costUsd }) => costUsd);

    it("splits each model's cost among that model's turns, counting a repeated turn once", () => {
      expect(
        costs([
          turn('a', ['t1']),
          turn('b', ['t2'], { output_tokens: 30 }),
          turn('b', ['t2b'], { output_tokens: 30 }),
          turn('c', ['t3'], { output_tokens: 10 }, 'm2'),
          result({
            modelUsage: { m1: { costUSD: 4 }, m2: { costUSD: 1 } },
            permission_denials: denied('t2b', 't3'),
          }),
        ])
      ).toEqual([3, 1]);
    });

    it("splits the run's cost when there is no cost per model, or none for the turn's model", () => {
      const events = [
        turn('a', ['t1']),
        turn('b', ['t2'], { output_tokens: 30 }),
      ];

      expect(
        costs([
          ...events,
          result({ permission_denials: denied('t1'), total_cost_usd: 2 }),
        ])
      ).toEqual([0.5]);
      expect(
        costs([
          ...events,
          result({
            modelUsage: { other: { costUSD: 9 } },
            permission_denials: denied('t2'),
            total_cost_usd: 2,
          }),
        ])
      ).toEqual([1.5]);
    });

    it('shares a turn between its denied calls', () => {
      expect(
        costs([
          turn('a', ['t1']),
          turn('b', ['t2', 't3'], { output_tokens: 30 }),
          result({ permission_denials: denied('t2', 't3'), total_cost_usd: 2 }),
        ])
      ).toEqual([0.75, 0.75]);
    });

    it('weighs input 1, cache write 1.25 (1-hour 2), cache read 0.1 and output 5', () => {
      const [first, second] =
        costs([
          turn('a', ['t1'], {
            cache_creation: {
              ephemeral_1h_input_tokens: 100,
              ephemeral_5m_input_tokens: 100,
            },
            cache_read_input_tokens: 1000,
            input_tokens: 100,
            output_tokens: 20,
          }),
          turn('b', ['t2'], { cache_creation_input_tokens: 80 }),
          result({
            permission_denials: denied('t1', 't2'),
            total_cost_usd: 7.25,
          }),
        ]) ?? [];

      expect(first).toBeCloseTo(6.25);
      expect(second).toBeCloseTo(1);
    });

    it("scales the events' output tokens to the total the result reports", () => {
      // An event's output_tokens is a snapshot from the start of the turn: the turns weigh 50 and
      // 100 as read, 100 each once the 10 seen are scaled to the 20 reported.
      const events = [
        turn('a', ['t1'], { output_tokens: 10 }),
        turn('b', ['t2'], { input_tokens: 100 }),
      ];

      expect(
        costs([
          ...events,
          result({
            modelUsage: { m1: { costUSD: 4, outputTokens: 20 } },
            permission_denials: denied('t1'),
          }),
        ])
      ).toEqual([2]);
      expect(
        costs([
          ...events,
          result({
            permission_denials: denied('t1'),
            total_cost_usd: 4,
            usage: { output_tokens: 20 },
          }),
        ])
      ).toEqual([2]);
    });

    it('reads the output tokens as they are when the result gives no total, or none was seen', () => {
      expect(
        costs([
          turn('a', ['t1'], { output_tokens: 10 }),
          turn('b', ['t2'], { input_tokens: 100 }),
          result({
            modelUsage: { m1: { costUSD: 3 } },
            permission_denials: denied('t1'),
          }),
        ])
      ).toEqual([1]);
      expect(
        costs([
          turn('a', ['t1'], { input_tokens: 100 }),
          result({
            modelUsage: { m1: { costUSD: 3, outputTokens: 5 } },
            permission_denials: denied('t1'),
          }),
        ])
      ).toEqual([3]);
    });

    it('has no cost for a denial it cannot place, and none for a turn it cannot price', () => {
      expect(
        costs([
          turn('a', ['t1'], {}),
          turn('h', [], { cache_creation: { ephemeral_1h_input_tokens: 5 } }),
          {
            message: {
              content: [{ type: 'text' }, { type: 'tool_use' }],
              id: 'n',
            },
            type: 'assistant',
          },
          {
            message: { content: [], usage: { output_tokens: 9 } },
            type: 'assistant',
          },
          { message: { id: 'z' }, type: 'assistant' },
          result({
            permission_denials: denied(undefined, 'unknown', 't1'),
            total_cost_usd: 2,
          }),
        ])
      ).toEqual([undefined, undefined, 0]);
      expect(
        costs([
          turn('a', ['t1']),
          result({
            permission_denials: denied('t1'),
            total_cost_usd: undefined,
          }),
        ])
      ).toEqual([0]);
    });
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
