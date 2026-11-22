import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Surface } from '@ks/app/components/foundation/Surface';

// NFR-06
it('draws each level with its own class and keeps a caller class', () => {
  render(
    <>
      <Surface level='raised'>a</Surface>
      <Surface level='floating'>b</Surface>
      <Surface level='modal'>c</Surface>
      <Surface className='extra' level='sheet'>
        d
      </Surface>
    </>
  );

  const nodes = ['a', 'b', 'c', 'd'].map(text => screen.getByText(text));

  expect(new Set(nodes.map(node => node.className.split(' ')[0])).size).toBe(4);
  expect(nodes[3].classList.contains('extra')).toBe(true);
});
