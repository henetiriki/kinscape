type Dom = {
  document: Document;
  HTMLDialogElement: typeof HTMLDialogElement;
  matchMedia: Window['matchMedia'];
};

/** jsdom has no `showModal`, `close` or `matchMedia`: use the `open` attribute and a desktop that never changes. A test swaps in its own `matchMedia`. */
export const standInDom = (dom: Dom) => {
  Object.assign(dom.HTMLDialogElement.prototype, {
    close: () =>
      dom.document.querySelector('dialog[open]')?.removeAttribute('open'),
    showModal: () =>
      dom.document.querySelector('dialog')?.setAttribute('open', ''),
  });
  dom.matchMedia = ((query: string) => ({
    addEventListener: () => {},
    matches: false,
    media: query,
    removeEventListener: () => {},
  })) as unknown as typeof dom.matchMedia;
};
