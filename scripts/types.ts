export type Denial = { detail: string; tool: string };

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
