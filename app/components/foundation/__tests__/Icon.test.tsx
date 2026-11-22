import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import type { IconName, IconSize } from '@ks/app/components/foundation/types';

import { FilledIcon, Icon, PATHS } from '@ks/app/components/foundation/Icon';

const NAMES = Object.keys(PATHS) as IconName[];

// eslint-disable-next-line testing-library/no-node-access -- the icon is an aria-hidden svg; no query reaches it
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

it.each(NAMES)('%s is decorative and draws in currentColor', name => {
  const svg = svgOf(render(<Icon name={name} />).container);

  expect(svg.getAttribute('aria-hidden')).toBe('true');
  expect(svg.getAttribute('stroke')).toBe('currentColor');
  // eslint-disable-next-line testing-library/no-node-access -- the test checks that the svg holds a shape; no query reaches it
  expect(svg.querySelector('path, circle')).toBeTruthy();
});

it.each(NAMES)('%s draws at stroke 2', name => {
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

  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the icons are aria-hidden svgs; no query reaches them
  const [success, info, filled] = Array.from(container.querySelectorAll('svg'));

  expect(success.getAttribute('data-icon')).toBe('success');
  expect(info.getAttribute('data-icon')).toBe('info');
  expect(filled.getAttribute('height')).toBe('20');
  expect(filled.getAttribute('aria-hidden')).toBe('true');
});

it('draws layers with butt caps', () => {
  const svg = svgOf(render(<Icon name='layers' />).container);
  // eslint-disable-next-line testing-library/no-node-access -- the test checks the paths of an aria-hidden svg; no query reaches them
  const paths = svg.querySelectorAll('path');

  expect(paths).toHaveLength(2);
  paths.forEach(path =>
    expect(path.getAttribute('stroke-linecap')).toBe('butt')
  );
});

it('fills play with no stroke', () => {
  const svg = svgOf(render(<Icon name='play' />).container);
  // eslint-disable-next-line testing-library/no-node-access -- the test checks the path of an aria-hidden svg; no query reaches it
  const path = svg.querySelector('path')!;

  expect(path.getAttribute('fill')).toBe('currentColor');
  expect(path.getAttribute('stroke')).toBe('none');
});
