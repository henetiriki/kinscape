import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import type { IconSize } from '@ks/app/components/foundation/types';

import { FilledIcon, Icon } from '@ks/app/components/foundation/Icon';
import { ICONS } from '@ks/app/design-kit/foundations/values';

const svgOf = (container: HTMLElement) => container.querySelector('svg')!;

// NFR-06
it.each([14, 16, 18, 20, 24] as IconSize[])('draws at size %i', size => {
  const svg = svgOf(render(<Icon name='search' size={size} />).container);

  expect(svg.getAttribute('width')).toBe(String(size));
  expect(svg.getAttribute('height')).toBe(String(size));
});

it('defaults to 18', () => {
  const svg = svgOf(render(<Icon name='search' />).container);

  expect(svg.getAttribute('width')).toBe('18');
  expect(svg.getAttribute('height')).toBe('18');
});

it.each(ICONS.map(icon => icon.name))(
  '%s is decorative and draws in currentColor',
  name => {
    const svg = svgOf(render(<Icon name={name} />).container);

    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.querySelector('path, circle')).toBeTruthy();
  }
);

it.each(ICONS.map(icon => icon.name))('%s draws at stroke 2', name => {
  const svg = svgOf(render(<Icon name={name} />).container);

  expect(svg.getAttribute('stroke-width')).toBe('2');
});

it('draws a decorative icon in both forms', () => {
  const { container } = render(
    <>
      <Icon name='success' />
      <Icon name='info' />
      <FilledIcon name='info' />
    </>
  );

  const [success, info, filled] = Array.from(container.querySelectorAll('svg'));

  expect(success.getAttribute('data-icon')).toBe('success');
  expect(info.getAttribute('data-icon')).toBe('info');
  expect(filled.getAttribute('height')).toBe('20');
  expect(filled.getAttribute('aria-hidden')).toBe('true');
});

it('fills play with no stroke', () => {
  const path = svgOf(render(<Icon name='play' />).container).querySelector(
    'path'
  )!;

  expect(path.getAttribute('fill')).toBe('currentColor');
  expect(path.getAttribute('stroke')).toBe('none');
});
