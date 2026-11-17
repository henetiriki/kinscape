import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { TYPES } from '@ks/scripts/issue-status.mts';

// An `issues` event payload carries no `issue.type`, so a condition cannot test the Type. The title
// is in every payload, and its prefix names the Type. Each condition tests the prefix to skip the
// run. The prefix only filters: the job reads the Type from the API, and that read decides.
const DIR = join(process.cwd(), '.github/workflows');
const files = readdirSync(DIR).filter(name => name.endsWith('.yml'));

type Job = { if?: string; steps?: Step[] };
type Step = { if?: string };
type Workflow = { jobs: Record<string, Job>; 'run-name'?: string };

const flat = (text = '') => text.replace(/\s+/g, ' ');
const load = (file: string) =>
  parse(readFileSync(join(DIR, file), 'utf8')) as Workflow;
const count = (text: string, part: string) => text.split(part).length - 1;

const TITLE_TEST = /startsWith\(github\.event\.issue\.title, '[^']*'\)/g;
const title = (type: string) =>
  `startsWith(github.event.issue.title, '${type}: ')`;
const PLAN = `(${TYPES.map(title).join(' || ')}) &&`;
const SPEC = `${title('Spec')} &&`;

// Each workflow that filters on the title, with its job and the clause that both conditions hold.
const FILTERS = [
  ['claude-plan.yml', 'plan', PLAN, TYPES.length],
  ['backlog-spec-link.yml', 'link-spec', SPEC, 1],
  [
    'backlog-milestone.yml',
    'inherit',
    `github.event_name == 'issues' && ${SPEC}`,
    1,
  ],
  ['backlog-intent-ready.yml', 'flag-intent', SPEC, 1],
] as const;

describe('the title filter in a workflow condition', () => {
  it('is in only the listed workflows', () => {
    expect(
      files.filter(file => JSON.stringify(load(file)).match(TITLE_TEST)),
      'a workflow tests the issue title: add it to FILTERS'
    ).toEqual(FILTERS.map(([file]) => file).sort());
  });

  it.each(FILTERS)(
    'has the same clause in the run-name and the %s job %s',
    (file, job, clause, tests) => {
      const workflow = load(file);
      const conditions = {
        if: flat(workflow.jobs[job].if),
        'run-name': flat(workflow['run-name']),
      };

      for (const [name, text] of Object.entries(conditions)) {
        expect(
          count(text, clause),
          `the ${name} of ${file} needs \`${clause}\``
        ).toBe(1);
        expect(
          text.match(TITLE_TEST),
          `the ${name} of ${file} has a title test outside the clause`
        ).toHaveLength(tests);
      }
    }
  );

  it('replaces each test of the Type in a run-name and an if', () => {
    const conditions = files.flatMap(file => {
      const { jobs, 'run-name': runName } = load(file);
      const ifs = Object.values(jobs).flatMap(job => [
        job.if,
        ...(job.steps ?? []).map(step => step.if),
      ]);

      return [runName, ...ifs].map(text => [file, flat(String(text))]);
    });

    expect(
      conditions.filter(([, text]) => text.includes('github.event.issue.type')),
      'an `issues` payload has no `issue.type`: test the title prefix'
    ).toEqual([]);
  });

  it.each(FILTERS.slice(1))(
    'stops the script of %s unless the API says Spec',
    file => {
      expect(JSON.stringify(load(file))).toMatch(
        /current\??\.type\?\.name !== 'Spec'/
      );
    }
  );
});
