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
