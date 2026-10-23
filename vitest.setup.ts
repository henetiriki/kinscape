import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest has no globals here, so Testing Library can't unmount between tests by itself.
afterEach(cleanup);

// jsdom has no showModal or close: stand in for them with the `open` attribute.
const dialogs = HTMLDialogElement.prototype;

Object.assign(dialogs, {
  close: () => document.querySelector('dialog[open]')?.removeAttribute('open'),
  showModal: () => document.querySelector('dialog')?.setAttribute('open', ''),
});

// jsdom has no matchMedia: a desktop that never changes. A test swaps in its own.
window.matchMedia = ((query: string) => ({
  addEventListener: () => {},
  matches: false,
  media: query,
  removeEventListener: () => {},
})) as unknown as typeof window.matchMedia;
