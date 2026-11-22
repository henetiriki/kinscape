import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) =>
  readFileSync(join(process.cwd(), '.claude/skills/refine', file), 'utf8');

describe('/refine skill text', () => {
  const skill = read('SKILL.md');

  it('checks the model before the mode list', () => {
    const model = skill.indexOf('/model opus');

    expect(model).toBeGreaterThan(-1);
    expect(model).toBeLessThan(skill.indexOf('The argument picks the mode'));
    expect(skill).toContain('/effort high');
  });

  it('runs the Spec checks in step 8, before filing', () => {
    const step = skill.indexOf('8. **Spec checks.**');
    const text = skill.slice(step, skill.indexOf('## Rules for every mode'));

    expect(step).toBeGreaterThan(skill.indexOf('7. **Check round.**'));

    for (const mode of ['`intent <number>`', '`spec`', '`chore`', '`bug`']) {
      expect(text).toContain(mode);
    }

    expect(text).toContain('git fetch origin main');
    expect(text).toContain('spec-checks.md');
    expect(text).toContain('Q<m>');
    expect(skill.indexOf('After step 8')).toBeGreaterThan(step);
    expect(skill.indexOf('After step 8')).toBeGreaterThan(
      skill.indexOf('## Filing with gh')
    );
  });

  it('tells a Chore to write each settled edge as one Constraints line', () => {
    expect(read('chore.md')).toContain(
      'write each edge that the interview settles as one line in Constraints'
    );
  });
});
