import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const DIR = join(process.cwd(), '.github/workflows');
const files = readdirSync(DIR).filter(name => name.endsWith('.yml'));
const read = (file: string) => readFileSync(join(DIR, file), 'utf8');

type Job = { steps?: Step[] };
type Step = { id?: string; uses?: string; with?: Record<string, string> };
type Workflow = { jobs: Record<string, Job> };

// The CI agent is a GitHub App (scripts/setup-github.sh names its bot). A job that acts as it mints
// a one-hour token with only the permissions it needs, right before the first step that uses it.
const TOKEN = '${{ steps.bot.outputs.token }}';
const MINT = /^actions\/create-github-app-token@[0-9a-f]{40}$/;
const uses = (value: unknown) => JSON.stringify(value).includes(TOKEN);

// Every job that uses the token, with its steps.
const bots = files.flatMap(file =>
  Object.entries((parse(read(file)) as Workflow).jobs)
    .filter(([, job]) => uses(job))
    .map(([name, job]) => [file, name, job.steps ?? []] as const)
);

describe('the App token', () => {
  it.each(files)('replaces the bot PAT in %s', file => {
    expect(read(file)).not.toContain('KINSCAPE_BOT_PAT');
  });

  it('is used by the jobs that act as the bot', () => {
    expect(bots.map(([file, job]) => `${file}:${job}`)).toEqual([
      'actions-pin-update.yml:update-pins',
      'claude-build.yml:approve',
      'claude-respond.yml:claude',
      'claude-run.yml:gate',
      'claude-run.yml:run',
      'claude-run.yml:return',
      'design-agent-shots.yml:commit',
    ]);
  });

  it.each(bots)(
    'in %s (%s) is minted by a pinned step with the App id, the key and named permissions',
    (file, job, steps) => {
      const mint = steps.find(step => step.id === 'bot');

      expect(mint?.uses, `${file} ${job} needs a step with id bot`).toMatch(
        MINT
      );
      expect(mint?.with).toMatchObject({
        'client-id': '${{ vars.KINSCAPE_APP_CLIENT_ID }}',
        'private-key': '${{ secrets.KINSCAPE_APP_PRIVATE_KEY }}',
      });
      expect(
        Object.keys(mint?.with ?? {}).filter(key =>
          key.startsWith('permission-')
        )
      ).not.toEqual([]);
    }
  );

  it.each(bots)(
    'in %s (%s) is minted right before the first step that uses it',
    (file, job, steps) => {
      const mint = steps.findIndex(step => step.id === 'bot');
      const first = steps.findIndex(step => uses(step));

      expect(first, `${file} ${job}`).toBe(mint + 1);
    }
  );

  // `gh … --json` is GraphQL, which shows an App's bot without its "[bot]" suffix, and `--author`
  // wants "app/<name>" for one; the safety net would otherwise count none of the bot's comments.
  it('is matched by the safety net without its "[bot]" suffix', () => {
    const step =
      read('claude-run.yml')
        .split('- name: ')
        .find(part => part.startsWith('Comment if Claude left none')) ?? '';

    expect(step).toContain('GQL_LOGIN=${BOT_LOGIN%\\[bot\\]}');
    expect(step).toContain('.author.login == \\$ENV.GQL_LOGIN');
    expect(step).toContain('--author "$author"');
  });

  // Only the pin PR changes workflow files, and a resolve run that merges a change from main.
  it.each(files)(
    'grants workflows write in %s only to the pin job and the runner',
    file => {
      expect(read(file).includes('permission-workflows')).toBe(
        file === 'actions-pin-update.yml' || file === 'claude-run.yml'
      );
    }
  );

  it('grants workflows write in the runner only on a resolve run', () => {
    const text = read('claude-run.yml');
    const mint = (parse(text) as Workflow).jobs.run.steps?.find(
      step => step.id === 'bot'
    );

    expect(text.match(/permission-workflows/g)).toHaveLength(1);
    expect(mint?.with?.['permission-workflows']).toBe(
      "${{ inputs.kind == 'resolve' && 'write' || '' }}"
    );
  });
});
