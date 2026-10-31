/** One uploaded file in the design system index's `assetGroups.<Group>.files`. */
export type AssetRecord = {
  blob: string;
  name: string;
  size: number;
  type: string;
};

/** `design/canvas/export.json`: how `npm run design:export` turns artboards into snapshots. */
export type CanvasExport = {
  /** The canvas's path for the app icon; snapshots use `app/icon0.svg`. */
  icon: string;
  /** Artboards with no plain snapshot of their own, and the snapshot a link to one opens. */
  links: Record<string, string>;
  snapshots: CanvasSnapshot[];
};

export type CanvasSnapshot = {
  /** The artboard in `design/canvas/project/`. */
  file: string;
  name: string;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
  viewport: { height: number; width: number };
};

export type Denial = {
  // An estimate at API prices of the cost of the turn that made the call; unknown if the
  // transcript doesn't link the denial to a turn.
  costUsd?: number;
  detail: string;
  tool: string;
};

export type DesignExportDeps = {
  /** Loads the prepared artboard in Chromium, fills its template and returns the page's HTML. */
  render: (html: string, snapshot: CanvasSnapshot) => Promise<string>;
};

/** The parts of `design-system.json` that `design-system-publish.mts` writes; other keys pass through. */
export type DesignIndex = {
  [key: string]: unknown;
  assetGroups: Record<
    string,
    {
      files: Record<string, AssetRecord>;
      name: string;
      order: string[];
      tile: string;
    }
  >;
  lastChange: { at: string; by: string; note: string; via: string };
};

export type DesignShotsCiDeps = {
  append: (file: string, text: string) => void;
  /** Runs git with the given arguments and returns its output. */
  git: (args: string[]) => string;
};

export type Gh = (args: string[], input?: string) => string;

export type PrepareMapDataDeps = {
  applyCommands: (
    commands: string,
    input: Record<string, string | Uint8Array>
  ) => Promise<Record<string, string | Uint8Array>>;
  download: (url: string) => Promise<Uint8Array>;
  glyphRange: (
    font: Uint8Array,
    start: number,
    end: number
  ) => Promise<Uint8Array>;
};

export type Transcript = {
  costUsd: number | undefined;
  denials: Denial[];
  durationMs: number | undefined;
  finalText: string;
  model: string | undefined;
  // The result event's subtype ("success", "error_max_turns", ...), or "no result" if the run
  // stopped before one.
  outcome: string;
  // Tool calls by name; a Bash call is counted by the command it starts with (`Bash:npm`).
  tools: Record<string, number>;
  turns: number | undefined;
};
