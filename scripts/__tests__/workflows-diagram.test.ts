import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { generate, run } from '../workflows-diagram.mts';

const repo = join(import.meta.dirname, '../..');

let root: string;

const workflow = (file: string, text: string) =>
  writeFileSync(join(root, '.github/workflows', file), text);

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'workflows-'));
  mkdirSync(join(root, '.github/workflows'), { recursive: true });
});

afterEach(() => rmSync(root, { force: true, recursive: true }));

describe('generate', () => {
  it('draws each workflow with its file and jobs, grouped by its name prefix', () => {
    workflow(
      'claude-plan.yml',
      "name: 'Claude: Plan'\non: push\njobs:\n  gate: {}\n  plan: {}\n"
    );

    const diagram = generate(root);

    expect(diagram).toContain('subgraph g_Claude [Claude]');
    expect(diagram).toContain(
      'claude_plan["Claude: Plan<br>claude-plan.yml<br>gate · plan"]'
    );
  });

  it('groups a name with no prefix by its first word, and falls back to the file name', () => {
    workflow('ci.yml', 'name: CI\non: push\njobs:\n  lint: {}\n');
    workflow('nameless.yml', 'on: push\njobs:\n  only: {}\n');

    const diagram = generate(root);

    expect(diagram).toContain('subgraph g_CI [CI]');
    expect(diagram).toContain(
      'subgraph g_nameless [nameless.yml]\n    nameless["nameless.yml<br>nameless.yml<br>only"]'
    );
  });

  it('joins each trigger to its workflows, labelled with its types, branches or schedule', () => {
    workflow(
      'a.yml',
      [
        'name: A',
        'on:',
        '  issues:',
        '    types: [opened, closed]',
        '  push:',
        '    branches: [main]',
        '  schedule:',
        "    - cron: '0 6 * * 1'",
        '  workflow_dispatch:',
        'jobs:',
        '  one: {}',
      ].join('\n')
    );
    workflow('b.yml', 'name: B\non: [issues]\njobs:\n  two: {}\n');

    const diagram = generate(root);

    expect(diagram).toContain('on_issues([issues])');
    expect(diagram).toContain('on_issues -->|"opened, closed"| a');
    expect(diagram).toContain('on_push -->|"main"| a');
    expect(diagram).toContain('on_schedule -->|"0 6 * * 1"| a');
    expect(diagram).toContain('on_workflow_dispatch --> a');
    expect(diagram).toContain('on_issues --> b');
  });

  it('draws a call to a reusable workflow instead of its workflow_call trigger', () => {
    workflow(
      'caller.yml',
      'name: Caller\non: push\njobs:\n  go:\n    uses: owner/repo/.github/workflows/shared.yml@abc123\n  local:\n    uses: ./.github/workflows/shared.yml\n  step:\n    uses: actions/checkout@v7\n'
    );
    workflow(
      'shared.yml',
      'name: Shared\non:\n  workflow_call:\njobs:\n  run: {}\n'
    );

    const diagram = generate(root);

    expect(diagram.match(/caller -\.->\|calls\| shared/g)).toHaveLength(1);
    expect(diagram).not.toContain('on_workflow_call');
  });

  it('escapes quotes and angle brackets in names', () => {
    workflow('q.yml', 'name: \'Say "hi" <now>\'\non: push\njobs:\n  x: {}\n');

    expect(generate(root)).toContain('Say #quot;hi#quot; #lt;now#gt;<br>');
  });

  it('reads only .yml files', () => {
    workflow('README.md', '# not a workflow');
    workflow('x.yml', 'name: X\non: push\njobs:\n  x: {}\n');

    expect(generate(root)).not.toContain('<br>README.md<br>');
  });
});

it('writes .github/workflows/README.md', () => {
  workflow('x.yml', 'name: X\non: push\njobs:\n  x: {}\n');

  expect(run(root)).toBe(0);
  expect(readFileSync(join(root, '.github/workflows/README.md'), 'utf8')).toBe(
    generate(root)
  );
});

describe("this repo's diagram", () => {
  const diagram = generate(repo);

  it.each(
    readdirSync(join(repo, '.github/workflows')).filter(file =>
      file.endsWith('.yml')
    )
  )('draws %s', file => {
    expect(diagram).toContain(`<br>${file}<br>`);
  });

  // Fails locally and in CI's test job.
  it('is up to date with the workflows', () => {
    expect(
      readFileSync(join(repo, '.github/workflows/README.md'), 'utf8'),
      '.github/workflows/README.md is out of date: run `npm run workflows:diagram`'
    ).toBe(diagram);
  });
});
