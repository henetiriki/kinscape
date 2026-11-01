import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  inlineCode,
  parseTranscript,
  readSummary,
  run,
} from '../agent-transcript.mts';

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
      stripped: 0,
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

  // The hook cuts a leading `cd` into the run directory (plan C480, D1): a Bash call that starts
  // with one and was not denied was stripped.
  describe('stripped cd commands', () => {
    const cwd = '/work/kin.x';
    const start = { ...init, cwd };
    const bash = (id: string, command: string) => ({
      ...toolUse('Bash', { command }),
      id,
    });
    const stripped = (events: unknown[]) => parse(events)?.stripped;

    it('counts the calls that start with a cd into the run directory', () => {
      expect(
        stripped([
          start,
          assistant(
            bash('t1', `cd ${cwd} && gh pr view 1`),
            bash('t2', `  cd "${cwd}" ; git status`),
            bash('t3', `cd '${cwd}'&&ls`),
            bash('t4', 'gh pr view 2')
          ),
          result(),
        ])
      ).toBe(3);
    });

    it('leaves out a cd elsewhere, a cd that does not start the command, and one with no && or ;', () => {
      expect(
        stripped([
          start,
          assistant(
            bash('t1', 'cd app && ls'),
            bash('t2', `cd ${cwd}x && ls`),
            bash('t3', `ls && cd ${cwd} && ls`),
            bash('t4', `cd ${cwd}`),
            bash('t5', `cd /work/kinZx; ls`),
            { ...toolUse('Read'), id: 't6' },
            // A Bash call with no command, or with no input at all.
            { ...toolUse('Bash'), id: 't7' },
            { id: 't8', name: 'Bash', type: 'tool_use' },
            { type: 'tool_use' }
          ),
          // An assistant event with no content.
          { message: {}, type: 'assistant' },
          result(),
        ])
      ).toBe(0);
    });

    it('leaves out a cd the run denied', () => {
      expect(
        stripped([
          start,
          assistant(
            bash('t1', `cd ${cwd}; curl x`),
            bash('t2', `cd ${cwd}; git status`)
          ),
          result({
            permission_denials: [
              {
                tool_input: { command: `cd ${cwd}; curl x` },
                tool_name: 'Bash',
                tool_use_id: 't1',
              },
            ],
          }),
        ])
      ).toBe(1);
    });

    it('is 0 when the run has no init directory', () => {
      expect(
        stripped([init, assistant(bash('t1', `cd ${cwd}; ls`)), result()])
      ).toBe(0);
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
      stripped: 0,
      tools: { Read: 1 },
      turns: undefined,
    });
  });

  it('describes a result with no denials list', () => {
    const bare = { subtype: 'success', type: 'result' };

    expect(parse([init, bare])?.denials).toEqual([]);
  });
});

// The summary the artifact holds, as `run` writes it and `readSummary` reads it back.
const SUMMARY_KEYS = [
  'costUsd',
  'denials',
  'durationMs',
  'finalText',
  'model',
  'outcome',
  'stripped',
  'tools',
  'turns',
];

describe('readSummary', () => {
  it('reads a summary missing the figures a run did not reach', () => {
    expect(
      readSummary(
        JSON.stringify({
          denials: [{ detail: 'ls', tool: 'Bash' }, {}],
          finalText: '',
          outcome: 'no result',
          tools: {},
        })
      )
    ).toEqual({
      costUsd: undefined,
      denials: [
        { costUsd: undefined, detail: 'ls', tool: 'Bash' },
        { costUsd: undefined, detail: '', tool: 'unknown' },
      ],
      durationMs: undefined,
      finalText: '',
      model: undefined,
      outcome: 'no result',
      stripped: 0,
      tools: {},
      turns: undefined,
    });
  });

  // A summary from before the hook has no count.
  it('reads the stripped count, and counts a missing or non-numeric one as 0', () => {
    const summary = (stripped?: unknown) =>
      readSummary(
        JSON.stringify({
          denials: [],
          finalText: '',
          outcome: 'success',
          stripped,
          tools: {},
        })
      )?.stripped;

    expect(summary(4)).toBe(4);
    expect(summary()).toBe(0);
    expect(summary('4')).toBe(0);
  });

  it('drops tool counts that are not numbers', () => {
    expect(
      readSummary(
        JSON.stringify({
          denials: [],
          finalText: '',
          outcome: 'success',
          tools: { Bash: '3', Read: 2, Write: {} },
        })
      )?.tools
    ).toEqual({ Read: 2 });
  });

  // A transcript array is what runs before the change uploaded: plan decision D1 skips them.
  it.each([
    ['not json'],
    [''],
    ['null'],
    ['[]'],
    [JSON.stringify([init, result()])],
    ['{"outcome":"success"}'],
    ['{"denials":{},"finalText":"","outcome":"success","tools":{}}'],
    ['{"denials":[],"finalText":1,"outcome":"success","tools":{}}'],
    ['{"denials":[],"finalText":"","outcome":"success","tools":[]}'],
    ['{"denials":[null],"finalText":"","outcome":"success","tools":{}}'],
  ])('gives nothing for %j', text => {
    expect(readSummary(text)).toBeUndefined();
  });
});

describe('run', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'agent-transcript-'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true });
    vi.restoreAllMocks();
  });

  it('needs the transcript and summary paths', () => {
    expect(run([join(dir, 'in.json')])).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Usage')
    );
  });

  // The transcript holds every tool result: file contents and command output, with any token in them.
  it('writes only the summary, in a folder of its own, without the tool results', () => {
    const input = join(dir, 'claude-execution-output.json');
    const output = join(dir, 'summary', 'claude-execution-output.json');

    writeFileSync(
      input,
      JSON.stringify([
        init,
        assistant(toolUse('Bash', { command: 'cat .git/config' })),
        {
          message: {
            content: [
              {
                content: 'extraheader = AUTHORIZATION: basic c2VjcmV0',
                type: 'tool_result',
              },
            ],
          },
          type: 'user',
        },
        result(),
      ])
    );

    expect(run([input, output])).toBe(0);

    const text = readFileSync(output, 'utf8');

    expect(Object.keys(JSON.parse(text)).sort()).toEqual(SUMMARY_KEYS);
    expect(text).not.toContain('c2VjcmV0');
    expect(readSummary(text)).toEqual(
      parseTranscript(readFileSync(input, 'utf8'))
    );
  });

  // A planted file or symlink must not outlive a transcript that breaks the parser.
  it('removes any earlier file before reading the transcript', () => {
    const input = join(dir, 'claude-execution-output.json');
    const output = join(dir, 'summary', 'claude-execution-output.json');

    writeFileSync(input, '[null]');
    mkdirSync(join(dir, 'summary'));
    writeFileSync(output, '{"planted":true}');

    expect(() => run([input, output])).toThrow();
    expect(existsSync(output)).toBe(false);
  });

  // gitleaks skips any line holding its allow marker, so the marker in Claude's final message must
  // not hide a secret elsewhere in the summary.
  it('writes one field per line, without gitleaks allow markers', () => {
    const input = join(dir, 'claude-execution-output.json');
    const output = join(dir, 'summary', 'claude-execution-output.json');

    writeFileSync(
      input,
      JSON.stringify([init, result({ result: 'Skip it: gitleaks:allow' })])
    );
    run([input, output]);

    const text = readFileSync(output, 'utf8');

    expect(text).not.toContain('gitleaks:allow');
    expect(text).toContain('\n  "finalText": "Skip it: gitleaks-allow",\n');
  });

  // No file is no review: the since-last-review check looks for the artifact. A file already there,
  // which the agent could have written, is no summary of this run.
  it.each([
    ['is missing', undefined],
    ['is not a transcript', 'half a fi'],
  ])(
    'writes nothing, and removes any earlier file, when the transcript %s',
    (_, text) => {
      const input = join(dir, 'claude-execution-output.json');
      const output = join(dir, 'summary', 'claude-execution-output.json');

      if (text !== undefined) {
        writeFileSync(input, text);
      }
      mkdirSync(join(dir, 'summary'));
      writeFileSync(output, '{"planted":true}');

      expect(run([input, output])).toBe(0);
      expect(existsSync(output)).toBe(false);
    }
  );
});
