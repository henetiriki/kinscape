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

describe('/refine edit comment', () => {
  const filing = read('filing.md');
  const write = filing.slice(
    filing.indexOf('### Write'),
    filing.indexOf('## If `gh` fails')
  );
  const step = (n: number) => {
    const start = write.indexOf(`\n${n}. `);
    const end = write.indexOf(`\n${n + 1}. `);

    expect(start).toBeGreaterThan(-1);

    return write.slice(start, end === -1 ? undefined : end);
  };
  const handOver = (file: string) => {
    const text = read(file);

    return text.slice(text.indexOf('## Hand-over'));
  };

  it('posts one comment after the body edit', () => {
    const text = step(4);

    expect(text).toContain('gh issue comment <n> --body-file');
    expect(text).toContain('each decision that the round added or answered');
    expect(text).toContain('No other box changed.');
    expect(text).toContain('The body changed:');
  });

  it('shows the comment text under the question, and one yes covers it', () => {
    const text = step(2);

    expect(text).toContain('Edit #<n> now, and post the comment below?');
    expect(text).toContain('Show the comment text');
    expect(text).toContain('A yes covers the new links and the comment.');
  });

  it('keeps the failure rules in step 5', () => {
    const text = step(5);

    expect(text.toLowerCase()).toContain('post no comment');
    expect(text).toContain('the comment text');
    expect(text).toContain('If the comment fails');
  });

  it('moves the links and labels steps to 6 and 7', () => {
    expect(step(6)).toContain('Set the new links');
    expect(step(7)).toContain('Set `status: draft`?');
  });

  it('prints the comment text under a pasted body', () => {
    const text = filing.slice(
      filing.indexOf('## Editing a filed issue'),
      filing.indexOf('### Read')
    );

    expect(text).toContain('Write steps 1 to 4, 6 and 7');
    expect(text).toContain('comment text under the body');
  });

  it('hands a replaced Spec body to Write steps 2 to 5', () => {
    const text = handOver('slice-intent.md');

    expect(text).toContain('Write steps 2 to 5');
    expect(text.indexOf('Superseded:')).toBeGreaterThan(-1);
    expect(text.indexOf('Superseded:')).toBeLessThan(
      text.indexOf('Write steps 2 to 5')
    );
    expect(text).toContain('filing.md#editing-a-filed-issue');
  });

  it('prints the comment text under the four Bug sections', () => {
    const text = handOver('bug.md');

    expect(text).toContain('comment text');
    expect(text).toContain('This replaces the first rule of Write step 5.');
    expect(text).toContain('or the body edit fails');
    expect(text).toContain('a step or part of a step');
    expect(text).not.toContain('Write step 4');
  });
});
