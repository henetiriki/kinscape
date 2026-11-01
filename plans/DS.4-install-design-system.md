# Plan: DS.4: Install the design system on the canvas and write down the manual steps

- **Spec:** #447
- **Requirement IDs:** None (design tooling)
- **Status:** approved

## Approach

The tech lead builds this: `AGENTS.md` is a code-owner path (rule 13). The old canvas can't be read any more, so the work moves to a new canvas, "KinScape design kit (ouwl.house)", seeded from the committed copy (D2). Claude Code reads and writes it with the artifact tools. The copy is refreshed twice, each in its own commit with `VERSION` updated: from the seeded canvas, then after the install. An unchanged `design/source/` after `npm run design:export` proves neither touched a board.

## Decisions

**D1 · How the installed files are kept out of the checks** · Decides: Tech lead

- ~~**A.** Ignore only `design/canvas/project/ds/**`.~~
- **B.** Ignore all of `design/canvas/project/**` in `.prettierignore`, ESLint and `tsconfig.json`. Rewords Spec step 3.

**Answer: B** (@henetiriki). Done in `af8f8c4`.

**D2 · Which canvas the design lives on** · Decides: Tech lead

The file tools refuse the old canvas (`1MyZ…`): someone outside the organization wrote to it.

- **A.** A new canvas owned by this account, seeded from the committed copy. Comments and history stay behind; the old canvas is left alone.
- ~~**B.** Keep the old canvas; refresh by download or a canvas chat (Spec D1 A).~~

**Answer: A** (@henetiriki). New canvas: `https://claude.ai/artifact/KNh9aZWeMNtsNSWtWLCbzU`.

## Files that change

| File                                                    | New / changed | What                                                                |
| ------------------------------------------------------- | ------------- | ------------------------------------------------------------------- |
| `design/canvas/project/*.dc.html`                       | Changed       | Refreshed: 8 boards use the new canvas's icon id                    |
| `design/canvas/project/canvas.json`                     | Changed       | New title, then the one `designSystems` entry                       |
| `design/canvas/project/ds/kinscape/**`                  | New           | The installed system                                                |
| `design/canvas/VERSION`                                 | Changed       | Line 1: the new canvas link; line 2: its version after each refresh |
| `design/canvas/export.json`                             | Changed       | `icon`: the new canvas's icon id                                    |
| `design/source/*.html`, `design/*.jpg`                  | Changed       | Only if a board changed, by the Design agent shots workflow         |
| `.prettierignore`, `eslint.config.mjs`, `tsconfig.json` | Changed       | D1                                                                  |
| `design/DESIGN.md`                                      | Changed       | The new link; Screens: refreshing, updating the install, handoff    |
| `docs/how-we-work.md`                                   | Changed       | The Design row: designed on the canvas with the design system       |
| `AGENTS.md`                                             | Changed       | A person refreshes `design/canvas/` by the documented step          |

## Order of work

1. Refresh the copy with `read_file`, set `export.json`'s `icon` and `VERSION`, commit. `design:export` must leave `design/source/` unchanged.
2. Install: Claude Code copies the design system's `project/` files into `project/ds/kinscape/` and adds the `designSystems` entry, in one publish. The tech lead screenshots a board's colour picker and text styles.
3. Refresh again, commit. Run `design:export`, `git diff --exit-code design/source`, `lint`, `format:check`, `typecheck`.
4. Note what the Export menu and Hand off to Claude Code offer, and read a board through the handoff link.
5. Update the docs in one commit. Reword Spec #447 (steps 1–3) with `gh issue edit`.
6. Run `lint`, `format:check`, `words`, `test`, `validate:boundaries`, `e2e`, `design:check`.

## Risks

- **The install edits boards.** Step 3's export shows a diff: stop and comment on #447.
- **An outside account writes to the new canvas.** `DESIGN.md` says never to share it; fall back to Spec D1 A.
- **A stale install.** `DESIGN.md` says to update it after any `/publish-design-system` run that sends files.

## Proof

| Acceptance check                       | Proven by                                                        |
| -------------------------------------- | ---------------------------------------------------------------- |
| Export leaves `design/source/` alone   | `design:export` and a clean `git diff` (steps 1, 3), in Evidence |
| Colour picker and text styles          | Screenshot in Evidence                                           |
| `ds/kinscape/`, one entry, checks pass | Tree listing, the `designSystems` entry, `lint`, `format:check`  |
| Handoff recorded                       | Evidence notes; the `DESIGN.md` diff                             |
| Branch checks                          | Step 6 output in Evidence                                        |

## Out of scope

- Changing boards to use the system (DS.8) and components (DS.7).
- Deleting or moving the old canvas.

## Deviations

- Intent #442 got a comment, not a rewrite: rule 3 covers the Spec.
- `how-we-work.md`: the Spec-filing bullet is reworded to fit the budget.
- No handoff prompt was pasted (tech lead's call, to save tokens); `DESIGN.md` keeps the snapshot fallback.
