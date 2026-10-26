export type Group = {
  note: string;
  swatches: Swatch[];
  title: string;
};

/** A colour and what it is measured on: a token path and the name the board gives it. */
export type On = readonly [path: string, label: string];

export type Role =
  | 'border'
  | 'decorative'
  | 'disabled'
  | 'fill only'
  | 'map only'
  | 'overlay'
  | 'text';

export type System = {
  lines: SystemLine[];
  text: string;
  title: string;
  tone: 'error' | 'info' | 'success' | 'warning';
};

/** One line under a system colour: `plain` shows the value only, `note` its use instead of a ratio. */
export type SystemLine = {
  on?: On;
  path: string;
  role: 'border' | 'note' | 'plain' | 'text';
  use?: string;
};

type Swatch = {
  /** Set when the measured ratio is not on `colour.surface`. */
  on?: On;
  path: string;
  role: Role;
  use: string;
};
