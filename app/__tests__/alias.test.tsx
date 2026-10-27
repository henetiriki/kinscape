import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@ks/app/components/actions/Button';
import { toDay } from '@ks/lib/boundaries/model.mts';

describe('the @ks/ alias', () => {
  it('resolves a component', () => {
    render(<Button>Go</Button>);

    expect(screen.getByRole('button', { name: 'Go' })).toBeTruthy();
  });

  it('resolves an .mts module', () => {
    expect(toDay('1652-01-01')).toBe(0);
  });
});
