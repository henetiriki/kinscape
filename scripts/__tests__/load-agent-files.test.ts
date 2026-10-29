import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) =>
  readFileSync(join(root, '.github/workflows', file), 'utf8');

// The agent files and settings come from main, so a branch can't widen its own tools. A local
// `./.github/actions/...` path would run the checked-out branch's copy of the loader, so the
// callers name it by repo and `@main`, as claude-plan.yml and claude-build.yml name claude-run.yml.
const ACTION = 'henetiriki/kinscape/.github/actions/load-agent-files@main';

describe('the load-agent-files action', () => {
  it.each(['claude.yml', 'claude-run.yml'])(
    'is used from main, once, by %s',
    file => {
      const uses = read(file).match(/^\s*uses: (\S*load-agent-files\S*)/gm);

      expect(
        uses?.map(line => line.replace(/^\s*uses: /, '')),
        `${file} needs one "uses: ${ACTION}" step`
      ).toEqual([ACTION]);
    }
  );

  it.each(['claude.yml', 'claude-run.yml'])(
    'is the only place %s loads the agent files',
    file => {
      expect(
        read(file),
        `${file} should call the action, not download .github/agent/ itself`
      ).not.toContain('contents/.github/agent');
    }
  );
});
