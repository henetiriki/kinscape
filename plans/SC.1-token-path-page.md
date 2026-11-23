# Plan: SC.1: One page tells how a token value travels

- **Spec:** #1191
- **Requirement IDs:** None (docs and one test)
- **Status:** approved

## Approach

Write `design/topics/tokens.md` with the six parts of the Spec, in order. Its `paths:` frontmatter makes `npm run plan:new` list it. `DESIGN_FILES` in `lib/design/system.mts` does not change, so the design system output stays the same.

A new test finds each direct reader of `design/tokens.json`. A direct reader is a tracked file that meets all of these:

- Its extension is one of these:
  - `.ts`
  - `.tsx`
  - `.mts`
  - `.mjs`
- It is outside `__tests__/` and `e2e/`.
- It has a string literal that ends in `design/tokens.json`.

The test fails and names each reader that the page does not name in a code span. A pure helper in the test file finds the readers, and a case with a synthetic module proves the failure message.

The 17 direct readers on `main` fall into four groups. The page gives one reason for each group:

- MapLibre paint and the drawings that copy the map. MapLibre takes values, not `var()`. The readers:
  - `features/map/style.ts`
  - `features/map/layers/pins.ts`
  - `features/map/layers/polities.ts`
  - `features/map/components/Legend.tsx`
  - `lib/ui/hatch.ts`
  - `app/components/auth/SignInHero.tsx`
  - `app/components/layout/SignInLayout.tsx`
  - `app/screens/map-frame.tsx`
  - `app/screens/map-account-menu/page.tsx`
  - `app/screens/map-pin-count/MapPinCountScreen.tsx`
- JavaScript that needs a number:
  - `app/components/foundation/usePhone.ts`: the breakpoint
  - `app/components/layout/MapLayout.tsx`: the map padding
  - `app/components/feedback/Toast.tsx`: the toast time
- Scripts that build files:
  - `scripts/tokens.mts`
  - `scripts/design-system.mts`
  - `scripts/design-export.mts`
- `scripts/workflows-diagram.mts`, which colours the workflow diagram.

"Change a value" lists only the token steps: edit the value and its note, run `npm run tokens`, run the tests. It then links to [Changing the design system](../design/CANVAS.md#changing-the-design-system) for the rest.

## Decisions

**D2 · The link cycle between the page and `docs/architecture.md`** · Decides: Tech lead

The Spec puts a link on the page to the "Tokens are the one source" row. It also puts a link to the page in the "A colour, size or font value" row. `scripts/doc-links.mts` fails on this cycle unless `ALLOWLIST` holds it.

- **A.** Add `['design/topics/tokens.md', 'docs/architecture.md']` to `ALLOWLIST`. Both links stay. Cost: one line in `scripts/doc-links.mts`.
- **B.** The page names the row as text with `docs/architecture.md` in a code span, not a link. Cost: none, but Behaviour part 5 says "a link".
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · The trigger line of the publish skill** · Decides: Tech lead

The description of `.claude/skills/publish-design-system/SKILL.md` says to publish after a change to `design/topics/*.md`. After this Spec, `design/CANVAS.md` › **When** names only the topic files that `lib/design/system.mts` reads. #1193 (SC.3) says SC.4.2 edits this skill for `design/tokens.json`.

- **A.** Change `design/topics/*.md` in the description to the same words as **When**. Cost: one line.
- **B.** Leave the skill. SC.4.2 edits it. Cost: none now, but a change to `tokens.md` asks for a publish that changes nothing until then.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · The index in `design/DESIGN.md`** · Decides: Tech lead

`design/DESIGN.md` › Design files lists each topic file. The Spec does not list `design/DESIGN.md` in its changes, and a change to it is a design system input under **When**.

- **A.** Leave `design/DESIGN.md`. `npm run plan:new`, `AGENTS.md` and `docs/architecture.md` lead to the page. Cost: none, but the index misses one file.
- **B.** Add a line for the page to the index. Cost: the design system steps 2 to 6, which a local session runs. The Design files section is not in `README_SECTIONS`, so the output can stay byte-identical, but a run must prove it.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                            | New / changed | What                                                                                                               |
| ----------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `design/topics/tokens.md`                       | New           | The six parts; `paths:` as the Spec lists                                                                          |
| `lib/design/__tests__/tokens-page.test.ts`      | New           | The direct-reader test and its synthetic case                                                                      |
| `scripts/__tests__/plan-new.test.ts`            | Changed       | A body that cites `design/tokens.json` lists `design/topics/tokens.md`                                             |
| `scripts/__tests__/pattern-files.test.ts`       | Changed       | "are the five topic files" becomes six, with `tokens.md`                                                           |
| `scripts/word-count.mts`                        | Changed       | A 500-word budget for `design/topics/tokens.md`                                                                    |
| `scripts/__tests__/word-count.test.ts`          | Changed       | The row for the new budget                                                                                         |
| `design/CANVAS.md`                              | Changed       | **When**: "a file in `design/topics/`" becomes "a topic file that `DESIGN_FILES` in `lib/design/system.mts` lists" |
| `docs/architecture.md`                          | Changed       | The "A colour, size or font value" row links to the page                                                           |
| `scripts/doc-links.mts`                         | Changed       | D2 A: the allowlist entry                                                                                          |
| `.claude/skills/publish-design-system/SKILL.md` | Changed       | D3 A: the trigger line                                                                                             |
| `docs/glossary.md`                              | Changed       | Scale and Scale setting under Glossary terms, each Meaning cell starting "Planned (#1188)."                        |
| `AGENTS.md`                                     | Changed       | Hand-back. Source of truth links to the page. The tech lead builds this row in a local session.                    |
| `design/DESIGN.md`                              | Changed       | D4 B: Design files lists the page                                                                                  |
| `design/canvas/`                                | Changed       | Step 5 of Changing the design system: `VERSION`, `project/canvas.json` and the `project/ds/kinscape/` files        |
| `scripts/__tests__/tracked.ts`                  | Changed       | `trackedFiles`, shared by `pattern-files.test.ts` and `tokens-page.test.ts`                                        |
| `lib/design/system.mts`                         | Changed       | The header comment names `DESIGN_FILES`, not the folder                                                            |

## Order of work

1. Write the plan-new case and the direct-reader test. See each fail on the missing page. Paste the failing lines in Evidence.
2. Run `npm run design-system`. Record the sha256 of each file under `.design-system/project/`.
3. Write the page. Update the pattern-files test and the word budget.
4. Edit `design/CANVAS.md`, `docs/architecture.md`, `docs/glossary.md`, and the D2 and D3 files. Run `scripts/__tests__/doc-links.test.ts` after each link edit.
5. Run `npm run design-system` again. Compare each sha256 with step 2.
6. Run the checks in `AGENTS.md` › Commands.
7. Ask the tech lead in the PR to add the `AGENTS.md` link in a local session.

## Risks

- These files are near their budgets. If an edit goes over, cut words in the same file:
  - `AGENTS.md`
  - `docs/architecture.md`
  - `design/CANVAS.md`
  - `docs/glossary.md`
- A reader that builds the path at run time (for example `join('design', 'tokens.json')`) escapes the string test. No module does this on `main`. A fix (an AST scan) costs about 60 lines. Review catches it.
- SC.3 (#1193) and SC.4 move the readers. Each must update the page, or the new test fails.

## Proof

| Acceptance check                                                      | Proven by                                                       |
| --------------------------------------------------------------------- | --------------------------------------------------------------- |
| `plan:new` lists `design/topics/tokens.md` for `design/tokens.json`   | `scripts/__tests__/plan-new.test.ts`                            |
| Each direct reader is named on the page                               | `lib/design/__tests__/tokens-page.test.ts`                      |
| An unnamed reader fails a test that names it                          | The synthetic case in `tokens-page.test.ts`; Evidence of step 1 |
| `.design-system/project/` is byte-identical                           | sha256 lists of steps 2 and 5 in Evidence                       |
| "Change a value" links to Changing the design system, copies no steps | Review; `scripts/__tests__/doc-links.test.ts`                   |
| The glossary holds Scale and Scale setting, Planned (#1188)           | Review                                                          |
| Each check passes, with `npm run words` and `doc-links.test.ts`       | Check output in Evidence                                        |

## Out of scope

- The size check part of the page: SC.2 (#1192).
- The standard token format and its readers: SC.3 (#1193) and SC.4.

## Deviations

- The "A colour, size or font value" row links to the page as "path" in its second cell, with `docs/architecture.md` unchanged elsewhere.
- `SKILL.md` lost words to stay at its budget of 650. The description now says "a design system input". A new **When to run** list holds the inputs. (#1212 review, tech lead answer)
- `design/topics/tokens.md` names the checks, gives one clause for the effect of each, and links to the row in `docs/architecture.md`. It does not restate the rule of the row. The line "`lib/design/system.mts` does not read it" stays in `design/DESIGN.md` only. This differs from the wording of Spec parts 2 and 5. (#1212 review, tech lead answer)
- `project/design-system.json` differs from the output of `main` in its commit stamp (`at`, `note` and `via` of `lastChange`). The other 238 files have the same sha256.
