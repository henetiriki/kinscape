import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import type { IconName, IconSize } from '@ks/app/components/foundation/types';

import { FilledIcon, Icon, PATHS } from '@ks/app/components/foundation/Icon';

const NAMES = Object.keys(PATHS) as IconName[];

const svgOf = () => screen.getByRole('img', { hidden: true });

// NFR-06
it.each([14, 16, 18, 20, 24] as IconSize[])('draws at size %i', size => {
  render(<Icon name='search' size={size} />);

  const svg = svgOf();

  expect(svg.getAttribute('width')).toBe(String(size));
  expect(svg.getAttribute('height')).toBe(String(size));
});

it('defaults to 18', () => {
  render(<Icon name='search' />);

  const svg = svgOf();

  expect(svg.getAttribute('width')).toBe('18');
  expect(svg.getAttribute('height')).toBe('18');
});

it.each(NAMES)('%s is decorative and draws in currentColor', name => {
  render(<Icon name={name} />);

  const svg = svgOf();

  expect(svg.getAttribute('aria-hidden')).toBe('true');
  expect(svg.getAttribute('stroke')).toBe('currentColor');
  // eslint-disable-next-line testing-library/no-node-access -- the test checks that the svg holds a shape; no query reaches it
  expect(svg.querySelector('path, circle')).toBeTruthy();
});

it.each(NAMES)('%s draws at stroke 2', name => {
  render(<Icon name={name} />);

  expect(svgOf().getAttribute('stroke-width')).toBe('2');
});

it('draws a decorative icon in both forms', () => {
  render(
    <>
      <Icon name='success' />
      <Icon name='info' />
      <FilledIcon name='info' />
    </>
  );

  const [success, info, filled] = screen.getAllByRole('img', { hidden: true });

  expect(success.getAttribute('data-icon')).toBe('success');
  expect(info.getAttribute('data-icon')).toBe('info');
  expect(filled.getAttribute('height')).toBe('20');
  expect(filled.getAttribute('aria-hidden')).toBe('true');
});

it('draws layers with butt caps', () => {
  render(<Icon name='layers' />);

  const svg = svgOf();
  // eslint-disable-next-line testing-library/no-node-access -- the test checks the paths of an aria-hidden svg; no query reaches them
  const paths = svg.querySelectorAll('path');

  expect(paths).toHaveLength(2);
  paths.forEach(path =>
    expect(path.getAttribute('stroke-linecap')).toBe('butt')
  );
});

it('fills play with no stroke', () => {
  render(<Icon name='play' />);

  const svg = svgOf();
  // eslint-disable-next-line testing-library/no-node-access -- the test checks the path of an aria-hidden svg; no query reaches it
  const path = svg.querySelector('path')!;

  expect(path.getAttribute('fill')).toBe('currentColor');
  expect(path.getAttribute('stroke')).toBe('none');
});
