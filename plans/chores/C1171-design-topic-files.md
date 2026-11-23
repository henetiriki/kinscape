# Plan: C1171: Split design/DESIGN.md into topic files that plan:new lists

- **Spec:** #1171
- **Status:** draft

## Approach

Move each section of `design/DESIGN.md` as it is into the five topic files of step 1. Each file starts with the `paths:` frontmatter of step 2, then a `#` title. `DESIGN.md` keeps the sections of step 4 and gets a `## Design files` index: one bullet per topic file, with its link and its section names. A new constant `DESIGN_FILES` in `lib/design/system.mts` lists `DESIGN.md` and the five topic files. A new function `designSections(texts)` splits each file at its `## ` headings and drops the frontmatter and title. `readme` and `designBullets` take those sections, so `DESIGN.md` still supplies _Copy_ and the README order stays `README_SECTIONS`. `plainLinks` already turns each repo link into its label, so the new link targets of step 8 give the same README and card text. `plan:new` reads `design/` with the same `patternFiles` and `patternsFor` as `docs/patterns/`. It prints the matches under a new `Design files:` heading. The hand-back rows (`AGENTS.md`, `docs/patterns/components.md`) go to the tech lead. The CI agent builds the other rows.

## Decisions

**D1 · Lines that step 8 does not list** · Decides: Tech lead

Step 8 says each line outside `plans/` that sends a reader to `DESIGN.md` for a moved section names the topic file. Its list leaves out three lines on `main`. After step 5 they name the wrong file:

- `lib/design/types.ts:7`: "The `DESIGN.md` bullets, in any section".
- `lib/design/states.mts:1`: "`DESIGN.md` bullets".
- `scripts/__tests__/design-system.test.ts:201`: "the DESIGN.md family".

`states.mts` is a design system input, but a comment changes no output.

- **A.** Change the three lines to name the design files (or `foundations.md` for the font family). The diff grows by 3 lines.
- **B.** Change only the listed lines. The three lines stay wrong.
- **Other:** your own.

Recommended: A, because the code comment rule says that a comment tells why the code is as it is now.

## Alternatives considered

- Read every `design/*.md` file. `CANVAS.md` and `COMPONENTS.md` have bold bullets, and one bold name in two files makes `designBullets` throw. An explicit list also fixes the order.
- Join the six files into one text for `readme`. Each file's frontmatter and title would join the last section of the file before it.
- List the design files under `Pattern files:`. Step 7 calls them design files, so a session must find them under that name.

## Files that change

| File                                                                                                       | New / changed | What                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design/foundations.md`, `design/layout.md`, `design/components.md`, `design/feedback.md`, `design/map.md` | New           | Steps 1 to 3; link targets of step 8                                                                                                                         |
| `design/DESIGN.md`                                                                                         | Changed       | Step 4: the moved sections go; the index; the `#components` link                                                                                             |
| `lib/design/system.mts`                                                                                    | Changed       | `DESIGN_FILES`, `designSections`; `readme` takes the sections; error text names the design files                                                             |
| `lib/design/cards.mts`                                                                                     | Changed       | `designBullets` takes the sections; comment and error text                                                                                                   |
| `scripts/design-system.mts`                                                                                | Changed       | Reads each file of `DESIGN_FILES`                                                                                                                            |
| `lib/design/types.ts`, `lib/design/states.mts`                                                             | Changed       | The comment of D1 (A only)                                                                                                                                   |
| `lib/design/__tests__/system.test.ts`                                                                      | Changed       | Reads the design files. _Motion_ comes from `foundations.md` and ends at the end of the file. New error text                                                 |
| `lib/design/__tests__/cards.test.ts`                                                                       | Changed       | Reads the design files; new error text                                                                                                                       |
| `scripts/__tests__/design-system.test.ts`                                                                  | Changed       | Test name of D1 (A only)                                                                                                                                     |
| `scripts/plan-new.mts`                                                                                     | Changed       | Prints `Design files:` from `design/`                                                                                                                        |
| `scripts/__tests__/plan-new.test.ts`                                                                       | Changed       | The fake `list` and `read` serve the real `design/` files. `features/map/style.ts` lists `design/map.md`; `server/trees/repository.mts` lists no design file |
| `scripts/pattern-files.mts`                                                                                | Changed       | The header comment names `design/`                                                                                                                           |
| `scripts/__tests__/pattern-files.test.ts`                                                                  | Changed       | "The design files of the repo": the five files, and each glob matches a tracked file                                                                         |
| `scripts/vercel-ignore.mts`                                                                                | Changed       | Step 9: `/^design\/[^/]+\.md$/`                                                                                                                              |
| `scripts/__tests__/vercel-ignore.test.ts`                                                                  | Changed       | Skips a deploy for `design/components.md`                                                                                                                    |
| `scripts/word-count.mts`                                                                                   | Changed       | Step 10: one entry per file                                                                                                                                  |
| `scripts/__tests__/word-count.test.ts`                                                                     | Changed       | `DESIGN.md` 950, and the five new budgets                                                                                                                    |
| `plans/README.md`                                                                                          | Changed       | Step 7                                                                                                                                                       |
| `docs/architecture.md`                                                                                     | Changed       | Line 9 link                                                                                                                                                  |
| `eslint.config.mjs`                                                                                        | Changed       | Lines 124, 128 and 225                                                                                                                                       |
| `.claude/skills/refine/slice-intent.md`, `.claude/skills/refine/bug.md`, `.claude/skills/refine/design.md` | Changed       | Step 8 lines                                                                                                                                                 |
| `lib/ui/EventGlyph.tsx`, `lib/domain/map/fan.mts`                                                          | Changed       | Step 8 comments                                                                                                                                              |
| `design/COMPONENTS.md`, `design/CANVAS.md`                                                                 | Changed       | Step 8: line 10; lines 32 and 116                                                                                                                            |
| `.claude/skills/publish-design-system/SKILL.md`                                                            | Changed       | Step 8: the description                                                                                                                                      |
| `AGENTS.md`                                                                                                | Changed       | Step 8: line 8. Hand-back: the tech lead                                                                                                                     |
| `docs/patterns/components.md`                                                                              | Changed       | Step 8: line 28. Hand-back: the tech lead                                                                                                                    |
| `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION`                  | Changed       | The design system steps only                                                                                                                                 |

## Order of work

1. Test first: the `plan:new` test, the design-files glob test and the `vercel-ignore` test fail on the behaviour.
2. Make the topic files and the new `DESIGN.md` in one commit with no other change, so that `git diff --color-moved=plain` shows the move.
3. Steps 5, 6 and 8 to 10, with their tests.
4. Step 2 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system): run `npm run design-system` on the branch, and on `main` in a worktree in `.claude/worktrees/`. Paste the `diff -r` output in the Evidence.
5. The CI agent asks in the PR for the rest, and keeps the PR a draft. A local Claude Code session that the tech lead starts runs these steps. The session needs a signed-in account:
   - the hand-back rows;
   - step 3, `/publish-design-system`;
   - step 4, "Updating the install";
   - step 5, "Refreshing the canvas copy". In 5.4, `npm run design:export` prints "No snapshot changed".
6. Step 6: push the branch. If the `design` or `gallery` job fails on a snapshot or a card image, run Design: Render snapshots. No board shows the change, so step 7 does not run.

## Risks

- **A word budget too small.** The run did not count each section. `npm run words` in the build shows a file over its budget. The build then stops and asks: the issue sets the numbers.
- **A changed README.** `diff -r` against `main` shows any change outside the two exceptions. The `readme` test keeps the section order.

## Proof

| Acceptance check                                                                                     | Proven by                                           |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Each topic file holds its sections, word for word                                                    | `git diff --color-moved=plain` stat in the Evidence |
| Moved lines show as moved                                                                            | The same stat                                       |
| `DESIGN.md` holds the step 4 sections and the index, no frontmatter                                  | Review of the diff                                  |
| _In the repo_ keeps and removes the step 3 lines                                                     | Review of the diff                                  |
| `npm run design-system` writes the same files on the branch and on `main`                            | `diff -r` output in the Evidence                    |
| `plan:new` lists `design/map.md` for `features/map/style.ts`, none for `server/trees/repository.mts` | `scripts/__tests__/plan-new.test.ts`                |
| A glob that matches no tracked file fails                                                            | `scripts/__tests__/pattern-files.test.ts`           |
| No `DESIGN.md#in-the-repo` outside `plans/`                                                          | `git grep` output in the Evidence                   |
| A deploy skips for `design/components.md`                                                            | `scripts/__tests__/vercel-ignore.test.ts`           |
| Steps 2 to 6 ran                                                                                     | The local session's PR comment                      |
| `canvas/project/ds/kinscape/` matches `.design-system/project/`                                      | Step 4.6 report                                     |
| 5.4 prints "No snapshot changed"                                                                     | The local session's PR comment                      |
| No new link cycle                                                                                    | `scripts/__tests__/doc-links.test.ts`               |
| `npm run words`, `npm run lint`, `npm test` pass                                                     | CI                                                  |

## Out of scope

- A rule file in `.claude/rules/` for a design file.
- Rewording any rule in the moved text.

## Deviations
