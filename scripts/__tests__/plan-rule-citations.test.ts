import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// A file names a plan rule by its anchor in plans/README.md, never by its number: a renumbered
// list would leave every number wrong and no check would fail.
const PLAN_RULES = 'plans/README.md';
const RULE_NAMES = [
  'plans-committed-first',
  'plan-pr-flow',
  'chores',
  'small-departures',
  'big-departures',
  'too-big',
  'missing-components',
  'failing-tests',
  'stale-facts',
  'related-issues',
  'test-first',
  'hand-back',
  'design-system',
  'ready-check',
  'build-ownership',
];
// An owner is a file that a run or a session loads: an agent file, a Claude workflow, a skill or
// AGENTS.md. A rule that no owner cites has no step that points at it, so no run applies it.
const OWNERS = [
  '.github/agent/*.md',
  '.github/workflows/claude-*.yml',
  '.claude/skills/**/*.md',
  'AGENTS.md',
];
// The other files that cite a plan rule. A cite here does not make the file an owner.
const IN_SCOPE = [
  'plans/README.md',
  'docs/building.md',
  '.github/pull_request_template.md',
  'eslint.config.mjs',
  'scripts/agent-approve.mts',
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

// Rule names that no owner text cites.
const unowned = (names: string[], ownerTexts: string[]) => {
  const cited = new Set(ownerTexts.flatMap(text => citedNames(text)));

  return names.filter(name => !cited.has(name));
};

const ownerFiles = () =>
  execFileSync(
    'git',
    ['ls-files', '--', ...OWNERS.map(glob => `:(glob)${glob}`)],
    { encoding: 'utf8' }
  )
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

  it('names a rule that no owner cites', () => {
    expect(
      unowned(
        ['too-big', 'test-first', 'hand-back'],
        [
          'the [test-first rule](../../plans/README.md#test-first)',
          'as plans/README.md, hand-back rule says',
        ]
      )
    ).toEqual(['too-big']);
  });
});

describe('plan rule citations (repo)', () => {
  const rules = readFileSync(PLAN_RULES, 'utf8');
  const owners = ownerFiles();
  const files = [...new Set([...IN_SCOPE, ...owners])];

  it('finds each kind of owner', () => {
    expect(owners).toContain('AGENTS.md');
    expect(owners).toContain('.github/agent/build.md');
    expect(owners).toContain('.github/workflows/claude-plan.yml');
    expect(owners).toContain('.claude/skills/build-local/SKILL.md');
    expect(owners.filter(path => path.startsWith('docs/'))).toEqual([]);
  });

  it('an owner cites each rule in plans/README.md', () => {
    expect(
      unowned(
        anchors(rules),
        owners.map(path => readFileSync(path, 'utf8'))
      )
    ).toEqual([]);
  });

  it('plans/README.md has one named anchor in each rule', () => {
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
