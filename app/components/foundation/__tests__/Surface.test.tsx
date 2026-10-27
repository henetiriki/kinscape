import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Surface } from '@ks/app/components/foundation/Surface';

// NFR-06
it('draws each level with its own class and keeps a caller class', () => {
  const { container } = render(
    <>
      <Surface level='raised'>a</Surface>
      <Surface level='floating'>b</Surface>
      <Surface level='modal'>c</Surface>
      <Surface className='extra' level='sheet'>
        d
      </Surface>
    </>
  );

  const nodes = Array.from(container.children);

  expect(new Set(nodes.map(node => node.className.split(' ')[0])).size).toBe(4);
  expect(nodes[3].classList.contains('extra')).toBe(true);
});
