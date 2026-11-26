import { describe, expect, it } from 'vitest';

import {
  roundTo,
  scaleProblems,
  stepsOf,
  withSteps,
} from '@ks/lib/design/scales.mts';

type Tree = Record<string, unknown>;

const treeOf = (settings: Record<string, unknown>): Tree => ({
  scale: { space: { $extensions: { kinscape: settings } } },
});

const valuesOf = (settings: Record<string, unknown>): Record<string, number> =>
  Object.fromEntries(
    stepsOf('space', settings as Parameters<typeof stepsOf>[1]).map(
      ({ name, value }) => [name, value]
    )
  );

describe('roundTo', () => {
  it('rounds a halfway value up', () => {
    expect(roundTo(2.5, 1)).toBe(3);
    expect(roundTo(6, 4)).toBe(8);
  });

  it('rounds to the nearest multiple', () => {
    expect(roundTo(5, 4)).toBe(4);
    expect(roundTo(13.4, 1)).toBe(13);
  });

  it('rounds a product that floating point puts just below the half', () => {
    // 1.005 × 1000 is 1004.9999999999999 in floating point.
    expect(roundTo(1.005 * 1000, 1)).toBe(1005);
    expect(roundTo(0.15 * 10, 1)).toBe(2);
  });
});

describe('stepsOf', () => {
  it('builds a grid: unit 4, four steps', () => {
    expect(valuesOf({ grid: 4, mode: 'grid', steps: 4, unit: 'px' })).toEqual({
      '100': 4,
      '200': 8,
      '300': 12,
      '400': 16,
    });
  });

  it('builds a ratio: the base is step 400', () => {
    expect(
      valuesOf({
        above: 2,
        base: 16,
        below: 1,
        mode: 'ratio',
        ratio: 1.25,
        round: 1,
        unit: 'px',
      })
    ).toEqual({ '300': 13, '400': 16, '500': 20, '600': 25 });
  });

  it('builds a hybrid: the ratio part continues from the last grid step', () => {
    expect(
      valuesOf({
        above: 2,
        grid: 4,
        limit: 16,
        mode: 'hybrid',
        ratio: 1.5,
        unit: 'px',
      })
    ).toEqual({
      '100': 4,
      '200': 8,
      '300': 12,
      '400': 16,
      '500': 24,
      '600': 36,
    });
  });

  it('copies an explicit list, from step 100', () => {
    expect(
      valuesOf({ mode: 'explicit', unit: 'px', values: [11, 12.5, 13] })
    ).toEqual({ '100': 11, '200': 12.5, '300': 13 });
  });

  it('fails on a ratio with four steps below the base, and names the scale', () => {
    expect(() =>
      valuesOf({
        above: 0,
        base: 16,
        below: 4,
        mode: 'ratio',
        ratio: 1.25,
        round: 1,
        unit: 'px',
      })
    ).toThrow('scale.space: the settings give a step below 100');
  });

  it('fails on a mode that it does not know, and names the scale', () => {
    expect(() => valuesOf({ mode: 'fibonacci', unit: 'px' })).toThrow(
      'scale.space: unknown mode "fibonacci"'
    );
  });
});

describe('withSteps', () => {
  it('writes a token for each step, with its type and a note', () => {
    const out = withSteps(
      treeOf({ grid: 4, mode: 'grid', steps: 2, unit: 'px' })
    ) as { scale: { space: Tree } };

    expect(out.scale.space['100']).toEqual({
      $description: 'Grid of 4px, step 1.',
      $type: 'dimension',
      $value: { unit: 'px', value: 4 },
    });
    expect(Object.keys(out.scale.space).toSorted()).toEqual([
      '$extensions',
      '100',
      '200',
    ]);
  });

  it('gives a duration step the type duration', () => {
    const out = withSteps(
      treeOf({ mode: 'explicit', unit: 'ms', values: [120] })
    ) as { scale: { space: Record<string, Tree> } };

    expect(out.scale.space['100']).toMatchObject({
      $description: 'Explicit list, value 1.',
      $type: 'duration',
      $value: { unit: 'ms', value: 120 },
    });
  });

  it('writes a rem group as px ÷ 16, in each mode', () => {
    const values = (settings: Record<string, unknown>) =>
      Object.values(
        (
          withSteps(treeOf(settings)) as {
            scale: { space: Record<string, Tree> };
          }
        ).scale.space
      )
        .filter(step => '$value' in step)
        .map(step => step.$value);

    expect(values({ grid: 4, mode: 'grid', steps: 2, unit: 'rem' })).toEqual([
      { unit: 'rem', value: 0.25 },
      { unit: 'rem', value: 0.5 },
    ]);
    expect(values({ mode: 'explicit', unit: 'rem', values: [12, 14] })).toEqual(
      [
        { unit: 'rem', value: 0.75 },
        { unit: 'rem', value: 0.875 },
      ]
    );
    expect(
      values({
        above: 1,
        grid: 4,
        limit: 4,
        mode: 'hybrid',
        ratio: 4,
        unit: 'rem',
      })
    ).toEqual([
      { unit: 'rem', value: 0.25 },
      { unit: 'rem', value: 1 },
    ]);
    expect(
      values({
        above: 1,
        base: 16,
        below: 0,
        mode: 'ratio',
        ratio: 1.5,
        round: 1,
        unit: 'rem',
      })
    ).toEqual([
      { unit: 'rem', value: 1 },
      { unit: 'rem', value: 1.5 },
    ]);
  });

  it('names the px input in the note of a rem step', () => {
    const out = withSteps(
      treeOf({ grid: 4, mode: 'grid', steps: 1, unit: 'rem' })
    ) as { scale: { space: Record<string, Tree> } };

    expect(out.scale.space['100'].$description).toBe('Grid of 4px, step 1.');
  });

  it('replaces a step that a hand edit changed', () => {
    const tree = withSteps(
      treeOf({ grid: 4, mode: 'grid', steps: 1, unit: 'px' })
    ) as { scale: { space: Tree } };

    tree.scale.space['100'] = { $type: 'dimension', $value: 'x' };

    expect(withSteps(tree)).not.toEqual(tree);
    expect(scaleProblems(withSteps(tree))).toEqual([]);
  });

  it('describes a ratio and a hybrid step', () => {
    const ratio = withSteps(
      treeOf({
        above: 0,
        base: 16,
        below: 0,
        mode: 'ratio',
        ratio: 1.25,
        round: 1,
        unit: 'px',
      })
    ) as { scale: { space: Record<string, Tree> } };
    const hybrid = withSteps(
      treeOf({
        above: 1,
        grid: 4,
        limit: 4,
        mode: 'hybrid',
        ratio: 1.5,
        unit: 'px',
      })
    ) as { scale: { space: Record<string, Tree> } };

    expect(ratio.scale.space['400'].$description).toBe(
      'Base 16px, ratio 1.25 to the power 0, rounded to 1px.'
    );
    expect(hybrid.scale.space['100'].$description).toBe('Grid of 4px, step 1.');
    expect(hybrid.scale.space['200'].$description).toBe(
      'Ratio 1.5 from 4px, rounded to 4px, step 1.'
    );
  });

  it('leaves a group with no settings as it is', () => {
    const tree = { scale: { space: { '100': { $type: 'dimension' } } } };

    expect(withSteps(tree)).toEqual(tree);
  });

  it('leaves a tree with no scale group as it is', () => {
    expect(withSteps({ space: {} })).toEqual({ space: {} });
  });
});

describe('scaleProblems', () => {
  const built = (settings: Record<string, unknown>) =>
    withSteps(treeOf(settings)) as { scale: { space: Record<string, Tree> } };

  it('is empty for steps that match their settings', () => {
    expect(
      scaleProblems(built({ grid: 4, mode: 'grid', steps: 3, unit: 'px' }))
    ).toEqual([]);
  });

  it('is empty for a tree with no scale group', () => {
    expect(scaleProblems({ space: {} })).toEqual([]);
  });

  it('names a step whose value differs', () => {
    const tree = built({ grid: 4, mode: 'grid', steps: 2, unit: 'px' });

    tree.scale.space['200'] = {
      ...tree.scale.space['200'],
      $value: { unit: 'px', value: 9 },
    };

    expect(scaleProblems(tree)).toEqual([
      'scale.space.200: is 9px, the settings give 8px',
    ]);
  });

  it('names a rem step that differs', () => {
    const tree = built({ grid: 4, mode: 'grid', steps: 2, unit: 'rem' });

    tree.scale.space['200'] = {
      ...tree.scale.space['200'],
      $value: { unit: 'rem', value: 0.6 },
    };

    expect(scaleProblems(tree)).toEqual([
      'scale.space.200: is 0.6rem, the settings give 0.5rem',
    ]);
  });

  it('writes a value that is not a dimension as JSON', () => {
    const tree = built({ grid: 4, mode: 'grid', steps: 1, unit: 'px' });

    tree.scale.space['100'] = {
      ...tree.scale.space['100'],
      $value: '{scale.space.200}',
    };

    expect(scaleProblems(tree)).toEqual([
      'scale.space.100: is "{scale.space.200}", the settings give 4px',
    ]);
  });

  it('names a step that the settings do not give', () => {
    const tree = built({ grid: 4, mode: 'grid', steps: 1, unit: 'px' });

    tree.scale.space['200'] = { $type: 'dimension', $value: 'x' };

    expect(scaleProblems(tree)).toEqual([
      'scale.space.200: is a step that the settings do not give',
    ]);
  });

  it('names a step that is missing', () => {
    const tree = built({ grid: 4, mode: 'grid', steps: 2, unit: 'px' });

    delete tree.scale.space['200'];

    expect(scaleProblems(tree)).toEqual([
      'scale.space.200: is missing, the settings give 8px',
    ]);
  });

  it('names a step with a changed note or type', () => {
    const tree = built({ grid: 4, mode: 'grid', steps: 1, unit: 'px' });

    tree.scale.space['100'] = { ...tree.scale.space['100'], $description: 'x' };

    expect(scaleProblems(tree)).toEqual([
      'scale.space.100: differs from what its settings write',
    ]);
  });

  it('names the scale when two steps are equal', () => {
    const tree = built({
      above: 1,
      base: 16,
      below: 0,
      mode: 'ratio',
      ratio: 1.1,
      round: 4,
      unit: 'px',
    });

    expect(scaleProblems(tree)).toEqual([
      'scale.space: steps 400 and 500 are both 16px',
    ]);
  });

  it('skips a group with no settings', () => {
    expect(
      scaleProblems({ scale: { space: { '100': { $value: 1 } } } })
    ).toEqual([]);
  });
});
