import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const link = vi.hoisted(() => vi.fn());

vi.mock('next/link', () => ({
  default: (props: { children: string; href: string; prefetch?: boolean }) => {
    link(props);

    return <a href={props.href}>{props.children}</a>;
  },
}));

import { LinkContext } from '@ks/app/components/foundation/link';
import { Links } from '@ks/app/Links';

const Probe = () => (
  <LinkContext.Consumer>
    {Anchor => <Anchor href='/people/p1'>A row</Anchor>}
  </LinkContext.Consumer>
);

beforeEach(() => {
  vi.clearAllMocks();
});

// PPL-01
it('gives the kit links next/link', () => {
  render(
    <Links>
      <Probe />
    </Links>
  );

  expect(screen.getByRole('link', { name: 'A row' }).getAttribute('href')).toBe(
    '/people/p1'
  );
});

// NFR-02: a long list would prefetch one route for each row in view.
it('turns the prefetch of a kit link off', () => {
  render(
    <Links>
      <Probe />
    </Links>
  );

  expect(link).toHaveBeenCalledWith(
    expect.objectContaining({ href: '/people/p1', prefetch: false })
  );
});
