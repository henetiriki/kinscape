import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// A file names a plan rule by its anchor in plans/README.md or plans/BUILD.md, never by its
// number: a renumbered list would leave every number wrong and no check would fail.
// Each rule file lists its `##` headings, with the anchors under each in order.
const RULE_FILES = [
  {
    path: 'plans/README.md',
    sections: [
      { anchors: ['item-types'], heading: 'Item types' },
      {
        anchors: ['stale-facts', 'related-issues'],
        heading: 'Before you draft',
      },
      { anchors: ['plan-pr-flow'], heading: 'Plan PR' },
      { anchors: ['hand-back', 'design-system'], heading: 'Who builds' },
      { anchors: ['missing-components'], heading: 'While you build' },
      { anchors: ['too-big'], heading: 'When the plan changes' },
    ],
  },
  {
    path: 'plans/BUILD.md',
    sections: [
      { anchors: ['build-ownership'], heading: 'Who builds' },
      { anchors: ['test-first', 'failing-tests'], heading: 'While you build' },
      {
        anchors: ['small-departures', 'big-departures'],
        heading: 'When the plan changes',
      },
      { anchors: ['ready-check'], heading: 'Before ready' },
    ],
  },
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
  ...RULE_FILES.map(rule => rule.path),
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
const IN_FILE_LINK = /\]\(#([\w-]+)\)/g;

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const numberCitations = (text: string) =>
  [...text.matchAll(BY_NUMBER)].map(m => m[0]);

const anchors = (text: string) => [...text.matchAll(ANCHOR)].map(m => m[1]);

// The anchors under each `##` heading, in order. A heading with no anchor has an empty list.
const sections = (text: string) =>
  text
    .split(/^## /m)
    .slice(1)
    .map(block => ({
      anchors: anchors(block),
      heading: block.split('\n')[0],
    }));

// Anchor names a text cites in one rule file: links to it, links inside it, links from a file
// beside it and plain-text names.
const citedNames = (
  text: string,
  rulePath: string,
  where: { inPlans?: boolean; inRules?: boolean } = {}
) => {
  const name = escaped(rulePath);
  const file = escaped(rulePath.replace('plans/', ''));

  return [
    ...[...text.matchAll(new RegExp(`${name}#([\\w-]+)`, 'g'))].map(m => m[1]),
    ...(where.inRules ? [...text.matchAll(IN_FILE_LINK)].map(m => m[1]) : []),
    ...(where.inPlans
      ? [...text.matchAll(new RegExp(`\\]\\(${file}#([\\w-]+)\\)`, 'g'))].map(
          m => m[1]
        )
      : []),
    ...[...text.matchAll(new RegExp(`${name}, ([\\w-]+) rule`, 'g'))].map(
      m => m[1]
    ),
  ];
};

const missingAnchors = (
  text: string,
  known: string[],
  rulePath: string,
  where: { inPlans?: boolean; inRules?: boolean } = {}
) =>
  [...new Set(citedNames(text, rulePath, where))].filter(
    name => !known.includes(name)
  );

// Rule names that no owner text cites.
const unowned = (names: string[], ownerTexts: string[], rulePath: string) => {
  const cited = new Set(ownerTexts.flatMap(text => citedNames(text, rulePath)));

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
  const README = 'plans/README.md';
  const BUILD = 'plans/BUILD.md';

  it('finds a citation by number', () => {
    expect(
      numberCitations('Follow plans/README.md rule 10, then rules 2 and 4.')
    ).toEqual(['rule 10', 'rules 2']);
  });

  it('accepts a citation by name', () => {
    expect(
      numberCitations(
        'Follow [the failing-tests rule](plans/BUILD.md#failing-tests).'
      )
    ).toEqual([]);
  });

  it('finds a citation by number in a comment', () => {
    expect(numberCitations('// plans/README.md rule 4')).toEqual(['rule 4']);
  });

  it('maps each heading to its anchors', () => {
    expect(
      sections(
        'Intro <a id="x"></a>\n## One\n<a id="a"></a>**A.** x\n<a id="b"></a>**B.** y\n## Two\n<a id="c"></a>**C.** z'
      )
    ).toEqual([
      { anchors: ['a', 'b'], heading: 'One' },
      { anchors: ['c'], heading: 'Two' },
    ]);
  });

  it('finds a heading with no anchor', () => {
    expect(
      sections('## One\n<a id="a"></a>**A.** x\n## Two\n**B.** y')
    ).toEqual([
      { anchors: ['a'], heading: 'One' },
      { anchors: [], heading: 'Two' },
    ]);
  });

  it('names a link to a removed anchor', () => {
    const known = anchors('1. <a id="failing-tests"></a>**Failing tests.**');

    expect(
      missingAnchors(
        '[a](../plans/BUILD.md#failing-tests) [b](../plans/BUILD.md#test-first)',
        known,
        BUILD
      )
    ).toEqual(['test-first']);
  });

  it('names a plain-text name that has no anchor', () => {
    expect(
      missingAnchors('plans/BUILD.md, failing-tests rule', [], BUILD)
    ).toEqual(['failing-tests']);
  });

  it('names an in-file link to a removed anchor', () => {
    expect(
      missingAnchors('see [the rule](#too-big)', [], README, {
        inRules: true,
      })
    ).toEqual(['too-big']);
    expect(missingAnchors('see [the rule](#too-big)', [], README)).toEqual([]);
  });

  it('names a sibling link to a removed anchor, only in a file under plans/', () => {
    const text = 'see [the rule](BUILD.md#test-first)';

    expect(missingAnchors(text, [], BUILD, { inPlans: true })).toEqual([
      'test-first',
    ]);
    expect(missingAnchors(text, [], BUILD)).toEqual([]);
    expect(
      missingAnchors('see [the rule](../BUILD.md#test-first)', [], BUILD, {
        inPlans: true,
      })
    ).toEqual([]);
  });

  it('does not take a cite of another rule file', () => {
    expect(
      missingAnchors('the [rule](../../plans/README.md#test-first)', [], BUILD)
    ).toEqual([]);
    expect(
      missingAnchors(
        'the [rule](../../plans/README.md#test-first)',
        ['hand-back'],
        README
      )
    ).toEqual(['test-first']);
  });

  it('names a rule that no owner cites', () => {
    expect(
      unowned(
        ['too-big', 'test-first', 'hand-back'],
        [
          'the [test-first rule](../../plans/BUILD.md#test-first)',
          'as plans/BUILD.md, hand-back rule says',
        ],
        BUILD
      )
    ).toEqual(['too-big']);
  });
});

describe('plan rule citations (repo)', () => {
  const rules = RULE_FILES.map(rule => ({
    ...rule,
    text: readFileSync(rule.path, 'utf8'),
  }));
  const owners = ownerFiles();
  const files = [...new Set([...IN_SCOPE, ...owners])];

  it('finds each kind of owner', () => {
    expect(owners).toContain('AGENTS.md');
    expect(owners).toContain('.github/agent/build.md');
    expect(owners).toContain('.github/workflows/claude-plan.yml');
    expect(owners).toContain('.claude/skills/build-local/SKILL.md');
    expect(owners.filter(path => path.startsWith('docs/'))).toEqual([]);
  });

  it.each(rules)('an owner cites each rule in $path', rule => {
    expect(
      unowned(
        anchors(rule.text),
        owners.map(path => readFileSync(path, 'utf8')),
        rule.path
      )
    ).toEqual([]);
  });

  it.each(rules)('$path has each named anchor under its heading', rule => {
    expect(sections(rule.text)).toEqual(rule.sections);
  });

  it('no file cites a plan rule by number', () => {
    const cited = files.flatMap(path =>
      numberCitations(readFileSync(path, 'utf8')).map(
        citation => `${path}: ${citation}`
      )
    );

    expect(cited).toEqual([]);
  });

  it.each(rules)('every cited rule name has an anchor in $path', rule => {
    const known = anchors(rule.text);
    const missing = files.flatMap(path =>
      missingAnchors(readFileSync(path, 'utf8'), known, rule.path, {
        inPlans: path.startsWith('plans/'),
        inRules: path === rule.path,
      }).map(name => `${path}: ${name}`)
    );

    expect(missing).toEqual([]);
  });
});
