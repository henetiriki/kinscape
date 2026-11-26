/** What a control's design system card shows (Spec #450). */
export type Card = {
  /** The CSS width of each state's box, for a control that fills its parent. A state has no box of its own. */
  box?: string;
  /** The state boxes hold a fixed bar: each is the containing block of its `position: fixed` part. */
  contain?: boolean;
  /** The design file bullets, in any section, that the README holds, by their bold name. */
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

/** A DTCG 2025.10 `color` value. The CSS writer reads `hex` and `alpha` (#1193 plan D4). */
export type DtcgColour = {
  alpha?: number;
  colorSpace: 'srgb';
  components: number[];
  hex?: string;
};

/** A DTCG `dimension` value. */
export type DtcgDimension = { unit: 'px' | 'rem'; value: number };

/** A DTCG `duration` value. */
export type DtcgDuration = { unit: 'ms' | 's'; value: number };

/** One layer of a DTCG `shadow` value. */
export type DtcgShadowLayer = {
  blur: DtcgDimension;
  color: DtcgColour;
  inset?: boolean;
  offsetX: DtcgDimension;
  offsetY: DtcgDimension;
  spread: DtcgDimension;
};

/** A token as the CSS writer sees it: its path, its `$type` and its resolved `$value`. */
export type DtcgToken = { $type?: string; $value: unknown; path: string[] };

/** A DTCG `transition` value. */
export type DtcgTransition = {
  delay: DtcgDuration;
  duration: DtcgDuration;
  timingFunction: number[];
};

/** A group of `design/kinscape.tokens.json`: tokens and groups, and an optional note. */
export type DtcgTree = { [key: string]: unknown; $description?: string };

/** One screen and width that fails the 200% text check on the branch (`lib/design/large-text.json`). */
export type LargeTextEntry = { screen: string; width: number };

/** The outcome of one screen and width: `text` says why it fails, and is empty when it passes. */
export type LargeTextResult = { ok: boolean; text: string };

/** A problem that `tokenLiterals` finds in a `.module.css` file: its 1-based line and what is wrong. */
export type LiteralProblem = { line: number; text: string };

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

/** How a property reads its tokens: `pick` takes the text of each token of the property's group from the DTCG tree. */
export type Rule = {
  kind: 'colour' | 'duration' | 'number' | 'shadow';
  pick: (tokens: DtcgTree) => string[];
};

/**
 * The settings of a step group, in `$extensions.kinscape` (#1238 plan D13). `unit` is the DTCG unit of
 * each step. A `rem` group takes px inputs and writes each step as px ÷ 16. `grid` counts steps of one `grid`; `ratio` and `hybrid` multiply by `ratio`.
 */
export type ScaleSettings = (
  | {
      above: number;
      base: number;
      below: number;
      mode: 'ratio';
      ratio: number;
      round: number;
    }
  | {
      above: number;
      grid: number;
      limit: number;
      mode: 'hybrid';
      ratio: number;
    }
  | { grid: number; mode: 'grid'; steps: number }
  | { mode: 'explicit'; values: number[] }
) & { unit: ScaleUnit };

/** A DTCG unit that a scale step has. */
export type ScaleUnit = DtcgDimension['unit'] | DtcgDuration['unit'];

export type Shot = {
  fullPage: boolean;
  height: number;
  scale: number;
  width: number;
};

/** A size that the size check reads. `token`: it equals a token of its group. `own`: its line has an `own:` reason. */
export type Size = {
  file: string;
  line: number;
  own: boolean;
  property: string;
  token: boolean;
  value: string;
};

/** A line of `off-token-sizes.json`: the size appears `count` times in the file. */
export type SizeEntry = {
  count: number;
  file: string;
  property: string;
  value: string;
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
