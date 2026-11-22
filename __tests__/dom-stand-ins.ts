type Dom = {
  document: Document;
  HTMLDialogElement: typeof HTMLDialogElement;
  matchMedia: Window['matchMedia'];
};

/**
 * jsdom has no `showModal`, `close` or `matchMedia`: use the `open` attribute of the dialog that
 * the call names, and a desktop that never changes. A test swaps in its own `matchMedia`.
 */
export const standInDom = (dom: Dom) => {
  /* eslint-disable no-restricted-syntax -- a method reads `this`, which an arrow function cannot */
  Object.assign(dom.HTMLDialogElement.prototype, {
    close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
    showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  /* eslint-enable no-restricted-syntax */
  dom.matchMedia = ((query: string) => ({
    addEventListener: () => {},
    matches: false,
    media: query,
    removeEventListener: () => {},
  })) as unknown as typeof dom.matchMedia;
};
