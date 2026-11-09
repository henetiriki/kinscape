import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// A file names a plan rule by its anchor in plans/README.md, never by its number: a renumbered
// list would leave every number wrong and no check would fail.
const PLAN_RULES = 'plans/README.md';
const RULE_NAMES = [
  'draft-before-code',
  'plans-committed-first',
  'plan-pr-flow',
  'chores',
  'small-departures',
  'big-departures',
  'too-big',
  'approval',
  'missing-components',
  'failing-tests',
  'stale-facts',
  'test-first',
  'hand-back',
];
const IN_SCOPE = [
  'plans/README.md',
  'AGENTS.md',
  'docs/building.md',
  '.github/pull_request_template.md',
  '.claude/skills/refine/chore.md',
  'eslint.config.mjs',
  'scripts/agent-approve.mts',
  '.github/workflows/claude-plan.yml',
  '.github/workflows/claude-build.yml',
  '.github/workflows/claude-fix-review.yml',
  '.github/workflows/claude-hand-back.yml',
  '.github/workflows/claude-resolve-conflict.yml',
  '.github/ISSUE_TEMPLATE/4-chore.yml',
  'scripts/hand-back.mts',
  'scripts/__tests__/load-agent-files.test.ts',
  'scripts/__tests__/test-modifiers-config.test.ts',
];
const BY_NUMBER = /\brules?\s+\d+/gi;
const ANCHOR = /<a id="([^"]+)"><\/a>/g;
const LINKED = /plans\/README\.md#([\w-]+)/g;
const IN_FILE_LINK = /\]\(#([\w-]+)\)/g;
const NAMED = /plans\/README\.md, ([\w-]+) rule/g;

const numberCitations = (text: string) =>
  [...text.matchAll(BY_NUMBER)].map(m => m[0]);

const anchors = (text: string) => [...text.matchAll(ANCHOR)].map(m => m[1]);

// Numbered list items that do not start with an anchor.
const unanchoredItems = (text: string) =>
  text
    .split('\n')
    .filter(line => /^\d+\. /.test(line) && !/^\d+\. <a id="/.test(line))
    .map(line => line.slice(0, 40));

// Anchor names a text cites: links to plans/README.md, links inside it and plain-text names.
const citedNames = (text: string, inRules = false) => [
  ...[...text.matchAll(LINKED)].map(m => m[1]),
  ...(inRules ? [...text.matchAll(IN_FILE_LINK)].map(m => m[1]) : []),
  ...[...text.matchAll(NAMED)].map(m => m[1]),
];

const missingAnchors = (text: string, known: string[], inRules = false) =>
  [...new Set(citedNames(text, inRules))].filter(name => !known.includes(name));

const trackedAgentFiles = () =>
  execFileSync('git', ['ls-files', '.github/agent/*.md'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);

describe('plan rule citations (fixtures)', () => {
  it('finds a citation by number', () => {
    expect(
      numberCitations('Follow plans/README.md rule 10, then rules 2 and 4.')
    ).toEqual(['rule 10', 'rules 2']);
  });

  it('accepts a citation by name', () => {
    expect(
      numberCitations(
        'Follow [the failing-tests rule](plans/README.md#failing-tests).'
      )
    ).toEqual([]);
  });

  it('finds a citation by number in a comment', () => {
    expect(numberCitations('// plans/README.md rule 4')).toEqual(['rule 4']);
  });

  it('finds a list item without an anchor', () => {
    expect(unanchoredItems('1. <a id="a"></a>**A.** x\n2. **B.** y')).toEqual([
      '2. **B.** y',
    ]);
  });

  it('names a link to a removed anchor', () => {
    const known = anchors('1. <a id="failing-tests"></a>**Failing tests.**');

    expect(
      missingAnchors(
        '[a](../plans/README.md#failing-tests) [b](../plans/README.md#test-first)',
        known
      )
    ).toEqual(['test-first']);
  });

  it('names a plain-text name that has no anchor', () => {
    expect(missingAnchors('plans/README.md, failing-tests rule', [])).toEqual([
      'failing-tests',
    ]);
  });

  it('names an in-file link to a removed anchor', () => {
    expect(missingAnchors('see [the rule](#too-big)', [], true)).toEqual([
      'too-big',
    ]);
    expect(missingAnchors('see [the rule](#too-big)', [])).toEqual([]);
  });
});

describe('plan rule citations (repo)', () => {
  const rules = readFileSync(PLAN_RULES, 'utf8');
  const files = [...new Set([...IN_SCOPE, ...trackedAgentFiles()])];

  it('plans/README.md has one named anchor in each of its 13 rules', () => {
    expect(unanchoredItems(rules)).toEqual([]);
    expect(anchors(rules)).toEqual(RULE_NAMES);
  });

  it('no file cites a plan rule by number', () => {
    const cited = files.flatMap(path =>
      numberCitations(readFileSync(path, 'utf8')).map(
        citation => `${path}: ${citation}`
      )
    );

    expect(cited).toEqual([]);
  });

  it('every cited rule name has an anchor in plans/README.md', () => {
    const known = anchors(rules);
    const missing = files.flatMap(path =>
      missingAnchors(
        readFileSync(path, 'utf8'),
        known,
        path === PLAN_RULES
      ).map(name => `${path}: ${name}`)
    );

    expect(missing).toEqual([]);
  });
});
