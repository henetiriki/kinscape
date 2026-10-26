import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Deps } from '../design-shots-ci.mts';

import {
  check,
  guard,
  parseStatus,
  run,
  summary,
} from '../design-shots-ci.mts';

const status = (...entries: string[]) => entries.join('\0') + '\0';

const deps = (porcelain: string) => ({
  append: vi.fn<Deps['append']>(),
  git: vi.fn<Deps['git']>(() => porcelain),
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('guard', () => {
  it('allows a branch', () => {
    expect(guard('refs/heads/chore/design-boards')).toBeUndefined();
  });

  it('refuses main', () => {
    expect(guard('refs/heads/main')).toMatch(/^Refusing to run on main/);
  });

  it.each(['refs/tags/v1', 'refs/pull/7/merge', ''])(
    'refuses %j, which is not a branch',
    ref => {
      expect(guard(ref)).toMatch(/not a branch/);
    }
  );
});

describe('parseStatus', () => {
  it('separates snapshot JPGs from everything else, sorted', () => {
    expect(
      parseStatus(
        status(
          ' M design/map-desktop.jpg',
          '?? design/new.jpg',
          ' M design/DESIGN.md',
          ' M design/source/new.jpg',
          ' M package.json'
        )
      )
    ).toEqual({
      jpgs: ['design/map-desktop.jpg', 'design/new.jpg'],
      other: ['design/DESIGN.md', 'design/source/new.jpg', 'package.json'],
    });
  });

  it('finds nothing in a clean tree', () => {
    expect(parseStatus('')).toEqual({ jpgs: [], other: [] });
  });
});

describe('summary', () => {
  it('says when nothing changed', () => {
    expect(summary([])).toBe('## Design snapshots\n\nNo changes.\n');
  });

  it('counts one JPG', () => {
    expect(summary(['design/a.jpg'])).toBe(
      '## Design snapshots\n\n1 JPG changed:\n\n- `design/a.jpg`\n'
    );
  });

  it('lists several JPGs', () => {
    expect(summary(['design/a.jpg', 'design/b.jpg'])).toBe(
      '## Design snapshots\n\n2 JPGs changed:\n\n- `design/a.jpg`\n- `design/b.jpg`\n'
    );
  });
});

describe('check', () => {
  it('asks git for every change, untracked files included', () => {
    const d = deps('');

    check({}, d);

    expect(d.git).toHaveBeenCalledWith([
      'status',
      '--porcelain',
      '-z',
      '--untracked-files=all',
    ]);
  });

  it('writes the summary and the count when the files are set', () => {
    const d = deps(status(' M design/a.jpg', ' M design/b.jpg'));

    expect(check({ OUTPUT_FILE: 'out', SUMMARY_FILE: 'sum' }, d)).toBe(0);
    expect(d.append).toHaveBeenCalledWith(
      'sum',
      summary(['design/a.jpg', 'design/b.jpg'])
    );
    expect(d.append).toHaveBeenCalledWith('out', 'changed=2\n');
  });

  it('reports no changes with a count of 0', () => {
    const d = deps('');

    expect(check({ OUTPUT_FILE: 'out', SUMMARY_FILE: 'sum' }, d)).toBe(0);
    expect(d.append).toHaveBeenCalledWith('sum', summary([]));
    expect(d.append).toHaveBeenCalledWith('out', 'changed=0\n');
  });

  it('writes nothing when the files are not set', () => {
    const d = deps(status(' M design/a.jpg'));

    expect(check({}, d)).toBe(0);
    expect(d.append).not.toHaveBeenCalled();
  });

  it('fails, writing nothing, when anything but a snapshot JPG changed', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps(status(' M design/a.jpg', ' M package.json'));

    expect(check({ OUTPUT_FILE: 'out', SUMMARY_FILE: 'sum' }, d)).toBe(1);
    expect(error).toHaveBeenCalledWith(
      'Changed outside design/*.jpg: package.json'
    );
    expect(d.append).not.toHaveBeenCalled();
  });
});

describe('run', () => {
  it('checks', () => {
    expect(run('check', {}, deps(''))).toBe(0);
  });

  it('lets a branch through the guard', () => {
    expect(run('guard', { REF: 'refs/heads/x' }, deps(''))).toBe(0);
  });

  it('stops main at the guard', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(run('guard', { REF: 'refs/heads/main' }, deps(''))).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/main/));
  });

  it('stops a run with no ref at the guard', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(run('guard', {}, deps(''))).toBe(1);
  });

  it('rejects an unknown command', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(run('render', {}, deps(''))).toBe(2);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/^Usage/));
  });
});
