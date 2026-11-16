# Plan: DL.4: A new component is drawn on the draft page and needs no design kit section

- **Spec:** #897
- **Requirement IDs:** None. The Spec changes docs and the canvas only.
- **Status:** approved

## Approach

A local session adds the canvas page "Drafts" (`drafts`) as the first item of `pages` in `canvas.json`, with no board. `launch.page` stays `sign-in`. `design/COMPONENTS.md` gets two sections:

- "A component that is not built": the five steps of Behaviour 2, as a numbered list.
- "A built component": the case of a component that the app has, and the `/design-kit` rule of Behaviour 3.

The board swap prompt stays. In `lib/design/`, `NOT_BUILT` becomes `NO_ENTRY`, and the two messages of `sweepProblems` change to match. Its parameter `notBuilt` becomes `noEntry`, so one name holds the list. `CANVAS.md`, the refine skill and the glossary each change one line. No [design system input](../design/CANVAS.md#changing-the-design-system) changes, so no publish step runs.

This is a [hand-back](README.md#hand-back): `.claude/skills/refine/design.md` matches `.claude/skills/**` in `.github/CODEOWNERS`. The tech lead builds it.

## Decisions

**D3 · The other records of a draft board** · Decides: Tech lead

On `main`, each snapshot needs a row in the Screens table of `design/DESIGN.md` (`design-export.test.ts`). `design.test.ts` and `design-export.test.ts` count the snapshots (93). A JPG with no `screens.json` entry needs its name in `NO_ENTRY` (`screens.test.ts`). A `DESIGN.md` change is a design system input. Behaviour 2 names none of these. No related issue holds a value.

Does the path name them?

- **A.** Step 1 also says: add a Screens row to `DESIGN.md`, add the name to `NO_ENTRY`, and raise the two counts. Step 4 also removes the row and the name, and lowers the counts. Check 3 keeps five steps.
- **B.** No change. When `npm test` runs, the tests name each missing record.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · Who deletes the snapshot and the JPG of a draft board** · Decides: Tech lead

Step 4 deletes the draft board, its snapshot and its JPG. `AGENTS.md` says that nobody edits the snapshot and the JPG, and no workflow removes them. `design-export.test.ts` fails on a snapshot with no board.

Who deletes the two files?

- **A.** Step 4 names the tech lead, or a local session that the tech lead starts. No code changes.
- ~~**B.** The render workflow removes them. A new Spec builds that.~~
- ~~**C.** Step 4 deletes only the board.~~
- **Other:** your own.

**Answer: A** (@henetiriki)

**D5 · The `AGENTS.md` rule on generated design files** · Decides: Tech lead

`AGENTS.md` says "Never edit" `design/source/` and `design/*.jpg`. D4 allows one deletion. This plan does not list `AGENTS.md`, a hand-back path.

Does this PR change `AGENTS.md`?

- ~~**A.** Add the exception, and link to it from step 4.~~
- **B.** No. A later Chore aligns `AGENTS.md`.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                   | New / changed | What                                                                                |
| -------------------------------------- | ------------- | ----------------------------------------------------------------------------------- |
| `design/canvas/project/canvas.json`    | Changed       | The first page is `{ "id": "drafts", "name": "Drafts" }`; a local session writes it |
| `design/canvas/VERSION`                | Changed       | Line 2: the canvas version after the edit (step 5.3)                                |
| `design/COMPONENTS.md`                 | Changed       | The two sections; the board swap prompt stays                                       |
| `design/CANVAS.md`                     | Changed       | "Drawing a board": one sentence that names the draft page                           |
| `.claude/skills/refine/design.md`      | Changed       | "Kit pages" becomes "Component cards" (Behaviour 5)                                 |
| `lib/design/sweep.mts`                 | Changed       | Two messages name `NO_ENTRY`; parameter `noEntry`; doc comment                      |
| `lib/design/__tests__/screens.test.ts` | Changed       | `NO_ENTRY` and its comment; test names; the expected messages                       |
| `docs/glossary.md`                     | Changed       | "Draft page" loses "**Planned (#893).**"                                            |
| `plans/DL.4-draft-page.md`             | New           | This plan                                                                           |

The expected messages in `screens.test.ts` change, because Behaviour 6 changes the messages ([failing-tests rule](README.md#failing-tests)).

## Order of work

1. A local session that the tech lead starts adds the page on the canvas. It edits `project/canvas.json` only. It runs "Refreshing the canvas copy" (5.1 to 5.5), and 5.4 prints "No snapshot changed". The session needs a signed-in account. If the canvas or the exporter refuses a page with no board, or the tabs are not in list order, stop and comment on #893.
2. Change the expected messages in `screens.test.ts`. See them fail on the message, and paste the failing line in Evidence. Then change `sweep.mts` and rename the list.
3. Edit `COMPONENTS.md`, `CANVAS.md`, the refine skill and the glossary.
4. Run `git grep -n NOT_BUILT -- . ':!plans'` (check 6) and `git grep -n "Kit pages" .claude/skills/refine/design.md` (check 5).
5. Push and mark the PR ready, because a draft PR does not run the `design` job (check 2).
6. Run the checks in `AGENTS.md` › Commands. Paste the output in Evidence.

## Risks

- **The canvas or the exporter refuses a page with no board.** Step 1 runs first, so the build stops before other edits. The Spec forbids a placeholder board.
- **`CANVAS.md` is close to its budget of 1000 words.** The new sentence adds about 13 words. If `npm run words` fails, the build asks the tech lead to choose a cut or a new budget.
- **A PR adds a `/design-kit` section.** No test stops it. A reviewer checks it (Spec).

## Proof

| Acceptance check                         | Proven by                                   |
| ---------------------------------------- | ------------------------------------------- |
| 1. "Drafts" first, `launch.page` sign-in | `canvas.json` in the diff                   |
| 2. The export step passes                | The `design` job of step 5                  |
| 3. The five steps, in order              | `COMPONENTS.md` in the diff                 |
| 4. A changed component updates its kit   | `COMPONENTS.md` in the diff                 |
| 5. No "Kit pages"; a "Component cards"   | `git grep` output of step 4; the diff       |
| 6. No `NOT_BUILT` outside `plans/`       | `git grep` output of step 4                 |
| 7. "Draft page" has no "Planned (#893)"  | `git grep -n "Draft page" docs/glossary.md` |
| 8. `npm run words` and `npm test` pass   | Their output                                |

## Out of scope

Each item of the Spec's "Out of scope / carried forward".

## Deviations

- `design/COMPONENTS.md`: the opening is one line that names the two sections.
- The build reworded Behaviour 2 of #897 for D3 and D4.
- `AGENTS.md` says "Never edit" the snapshot and the JPG, and D4 allows one deletion (D5). A later Chore aligns it.
