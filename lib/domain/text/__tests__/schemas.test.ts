import { describe, expect, it } from 'vitest';

import { textField } from '@ks/lib/domain/text/schemas.mts';

describe('textField', () => {
  const field = textField(5);

  it('trims the text', () => {
    expect(field.parse('  abc  ')).toBe('abc');
  });

  it('accepts text at the limit and refuses one more character', () => {
    expect(field.safeParse('abcde').success).toBe(true);
    expect(field.safeParse('abcdef').success).toBe(false);
  });

  it('refuses a NUL character', () => {
    expect(field.safeParse('a\0b').success).toBe(false);
  });
});
