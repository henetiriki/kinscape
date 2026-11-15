import { render, screen } from '@testing-library/react';
import Link from 'next/link';
import { useContext } from 'react';
import { expect, it } from 'vitest';

import { LinkContext } from '@ks/app/components/foundation/link';
import { Links } from '@ks/app/Links';

const Probe = () =>
  useContext(LinkContext) === Link ? <p>next/link</p> : null;

// PPL-01
it('gives the kit links next/link', () => {
  render(
    <Links>
      <Probe />
    </Links>
  );

  expect(screen.getByText('next/link')).toBeTruthy();
});
