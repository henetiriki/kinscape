import { describe, expect, it } from 'vitest';

import type { DtcgTree } from '@ks/lib/design/types.ts';

import {
  controlCss,
  controlOf,
  controlProblems,
  withControlSizes,
} from '@ks/lib/design/control-sizes.mts';

const PARTS = {
  border: '{border.hairline}',
  inset: '{space.inset.xs}',
  line: '{type.control.line}',
};

const control = (value: unknown, parts: Record<string, string> = PARTS) => ({
  $extensions: { kinscape: { control: parts } },
  $type: 'dimension',
  $value: value,
});

const tree = (value: unknown = { unit: 'px', value: 1 }): DtcgTree => ({
  border: {
    hairline: { $type: 'dimension', $value: { unit: 'px', value: 1 } },
  },
  size: { 'control-medium': control(value) },
  space: {
    inset: { xs: { $type: 'dimension', $value: { unit: 'rem', value: 0.5 } } },
  },
  type: {
    control: {
      line: { $type: 'dimension', $value: { unit: 'rem', value: 1.5 } },
    },
  },
});

// NFR-05, NFR-06
describe('control sizes', () => {
  it('reads the three parts of a control size', () => {
    expect(controlOf({ ...control(1), path: ['size', 'x'] })).toEqual(PARTS);
    expect(controlOf({ $value: 1, path: ['size', 'y'] })).toBeUndefined();
  });

  it('writes the height as a calc() of var() names', () => {
    expect(controlCss(PARTS)).toBe(
      'calc(var(--type-control-line) + 2 * var(--space-inset-xs) + 2 * var(--border-hairline))'
    );
  });

  it('writes the px sum at a 16px root: 24 + 2 × 8 + 2 × 1 = 42', () => {
    const written = withControlSizes(tree());

    expect((written.size as DtcgTree)['control-medium']).toHaveProperty(
      '$value',
      { unit: 'px', value: 42 }
    );
    expect(controlProblems(written)).toEqual([]);
  });

  it('names a stale $value', () => {
    expect(controlProblems(tree())).toEqual([
      'size.control-medium: $value is 1px, the parts give 42px',
    ]);
  });

  it('names a part that refers to no token', () => {
    const broken = tree();

    (broken.size as DtcgTree)['control-medium'] = control(1, {
      ...PARTS,
      inset: '{space.inset.nope}',
    });

    expect(controlProblems(broken)).toEqual([
      'size.control-medium: Unknown token reference {space.inset.nope}',
    ]);
    expect(() => withControlSizes(broken)).toThrow('space.inset.nope');
  });
});
