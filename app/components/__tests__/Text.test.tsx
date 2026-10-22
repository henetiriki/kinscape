import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Text } from '../Text';

// NFR-06
it('renders a heading style as the element it is given', () => {
  render(
    <Text as='h2' variant='h3'>
      Kimberley
    </Text>
  );

  const heading = screen.getByRole('heading', { level: 2 });

  expect(heading.classList.contains('h3')).toBe(true);
});

it('defaults body and body L to a paragraph, and the rest to a span', () => {
  render(
    <>
      <Text variant='body'>Body</Text>
      <Text variant='bodyL'>Body L</Text>
      <Text variant='label'>Label</Text>
      <Text variant='monoL'>Mono L</Text>
    </>
  );

  expect(screen.getByText('Body').tagName).toBe('P');
  expect(screen.getByText('Body L').tagName).toBe('P');
  expect(screen.getByText('Label').tagName).toBe('SPAN');
  expect(screen.getByText('Mono L').classList.contains('monoL')).toBe(true);
});

it('lets a non-heading style take another element and passes props through', () => {
  render(
    <Text as='div' id='note' variant='small'>
      Helper
    </Text>
  );

  const note = screen.getByText('Helper');

  expect(note.tagName).toBe('DIV');
  expect(note.id).toBe('note');
});

it('lets a label point at its control', () => {
  render(
    <>
      <Text as='label' htmlFor='field' variant='label'>
        Name
      </Text>
      <input id='field' />
    </>
  );

  expect(screen.getByLabelText('Name').id).toBe('field');
});

it('adds a message colour to the style with a tone', () => {
  render(
    <>
      <Text tone='error' variant='small'>
        Bad
      </Text>
      <Text variant='small'>Plain</Text>
    </>
  );

  expect([...screen.getByText('Bad').classList]).toEqual(['small', 'error']);
  expect([...screen.getByText('Plain').classList]).toEqual(['small']);
});

it('requires an element for a heading style', () => {
  // @ts-expect-error h1 without `as` is a type error
  const element = <Text variant='h1'>Title</Text>;

  expect(element.props.variant).toBe('h1');
});
