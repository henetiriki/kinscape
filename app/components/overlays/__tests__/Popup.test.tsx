import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import {
  chainText,
  PlacedPopup,
  Popup,
  PopupPointer,
} from '@ks/app/components/overlays/Popup';

const CHAIN = [
  { level: 'District', name: 'Kimberley' },
  {
    detail: 'Was Griqualand West until 1880',
    level: 'Colony',
    name: 'Cape Colony',
  },
];

const PIN = {
  date: '1901-03-14',
  event: 'marriage',
  id: 'p1',
  people: 'J. Rossouw & M. du Toit',
  title: 'Marriage',
} as const;

const show = (props: Partial<Parameters<typeof Popup>[0]> = {}) =>
  render(
    <Popup
      chain={CHAIN}
      coordinates='28.738° S · 24.764° E'
      form='floating'
      pins={[PIN]}
      place='Kimberley'
      year={1901}
      {...props}
    />
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

// NFR-05, NFR-06
it('is a non-modal dialog with the overline, name and coordinates', () => {
  show();

  const dialog = screen.getByRole('dialog', {
    name: 'Jurisdiction at this point',
  });

  expect(dialog.getAttribute('aria-modal')).toBeNull();
  screen.getByText('On this spot in 1901');
  screen.getByRole('heading', { level: 3, name: 'Kimberley' });
  screen.getByText('28.738° S · 24.764° E');
});

// NFR-06
it("draws a pin row's Event glyph before its title, with no glyph character", () => {
  const { container } = show();
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the glyph is an aria-hidden svg; the test checks its tag and its sibling
  const glyph = container.querySelector('[data-event="marriage"]')!;

  expect(glyph.tagName.toLowerCase()).toBe('svg');
  expect(glyph.getAttribute('aria-hidden')).toBe('true');
  expect(glyph.nextElementSibling?.textContent).toContain('Marriage');
  expect(glyph.parentElement?.textContent).not.toMatch(/[*▪∞†~%•⚰]|︎/);
});

it('lists the chain as an ordered list, smallest unit first, with the detail', () => {
  show();

  const rows = screen.getAllByRole('listitem');

  expect(screen.getByRole('list').tagName).toBe('OL');
  expect(rows.map(row => row.textContent)).toEqual([
    'DistrictKimberley',
    'ColonyCape ColonyWas Griqualand West until 1880',
  ]);
});

it('makes a pin with an address a link and a pin without one plain text', () => {
  const { unmount } = show({ pins: [{ ...PIN, href: '/pins/p1' }] });

  expect(
    screen.getByRole('link', { name: 'Marriage' }).getAttribute('href')
  ).toBe('/pins/p1');
  unmount();

  show();
  expect(screen.queryByRole('link')).toBeNull();
  screen.getByText('Marriage');
});

it('counts the pins, and draws no pins box without any', () => {
  const { container, unmount } = show();

  screen.getByText('1 pin here');
  unmount();
  show({ pins: [PIN, { ...PIN, id: 'p2' }] });
  screen.getByText('2 pins here');
  unmount();

  const { container: empty } = show({ pins: [] });

  expect(empty.textContent).not.toContain('pin');
  expect(empty.textContent).not.toContain('No pins');
  expect(container).toBeTruthy();
});

it('closes with Close and with Esc, and ignores other keys', () => {
  const onClose = vi.fn();

  show({ onClose });
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(screen.getByRole('button', { name: 'Close' }), {
    key: 'x',
  });
  expect(onClose).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(screen.getByRole('button', { name: 'Copy chain' }), {
    key: 'Escape',
  });
  expect(onClose).toHaveBeenCalledTimes(2);
});

it('draws without handlers', () => {
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  screen.getByRole('dialog');
});

it('writes a line per level, smallest first', () => {
  expect(chainText(CHAIN)).toBe(
    'District: Kimberley\nColony: Cape Colony (Was Griqualand West until 1880)'
  );
});

it('copies the chain and says it worked', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  const onCopied = vi.fn();

  vi.stubGlobal('navigator', { clipboard: { writeText } });
  show({ onCopied });
  fireEvent.click(screen.getByRole('button', { name: 'Copy chain' }));

  await waitFor(() => expect(onCopied).toHaveBeenCalledWith(true));
  expect(writeText).toHaveBeenCalledWith(chainText(CHAIN));
});

it('says so when the clipboard refuses, or is missing', async () => {
  const onCopied = vi.fn();

  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) },
  });
  show({ onCopied });
  fireEvent.click(screen.getByRole('button', { name: 'Copy chain' }));
  await waitFor(() => expect(onCopied).toHaveBeenLastCalledWith(false));

  vi.stubGlobal('navigator', {});
  fireEvent.click(screen.getByRole('button', { name: 'Copy chain' }));
  await waitFor(() => expect(onCopied).toHaveBeenCalledTimes(2));
  expect(onCopied).toHaveBeenLastCalledWith(false);
});

it('copies without a listener', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal('navigator', { clipboard: { writeText } });
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Copy chain' }));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
});

it('is a region named by its overline on a phone, with no Close, Copy chain or pins box', () => {
  const { container } = show({ form: 'sheet' });

  screen.getByRole('region', { name: 'On this spot in 1901' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByText('1 pin here')).toBeNull();
  screen.getByText('Marriage');
  expect(container.textContent).toContain('Look-up only on a phone');
});

it('draws a pointer as decoration, with the caller’s class', () => {
  const { container, rerender } = render(<PopupPointer className='mine' />);
  // eslint-disable-next-line testing-library/no-node-access -- the pointer is an aria-hidden span with no role or text
  const pointer = () => container.firstElementChild!;

  expect(pointer().getAttribute('aria-hidden')).toBe('true');
  expect(pointer().className).toContain('mine');
  rerender(<PopupPointer />);
  expect(pointer().className).toBe('pointer');
});

// MAP-05
it('places a popup at a point, with the pointer on its right edge', () => {
  render(
    <PlacedPopup
      chain={CHAIN}
      coordinates='28.738° S · 24.764° E'
      pins={[]}
      place='Kimberley'
      x={420}
      y={300}
      year={1901}
    />
  );

  // eslint-disable-next-line testing-library/no-node-access -- the root div has no role; the test checks that its aria-hidden pointer is the last child
  const pointer = screen.getByRole('dialog').parentElement!.lastElementChild!;

  expect(pointer.className).toContain('placedPointer');
  expect(pointer.getAttribute('aria-hidden')).toBe('true');
});
