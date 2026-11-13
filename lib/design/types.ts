/** What a control's design system card shows (Spec #450). */
export type Card = {
  /** The state boxes hold a fixed bar: each is the containing block of its `position: fixed` part. */
  contain?: boolean;
  /** The `DESIGN.md` › Components bullets the README holds, by their bold name. */
  design: string[];
  group: Group;
  /** The props a preview gives a no-op. */
  handlers: string[];
  height: number;
  name: string;
  /** Space above and below each state, for a message that opens outside its control. */
  pad: number;
  states: State[];
};

/** A shared control: its name and source file. */
export type Control = { name: string; path: string };

/**
 * What the TypeScript program says of a control. `rest`: it also takes its HTML element's
 * attributes. `forms` lists the required props of each form of a control whose props are a union.
 */
export type Docs = {
  forms: string[][];
  props: Prop[];
  rest: boolean;
  summary: string;
};

export type Group =
  'Actions' | 'Feedback' | 'Forms' | 'Foundation' | 'Overlays';

export type Outcome = 'blocked' | 'matches';

/** A prop in a control's README table. */
export type Prop = {
  doc: string;
  name: string;
  optional: boolean;
  type: string;
};

export type Result = {
  differing: number;
  name: string;
  outcome: Outcome;
  percent: number;
};

export type Shot = {
  fullPage: boolean;
  height: number;
  scale: number;
  width: number;
};

/** A control inside a state: its name on `window.KinScape`, its props and its text. */
export type Slot = {
  children?: string;
  control: string;
  props: Record<string, unknown>;
};

/** One state a preview mounts. A slot holds a control; a preview draws it from `window.KinScape`. */
export type State = {
  children?: Slot[] | string;
  /** Matches the design kit case of the same label in `react-18.test.tsx`. */
  label: string;
  props: Record<string, unknown>;
  /** A control for each prop that takes an element, by prop name. */
  slots?: Record<string, Slot>;
};

/** A font file `app/layout.tsx` loads: its path under `app/` and the face it declares. */
export type SystemFile = {
  path: string;
  style: string;
  weight: string;
};

/** One entry of `type.fonts` in the design system's `tokens.json`. */
export type SystemFont = {
  family: string;
  file: string;
  style: string;
  weight: string;
};

export type SystemGroup = {
  family: string;
  name: string;
  styles: SystemStyle[];
};

export type SystemStyle = {
  fontSize: string;
  fontStyle: string;
  fontWeight: string;
  letterSpacing: string;
  lineHeight: string;
  name: string;
  usage: string;
};

export type SystemToken = {
  name: string;
  usage: string;
  value: string;
};

/** The design system's `tokens.json`. */
export type SystemTokens = {
  color: { themes: { id: string; name: string }[]; tokens: SystemToken[] };
  focus: { tokens: SystemToken[] };
  name: string;
  radius: { tokens: SystemToken[] };
  shadow: { tokens: SystemToken[] };
  size: { tokens: SystemToken[] };
  spacing: { tokens: SystemToken[] };
  type: {
    families: Record<string, string>;
    fonts: SystemFont[];
    groups: SystemGroup[];
  };
  version: number;
};
