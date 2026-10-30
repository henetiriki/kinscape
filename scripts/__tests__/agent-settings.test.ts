import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The build agent's settings: .github/agent/settings.json.
const settings = JSON.parse(
  readFileSync(join(process.cwd(), '.github/agent/settings.json'), 'utf8')
) as { permissions: { deny: string[] } };

// Paths outside the workspace that hold credentials or the run's own files (plan C415, D2). The
// runner temp has checkout's credentials, the settings and the transcript.
const DENIED = [
  'Read(//proc/**)',
  'Read(//sys/**)',
  'Read(//etc/**)',
  'Read(//home/runner/work/_temp/**)',
  'Read(~/.gitconfig)',
  'Read(~/.config/**)',
];

describe('the build agent settings', () => {
  it.each(DENIED)('deny %s', rule => {
    expect(settings.permissions.deny).toContain(rule);
  });

  // Claude Code saves long tool output there, and reads it back with Read.
  it.each(['/tmp', '~/.claude'])('leave %s readable', path => {
    expect(
      settings.permissions.deny.filter(rule =>
        rule.replace('//', '/').startsWith(`Read(${path}`)
      )
    ).toEqual([]);
  });
});
