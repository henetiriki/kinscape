/** What a control's design system card shows (Spec #450). */
export type Card = {
  /** The CSS width of each state's box, for a control that fills its parent. A state has no box of its own. */
  box?: string;
  /** The state boxes hold a fixed bar: each is the containing block of its `position: fixed` part. */
  contain?: boolean;
  /** The `DESIGN.md` bullets, in any section, that the README holds, by their bold name. */
  design: string[];
  /** The px height of each state's control, for a control that fills the viewport. The preview sets it, so the component keeps its own height. */
  frame?: number;
  group: Group;
  /** The props a preview gives a no-op. `rows.onChange` names `onChange` in each item of the list prop `rows`. `sheet.onExpandedChange` names `onExpandedChange` in the object prop `sheet`. */
  handlers: string[];
  height: number;
  name: string;
  /** Space above and below each state, for a message that opens outside its control. */
  pad: number;
  /** The control renders radios. The preview puts each state in its own form, so each state has its own radio group. */
  radios?: boolean;
  states: State[];
  /** The px width at which the design system shows the card. */
  width?: number;
};

/** The role of a colour token. If the role has a least contrast, `on` names the token that the contrast uses. */
export type ColourRole = {
  on?: string;
  path: string;
  role: Role;
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

/** The use of a colour token. Only `text` and `border` have a least contrast. */
export type Role =
  | 'border'
  | 'decorative'
  | 'disabled'
  | 'fill only'
  | 'map only'
  | 'overlay'
  | 'text';

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
  /** The props of this control that a preview gives a no-op, named as `Card.handlers` names them. */
  handlers?: string[];
  props: Record<string, unknown>;
};

/** One state a preview mounts. A slot holds a control; a preview draws it from `window.KinScape`. */
export type State = {
  children?: Slot[] | string;
  /** The form that the state shows: its name, set as `data-form` on the state's box, and the CSS width of that box. */
  form?: { box: string; name: string };
  /** Matches the case of the same label in `react-18-cases.tsx`. */
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

export type SystemToken = {
  name: string;
  usage: string;
  value: string;
};

/** The design system's `tokens.json`. */
export type SystemTokens = {
  breakpoint: { tokens: SystemToken[] };
  color: { themes: { id: string; name: string }[]; tokens: SystemToken[] };
  focus: { tokens: SystemToken[] };
  layout: { tokens: SystemToken[] };
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
  z: { tokens: SystemToken[] };
};

type Group =
  | 'Actions'
  | 'Feedback'
  | 'Forms'
  | 'Foundation'
  | 'Layout'
  | 'Map'
  | 'Overlays';

type SystemStyle = {
  fontSize: string;
  fontStyle: string;
  fontWeight: string;
  letterSpacing: string;
  lineHeight: string;
  name: string;
  usage: string;
};
