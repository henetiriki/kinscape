# Plan: C406: Add /sync-canvas to copy the design canvas into the repo

- **Spec:** #406
- **Status:** approved

## Approach

A project skill reads `canvas.json` and each board it lists with `Artifact`, writes them with Write, deletes dropped boards with `git rm -f`, then updates `VERSION` line 2. Prettier and ESLint already ignore these files, so the format hook keeps them byte for byte.

## Decisions

**D1 · Stopping before any write** · Decides: Tech lead

The copy is about 1.2 MB (roughly 350k tokens).

- **A.** Two passes. Read each listed file once to check it, writing nothing. Then read and write one file at a time. If pass 2 fails, `git restore design/canvas` and stop.
- **B.** Read every file, then write them all, holding the whole copy in context at once.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                  | What                                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `.claude/skills/sync-canvas/SKILL.md` | New skill                                                                                       |
| `design/DESIGN.md`                    | Line 66, first sentence: "…from its artboard in `canvas/`, the copy `/sync-canvas` makes, and…" |
| `.github/agent/settings.json`         | `Artifact` allowed                                                                              |

## Deviations

- The skill checks board names (no `/` or `..`) before writing, and on a pass-2 failure also runs `git clean -fd design/canvas`.
- `design/DESIGN.md` line 3 points to `canvas/VERSION` for the canvas link, so it has one home.

## Risks

- `Artifact` may be unavailable headless, or the OAuth account may lack canvas access; the post-merge run shows it.
- Every byte passes through the model, so a long board could be retyped wrongly; the unchanged-canvas run catches it.

## Proof

| Acceptance check                              | Proven by                                                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Unchanged canvas: clean `git status`          | Local run; output in PR                                                                                     |
| Label change, removed board, unreadable board | Runs against a remix of the canvas, linked from `VERSION` line 1 for the test only; `git diff --stat` in PR |
| Build agent runs it after merge               | Throwaway-branch run, output in PR                                                                          |
| `words`, `lint`, `format:check`               | Output in PR                                                                                                |
