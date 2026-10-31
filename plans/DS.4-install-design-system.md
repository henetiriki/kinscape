# Plan: DS.4: Install the design system on the canvas and write down the manual steps

- **Spec:** #447
- **Requirement IDs:** None (design tooling)
- **Status:** draft

## Approach

The tech lead builds this: `AGENTS.md` is a code-owner path (rule 13), and the canvas steps need someone signed in. The copy is refreshed twice, each in its own commit with line 2 of `VERSION` updated: as the canvas stands, then after the install. Between them, an unchanged `design/source/` after `npm run design:export` proves the install touched no board. The docs then describe the steps that worked, with the handoff or the snapshot fallback (Spec D2).

## Decisions

**D1 · How the installed files are kept out of the checks** · Decides: Tech lead

Prettier would format the install's `.json`, `.css`, `.md` and `.html`, and `tsconfig.json` typechecks any `**/*.ts(x)`, including in `design/canvas/`.

- **A.** As the Spec says: add `design/canvas/project/ds/**` to `.prettierignore`, and to ESLint's `globalIgnores` and the `tsconfig.json` `exclude` only if the folder holds `.js`, `.ts` or `.tsx` files (`tsconfig.json` is not in the Spec).
- **B.** Ignore all of `design/canvas/project/**` in all three, replacing the two `.prettierignore` lines and the ESLint line for `*.dc.html` and `canvas.json`. Nobody edits anything there, so a future canvas folder can't break `format:check`. Rewords Spec step 3 (`gh issue edit`).
- **Other:** your own.

Recommended: B, because one pattern per file stays right as the canvas grows.

## Files that change

| File                                   | New / changed | What                                                                                    |
| -------------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| `design/canvas/project/*.dc.html`      | Changed       | Refreshed from the live canvas (step 2)                                                 |
| `design/canvas/project/canvas.json`    | Changed       | Refreshed, then gains the one `designSystems` entry                                     |
| `design/canvas/project/ds/kinscape/**` | New           | The installed system                                                                    |
| `design/canvas/VERSION`                | Changed       | Line 2: the canvas version after each refresh                                           |
| `design/source/*.html`, `design/*.jpg` | Changed       | Only if step 2 changed a board, by the Design agent shots workflow                      |
| `.prettierignore`                      | Changed       | D1                                                                                      |
| `eslint.config.mjs`                    | Changed       | D1                                                                                      |
| `tsconfig.json`                        | Changed       | D1: under A, only if the install holds `.ts` or `.tsx` files                            |
| `design/DESIGN.md`                     | Changed       | Screens: refreshing the copy, updating the install after a publish, handing off a board |
| `docs/how-we-work.md`                  | Changed       | The Design row: screens are designed on the canvas with the design system               |
| `AGENTS.md`                            | Changed       | Source of truth: a person refreshes `design/canvas/` by the documented step             |

## Order of work

1. Confirm that `DESIGN.md` links the published system. If it doesn't, run `/publish-design-system` and commit its link first.
2. Refresh the copy as the canvas stands (download, or Spec D1 A), then commit. If a board changed, push and run the Design agent shots workflow, which makes its own commit.
3. Install in a canvas chat. Screenshot a board's colour picker and text styles.
4. Refresh again, then commit. Run `npm run design:export` and check that `git diff --exit-code design/source` passes. Add the D1 ignores, then run `lint`, `format:check` and `typecheck`.
5. Hand one board to Claude Code by the Export menu; note what it offered and what arrived.
6. Update the docs as the step 5 result shows, in one commit.
7. Run `lint`, `format:check`, `words`, `test`, `validate:boundaries`, `e2e` and `design:check`.

## Risks

- **The install edits boards.** Step 4's export shows a diff: stop and comment on #447 instead of running the shots workflow.
- **A stale install.** `DESIGN.md` says to update it after any `/publish-design-system` run that sends files.
- **`AGENTS.md` budget (700).** Reword the existing `design/canvas/` line rather than add one.

## Proof

| Acceptance check                       | Proven by                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Export leaves `design/source/` alone   | Step 4's `design:export` and the clean `git diff`, in Evidence            |
| Colour picker and text styles          | Screenshot in Evidence                                                    |
| `ds/kinscape/`, one entry, checks pass | Tree listing, the `designSystems` entry, `lint` and `format:check` output |
| Handoff recorded                       | Evidence notes; the `DESIGN.md` diff                                      |
| Branch checks                          | `words`, `test`, `e2e` and `design:check` output in Evidence              |

## Out of scope

- Changing boards to use the system (DS.8) and components (DS.7).
