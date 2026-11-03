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

import { generate, run } from '@ks/scripts/workflows-diagram.mts';

const repo = join(import.meta.dirname, '../..');

const tokens = JSON.parse(
  readFileSync(join(repo, 'design/tokens.json'), 'utf8')
).colour;

let root: string;

const workflow = (file: string, text: string) =>
  writeFileSync(join(root, '.github/workflows', file), text);

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'workflows-'));
  mkdirSync(join(root, '.github/workflows'), { recursive: true });
});

afterEach(() => rmSync(root, { force: true, recursive: true }));

describe('the table', () => {
  it('lists each workflow once with its file and jobs, then a row per trigger', () => {
    workflow(
      'claude-plan.yml',
      [
        "name: 'Claude: Plan'",
        'on:',
        '  issues:',
        '    types: [labeled]',
        '  workflow_dispatch:',
        'jobs:',
        '  gate: {}',
        '  plan: {}',
      ].join('\n')
    );

    expect(generate(root)).toContain(
      [
        '| Workflow | Trigger | Filter | Jobs |',
        '| --- | --- | --- | --- |',
        '| Claude: Plan<br>`claude-plan.yml` | issues | `labeled` | gate · plan |',
        '| | workflow_dispatch | | |',
      ].join('\n')
    );
  });

  it('joins every filter on a trigger into its Filter cell', () => {
    workflow(
      'ci.yml',
      [
        'name: CI',
        'on:',
        '  pull_request:',
        '    types: [opened]',
        '    branches: [main]',
        '    paths-ignore: ["plans/**"]',
        '  push:',
        '    tags: ["v*"]',
        '    paths: [package-lock.json, .github/workflows/ci.yml]',
        '  schedule:',
        "    - cron: '0 6 * * 1'",
        'jobs:',
        '  one: {}',
      ].join('\n')
    );

    const readme = generate(root);

    expect(readme).toContain(
      '| CI<br>`ci.yml` | pull_request | `opened · main · paths-ignore: plans/**` | one |'
    );
    expect(readme).toContain(
      '| | push | `tags: v* · paths: package-lock.json, .github/workflows/ci.yml` | |'
    );
    expect(readme).toContain('| | schedule | `0 6 * * 1` | |');
  });

  it('fails on a filter holding a backslash before a pipe', () => {
    workflow(
      'ci.yml',
      "name: CI\non:\n  push:\n    branches: ['a\\|b']\njobs:\n  x: {}\n"
    );

    expect(() => generate(root)).toThrow('ci.yml: a filter can\'t hold "\\|"');
  });

  it('names the reusable workflow a workflow calls, and lists workflow_call as its trigger', () => {
    workflow(
      'claude-build.yml',
      "name: 'Claude: Build'\non: push\njobs:\n  go:\n    uses: owner/repo/.github/workflows/claude-run.yml@abc123\n  local:\n    uses: ./.github/workflows/claude-run.yml\n  step:\n    uses: actions/checkout@v7\n"
    );
    workflow(
      'claude-run.yml',
      "name: 'Claude: Run (shared)'\non:\n  workflow_call:\njobs:\n  run: {}\n"
    );

    const readme = generate(root);

    expect(readme).toContain(
      '| Claude: Build<br>`claude-build.yml` · calls Claude: Run (shared) | push | | go · local · step |'
    );
    expect(readme).toContain(
      '| Claude: Run (shared)<br>`claude-run.yml` | workflow_call | | run |'
    );
  });

  it('escapes backslashes, pipes and angle brackets in cells, and only pipes in the Filter code span', () => {
    workflow(
      'ci-a.yml',
      "name: 'CI: a | b <c> d\\'\non:\n  push:\n    branches: ['x|y<z\\']\njobs:\n  'j|k': {}\n"
    );

    expect(generate(root)).toContain(
      '| CI: a \\| b &lt;c&gt; d\\\\<br>`ci-a.yml` | push | `x\\|y<z\\` | j\\|k |'
    );
  });
});

describe('the diagrams', () => {
  const frontmatter = [
    '```mermaid',
    '---',
    'config:',
    '  theme: redux-color',
    '  look: neo',
    '  layout: elk',
    '---',
    'flowchart TB',
  ].join('\n');

  it('draws one per event family, headed by its events, with unlabelled edges', () => {
    workflow(
      'ci.yml',
      'name: CI\non:\n  pull_request:\n    types: [opened]\n  push:\n    branches: [main]\njobs:\n  lint: {}\n'
    );
    workflow(
      'backlog-spec-link.yml',
      "name: 'Backlog: Link Spec to Intent'\non:\n  issues:\n    types: [opened]\n  issue_comment:\n    types: [created]\njobs:\n  link: {}\n"
    );

    const readme = generate(root);

    expect(readme).toContain(
      `## Pull requests\n\n${frontmatter}\n  on_pull_request([pull_request])\n  ci["CI"]\n  on_pull_request --> ci\n`
    );
    expect(readme).toContain(
      `## Issues\n\n${frontmatter}\n  on_issue_comment([issue_comment])\n  on_issues([issues])\n  backlog_spec_link["Backlog: Link Spec to Intent"]\n  on_issue_comment --> backlog_spec_link\n  on_issues --> backlog_spec_link\n`
    );
    expect(readme).toContain(
      `## Push, schedule and manual runs\n\n${frontmatter}\n  on_push([push])\n  ci["CI"]\n  on_push --> ci\n`
    );
    expect(readme).not.toContain('-->|');
  });

  it('leaves out a family no workflow listens to', () => {
    workflow('ci.yml', 'name: CI\non: push\njobs:\n  x: {}\n');

    const readme = generate(root);

    expect(readme).not.toContain('## Pull requests');
    expect(readme).not.toContain('## Issues');
  });

  it("draws a called workflow in each caller's diagram, joined by a dotted edge", () => {
    workflow(
      'claude-build.yml',
      "name: 'Claude: Build'\non:\n  pull_request_review:\n    types: [submitted]\njobs:\n  go:\n    uses: ./.github/workflows/claude-run.yml\n"
    );
    workflow(
      'claude-plan.yml',
      "name: 'Claude: Plan'\non:\n  issues:\n    types: [labeled]\njobs:\n  go:\n    uses: ./.github/workflows/claude-run.yml\n"
    );
    workflow(
      'claude-run.yml',
      "name: 'Claude: Run (shared)'\non:\n  workflow_call:\njobs:\n  run: {}\n"
    );

    const readme = generate(root);

    expect(
      readme.match(/claude_run\["Claude: Run \(shared\)"\]/g)
    ).toHaveLength(2);
    expect(readme).toContain('  claude_build -.->|calls| claude_run\n');
    expect(readme).toContain('  claude_plan -.->|calls| claude_run\n');
    expect(readme).not.toContain('on_workflow_call');
  });

  it('names a called workflow outside the directory in the table only', () => {
    workflow(
      'claude-build.yml',
      "name: 'Claude: Build'\non: push\njobs:\n  go:\n    uses: owner/repo/.github/workflows/shared.yml@abc123\n"
    );

    const readme = generate(root);

    expect(readme).toContain(
      '| Claude: Build<br>`claude-build.yml` · calls shared |'
    );
    expect(readme).not.toContain('shared[');
    expect(readme).not.toContain('-.->');
  });

  it('fills each node by its name prefix, from the design tokens', () => {
    workflow('ci.yml', 'name: CI\non: push\njobs:\n  x: {}\n');
    workflow('ci-cache.yml', "name: 'CI: Cache'\non: push\njobs:\n  x: {}\n");
    workflow(
      'claude-plan.yml',
      "name: 'Claude: Plan'\non: push\njobs:\n  x: {}\n"
    );

    const readme = generate(root);

    expect(readme).toContain(
      `  classDef ci fill:${tokens['info-bg']},stroke:${tokens['info-border']}\n  classDef claude fill:${tokens['brand-tint']},stroke:${tokens.brand}\n  class ci_cache,ci ci\n  class claude_plan claude\n`
    );
    expect(readme).not.toContain('classDef actions');
  });

  it('escapes quotes and angle brackets in node labels', () => {
    workflow(
      'ci.yml',
      'name: \'CI: Say "hi" <now>\'\non: push\njobs:\n  x: {}\n'
    );

    expect(generate(root)).toContain(
      '  ci["CI: Say #quot;hi#quot; #lt;now#gt;"]'
    );
  });

  it('fails on an event outside the families', () => {
    workflow('ci.yml', 'name: CI\non: [push, release]\njobs:\n  x: {}\n');

    expect(() => generate(root)).toThrow(
      'ci.yml: no diagram family holds the release event'
    );
  });

  it('fails on a name prefix with no fill', () => {
    workflow('nameless.yml', 'on: push\njobs:\n  x: {}\n');

    expect(() => generate(root)).toThrow(
      'nameless.yml: no fill for the nameless.yml prefix'
    );
  });
});

it('reads only .yml files', () => {
  workflow('README.md', '# not a workflow');
  workflow('ci.yml', 'name: CI\non: push\njobs:\n  x: {}\n');

  expect(generate(root)).not.toContain('`README.md`');
});

it('writes .github/workflows/README.md', () => {
  workflow('ci.yml', 'name: CI\non: push\njobs:\n  x: {}\n');

  expect(run(root)).toBe(0);
  expect(readFileSync(join(root, '.github/workflows/README.md'), 'utf8')).toBe(
    generate(root)
  );
});

describe("this repo's README", () => {
  const readme = generate(repo);

  it.each(
    readdirSync(join(repo, '.github/workflows')).filter(file =>
      file.endsWith('.yml')
    )
  )('lists %s', file => {
    expect(readme).toContain(`<br>\`${file}\``);
  });

  // Fails locally and in CI's test job.
  it('is up to date with the workflows', () => {
    expect(
      readFileSync(join(repo, '.github/workflows/README.md'), 'utf8'),
      '.github/workflows/README.md is out of date: run `npm run workflows:diagram`'
    ).toBe(readme);
  });
});
