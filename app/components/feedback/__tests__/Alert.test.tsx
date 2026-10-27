import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Alert } from '@ks/app/components/feedback/Alert';
import { Banner } from '@ks/app/components/feedback/Banner';

// NFR-06
it('announces an error alert at once and the other tones politely', () => {
  const tones = ['error', 'warning', 'success', 'info'] as const;

  render(
    <>
      {tones.map(tone => (
        <Alert key={tone} title={tone} tone={tone}>
          Line {tone}
        </Alert>
      ))}
    </>
  );

  expect(screen.getByRole('alert').textContent).toBe('errorLine error');
  expect(screen.getAllByRole('status').map(node => node.textContent)).toEqual([
    'warningLine warning',
    'successLine success',
    'infoLine info',
  ]);
});

it('renders an untitled alert as the message alone, with the same role and class', () => {
  render(
    <>
      <Alert title='Title' tone='error'>
        Titled
      </Alert>
      <Alert tone='error'>Untitled</Alert>
    </>
  );

  const [titled, untitled] = screen.getAllByRole('alert');

  expect(untitled.textContent).toBe('Untitled');
  expect(untitled.className).toBe(titled.className);
});

it('announces a banner at once and runs its one action', () => {
  const calls: string[] = [];

  render(
    <Banner action='Retry' icon='cloudOff' onAction={() => calls.push('retry')}>
      Terrain didn&apos;t load.
    </Banner>
  );

  expect(screen.getByRole('alert').textContent).toBe(
    "Terrain didn't load.Retry"
  );
  screen.getByRole('button', { name: 'Retry' }).click();
  expect(calls).toEqual(['retry']);
});

// NFR-05
it('marks a placed banner for its phone position', () => {
  render(
    <Banner action='Retry' icon='cloudOff' placed>
      Terrain didn&apos;t load.
    </Banner>
  );

  expect(screen.getByRole('alert').hasAttribute('data-placed')).toBe(true);
});
