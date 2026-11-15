import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import type { LinkComponent } from '@ks/app/components/foundation/types';

import { Button } from '@ks/app/components/actions/Button';
import { PersonRow } from '@ks/app/components/actions/PersonRow';
import { TextLink } from '@ks/app/components/actions/TextLink';
import { LinkContext } from '@ks/app/components/foundation/link';
import { BackLink } from '@ks/app/components/foundation/PageHeader';

const Marked: LinkComponent = ({ children, href, ...rest }) => (
  <a data-via='context' href={href} {...rest}>
    {children}
  </a>
);

const links = (
  <>
    <BackLink href='/' label='Map' />
    <Button href='/people/new'>Add</Button>
    <TextLink href='/people/1/relationships'>Relationships</TextLink>
    <PersonRow
      born='1900'
      bornReading=''
      died=''
      diedReading=''
      givenNames='Ada'
      href='/people/1'
      surname='Test'
    />
  </>
);

// PPL-01
it('renders a plain anchor with no provider', () => {
  render(links);

  for (const link of screen.getAllByRole('link')) {
    expect(link.tagName).toBe('A');
    expect(link.dataset.via).toBeUndefined();
  }

  expect(screen.getAllByRole('link')).toHaveLength(4);
});

// PPL-01
it('renders the context component for each kit link', () => {
  render(<LinkContext.Provider value={Marked}>{links}</LinkContext.Provider>);

  const rendered = screen.getAllByRole('link');

  expect(rendered).toHaveLength(4);

  for (const link of rendered) {
    expect(link.dataset.via).toBe('context');
  }
});

it('keeps a Button without an href a button, with a provider', () => {
  render(
    <LinkContext.Provider value={Marked}>
      <Button>Save</Button>
    </LinkContext.Provider>
  );

  expect(screen.getByRole('button', { name: 'Save' }).dataset.via).toBe(
    undefined
  );
});
