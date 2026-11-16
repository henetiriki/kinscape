import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DesignShotsCiDeps } from '@ks/scripts/types.ts';

import {
  check,
  guard,
  parseStatus,
  run,
  source as sourceCheck,
  summary,
} from '@ks/scripts/design-shots-ci.mts';

const status = (...entries: string[]) => entries.join('\0') + '\0';

const deps = (porcelain: string) => ({
  append: vi.fn<DesignShotsCiDeps['append']>(),
  git: vi.fn<DesignShotsCiDeps['git']>(() => porcelain),
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
      cards: [],
      html: [],
      jpgs: ['design/map-desktop.jpg', 'design/new.jpg'],
      other: ['design/DESIGN.md', 'design/source/new.jpg', 'package.json'],
    });
  });

  it('separates card images, sorted', () => {
    expect(
      parseStatus(
        status(
          ' M design/cards/Button-390.png',
          '?? design/cards/Alert-1440.png',
          ' M design/cards/notes.md',
          ' M design/cards/sub/Alert-1440.png',
          ' M design/other.png'
        )
      )
    ).toEqual({
      cards: ['design/cards/Alert-1440.png', 'design/cards/Button-390.png'],
      html: [],
      jpgs: [],
      other: [
        'design/cards/notes.md',
        'design/cards/sub/Alert-1440.png',
        'design/other.png',
      ],
    });
  });

  it('separates HTML snapshots, sorted', () => {
    expect(
      parseStatus(
        status(
          ' M design/source/b.html',
          '?? design/source/a.html',
          ' M design/source/fonts.css',
          ' M design/other.html'
        )
      )
    ).toEqual({
      cards: [],
      html: ['design/source/a.html', 'design/source/b.html'],
      jpgs: [],
      other: ['design/other.html', 'design/source/fonts.css'],
    });
  });

  it('finds nothing in a clean tree', () => {
    expect(parseStatus('')).toEqual({
      cards: [],
      html: [],
      jpgs: [],
      other: [],
    });
  });
});

describe('summary', () => {
  it('says when nothing changed', () => {
    expect(summary([], [], [])).toBe('## Design snapshots\n\nNo changes.\n');
  });

  it('counts one JPG', () => {
    expect(summary(['design/a.jpg'], [], [])).toBe(
      '## Design snapshots\n\n1 JPG changed:\n\n- `design/a.jpg`\n'
    );
  });

  it('lists several JPGs', () => {
    expect(summary(['design/a.jpg', 'design/b.jpg'], [], [])).toBe(
      '## Design snapshots\n\n2 JPGs changed:\n\n- `design/a.jpg`\n- `design/b.jpg`\n'
    );
  });

  it('lists HTML snapshots before JPGs', () => {
    expect(summary(['design/a.jpg'], ['design/source/a.html'], [])).toBe(
      '## Design snapshots\n\n1 HTML snapshot changed:\n\n- `design/source/a.html`\n\n1 JPG changed:\n\n- `design/a.jpg`\n'
    );
  });

  it('counts several HTML snapshots', () => {
    expect(
      summary([], ['design/source/a.html', 'design/source/b.html'], [])
    ).toBe(
      '## Design snapshots\n\n2 HTML snapshots changed:\n\n- `design/source/a.html`\n- `design/source/b.html`\n'
    );
  });
});

describe('summary of card images', () => {
  it('counts one card image', () => {
    expect(summary([], [], ['design/cards/A-390.png'])).toBe(
      '## Design snapshots\n\n1 card image changed:\n\n- `design/cards/A-390.png`\n'
    );
  });

  it('lists card images after JPGs', () => {
    expect(
      summary(
        ['design/a.jpg'],
        ['design/source/a.html'],
        ['design/cards/A-390.png', 'design/cards/A-1440.png']
      )
    ).toBe(
      '## Design snapshots\n\n1 HTML snapshot changed:\n\n- `design/source/a.html`\n\n1 JPG changed:\n\n- `design/a.jpg`\n\n2 card images changed:\n\n- `design/cards/A-390.png`\n- `design/cards/A-1440.png`\n'
    );
  });
});

describe('source', () => {
  it('passes when nothing under design/source changed', () => {
    expect(sourceCheck(deps(status(' M design/a.jpg')))).toBe(0);
  });

  it('names every changed file under design/source', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const d = deps(
      status(
        ' M design/source/b.html',
        '?? design/source/a.html',
        ' M design/source/kse-birth.svg',
        ' M design/other.jpg'
      )
    );

    expect(sourceCheck(d)).toBe(1);
    expect(log.mock.calls.map(call => call[0])).toEqual([
      '::error file=design/source/a.html::Hand-edited or stale: run the workflow Design: Render snapshots on this branch.',
      '::error file=design/source/b.html::Hand-edited or stale: run the workflow Design: Render snapshots on this branch.',
      '::error file=design/source/kse-birth.svg::Hand-edited or stale: run the workflow Design: Render snapshots on this branch.',
    ]);
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
    const d = deps(
      status(
        ' M design/a.jpg',
        ' M design/b.jpg',
        ' M design/source/a.html',
        '?? design/cards/A-390.png'
      )
    );

    expect(check({ OUTPUT_FILE: 'out', SUMMARY_FILE: 'sum' }, d)).toBe(0);
    expect(d.append).toHaveBeenCalledWith(
      'sum',
      summary(
        ['design/a.jpg', 'design/b.jpg'],
        ['design/source/a.html'],
        ['design/cards/A-390.png']
      )
    );
    expect(d.append).toHaveBeenCalledWith('out', 'changed=4\n');
  });

  it('reports no changes with a count of 0', () => {
    const d = deps('');

    expect(check({ OUTPUT_FILE: 'out', SUMMARY_FILE: 'sum' }, d)).toBe(0);
    expect(d.append).toHaveBeenCalledWith('sum', summary([], [], []));
    expect(d.append).toHaveBeenCalledWith('out', 'changed=0\n');
  });

  it('writes nothing when the files are not set', () => {
    const d = deps(status(' M design/a.jpg'));

    expect(check({}, d)).toBe(0);
    expect(d.append).not.toHaveBeenCalled();
  });

  it('fails, writing nothing, when anything but a snapshot changed', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps(
      status(' M design/a.jpg', ' M design/source/a.html', ' M package.json')
    );

    expect(check({ OUTPUT_FILE: 'out', SUMMARY_FILE: 'sum' }, d)).toBe(1);
    expect(error).toHaveBeenCalledWith(
      'Changed outside design/*.jpg, design/cards/*.png and design/source/*.html: package.json'
    );
    expect(d.append).not.toHaveBeenCalled();
  });
});

describe('run', () => {
  it('checks', () => {
    expect(run('check', {}, deps(''))).toBe(0);
  });

  it('checks the source', () => {
    expect(run('source', {}, deps(''))).toBe(0);
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
