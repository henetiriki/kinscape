'use client';

import type { ComponentPropsWithoutRef, ElementType } from 'react';

import { createContext, createElement } from 'react';

import type { LinkComponent } from '@ks/app/components/foundation/types';

/**
 * The element a kit link renders. It is `'a'` until a provider gives another, so the kit and the
 * design boards need no framework. The app's `Links` provider gives `next/link`.
 */
export const LinkContext = createContext<LinkComponent>('a');

/**
 * A link that renders the `LinkContext` element. It reads the context with a `Consumer`, not a
 * hook: the React 18 design boards render a kit link that another React copy made.
 */
export const KitLink = (
  props: { href: string } & ComponentPropsWithoutRef<'a'>
) =>
  // A Consumer's child is a function, which the rule reads as a prop it forbids.
  // eslint-disable-next-line react/no-children-prop
  createElement(LinkContext.Consumer, {
    children: (Link: LinkComponent) =>
      createElement(Link as ElementType, props),
  });
