import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// An `issues` event payload may not carry `issue.type`. The bot also sets the Type after it creates
// the issue. No run shows the field in a payload. A bare `issue.type.name` test is then false, and the
// job skips. Each test needs the guard `!github.event.issue.type ||`. The job then reads the Type
// from the API. A REST object always carries `type`.
const DIR = join(process.cwd(), '.github/workflows');
const flat = (file: string) =>
  readFileSync(join(DIR, file), 'utf8').replace(/\s+/g, ' ');

const READ = /github\.event\.issue\.type\.name/g;
const READS_TYPE = /github\.event\.issue\.type\.name/;
const GUARDED =
  /\(!github\.event\.issue\.type \|\| (?:contains\(fromJSON\('\["Spec","Bug","Chore"\]'\), )?github\.event\.issue\.type\.name/g;

// A workflow that reads the Type from the payload is listed here. The gate of claude-plan.yml is
// scripts/agent-gate.mts, which its own tests cover.
const READERS = [
  'backlog-intent-ready.yml',
  'backlog-milestone.yml',
  'backlog-spec-link.yml',
  'claude-plan.yml',
];
const SCRIPTS = READERS.filter(file => file !== 'claude-plan.yml');

describe('the issue Type in a workflow condition', () => {
  it('is read from the payload only by the listed workflows', () => {
    expect(
      readdirSync(DIR)
        .filter(file => file.endsWith('.yml'))
        .filter(file => READS_TYPE.test(flat(file))),
      'a workflow tests `github.event.issue.type.name`: add it to READERS, with the guard'
    ).toEqual(READERS);
  });

  it.each(READERS)(
    'has the guard on each test in the run-name and the job of %s',
    file => {
      const text = flat(file);

      expect(text.match(READ)).toHaveLength(2);
      expect(
        text.match(GUARDED),
        `${file} needs \`(!github.event.issue.type || …)\` around each Type test`
      ).toHaveLength(2);
    }
  );

  it.each(SCRIPTS)('stops the script of %s unless the API says Spec', file => {
    expect(flat(file)).toMatch(/current\??\.type\?\.name !== 'Spec'/);
  });
});
