# Plan: C234: Commit the design canvas and its exporter

- **Spec:** #234
- **Status:** approved

## Approach

Port the starter into `scripts/design-export.mts`, shaped like `design-shots.mts`: tested pure functions (jobs, link map, rewrites, checks) plus a Chromium step. It writes `design/source/`, formats with Prettier's API and loads `fonts.css`.

## Decisions

**D1 · Repo files inside `design/canvas/`** · Decides: Tech lead

`export.json` and `VERSION` sit in the folder "nothing edits except a copy".

- **A.** Keep them there; ignore only `*.dc.html` and `canvas.json`. A copy must not replace the folder.
- **B.** Move `export.json` to `design/export.json`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Covering the Chromium step** · Decides: Tech lead

- **A.** `v8 ignore` with a reason; byte-for-byte shown by hand.
- **B.** An e2e test exports into a temp folder and diffs it.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                              | What                                                 |
| ------------------------------------------------- | ---------------------------------------------------- |
| `.prettierignore`, `eslint.config.mjs`            | Ignore the copied files                              |
| `design/canvas/`                                  | Canvas copy, `VERSION`, `export.json` (50 snapshots) |
| `scripts/design-export.mts`, `scripts/__tests__/` | Exporter and tests                                   |
| `package.json`                                    | `design:export`                                      |

## Order of work

1. Ignores, so the pre-commit hook leaves the copy alone.
2. Tech lead commits the design agent's canvas copy.
3. Tests first (rule 12), then the exporter.
4. Export all 50; `git diff --exit-code design/source`.

## Risks

- The repo's Prettier or Chromium may differ from the design agent's by a byte: I'll stop and ask, changing no snapshot.

## Proof

| Acceptance check                                  | Proven by                 |
| ------------------------------------------------- | ------------------------- |
| Byte-for-byte                                     | Step 4 output in the PR   |
| Off-token hex fails, naming file and colour       | Unit test; one manual run |
| `export.json` matches Screens table and `source/` | Unit test                 |
| `test`, `lint`, `format:check`, `words`, `e2e`    | Output in the PR          |

## Deviations

- Types in `scripts/types.ts`, as lint requires.
- `export.json` also holds the icon path and the `Kit-menu-phone.dc.html` link.
- Named colours (`red`) are not checked; `hsl()`, `hwb()`, `lab()`, `lch()`, `color-mix()` fail.

## Out of scope

- CI export and `DESIGN.md` handoff text: #235.
