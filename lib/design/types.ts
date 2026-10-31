export type Outcome = 'blocked' | 'matches';

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
