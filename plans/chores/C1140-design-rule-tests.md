# Plan: C1140: Test the type floor, brand name, feedback roles and icon hiding

- **Chore:** #1140
- **Requirement IDs:** [NFR-06](../../docs/requirements.md#nfr-06)
- **Status:** draft

## Approach

Two new checks replace two prose rules of `design/DESIGN.md`. Tests on `main` already prove the other two rules, so the build adds no test for them (#1140 D2).

- **Type floor.** A new test in the `tokens.json` block of `lib/design/__tests__/design.test.ts` reads each `type` style. The styles under 12.5px must equal `SMALL_TYPE` exactly: `credits`, `overline` and `overline-tight` at 11px, and `mono` at 12px (D3). Each entry of `SMALL_TYPE` gives its reason, from the "Used for" column of the Fonts table. A second test reads each `map` entry whose name ends in `-label` and has a `size`. It checks that the six names are `polity-label`, `contested-label`, `place-label`, `water-label`, `river-label` and `context-label`, and that each size is 11 or more. The name check stops a rename from making the test pass with no entries.
- **Brand name.** A new `scripts/__tests__/brand-name.test.ts` copies the shape of `repo-names.test.ts`. It runs `git grep -n -I -i -o -E 'kin[ ]?scape'` over the tree. Each match that is not `KinScape`, `kinscape` or `KINSCAPE` is a failure, with its path and line. `-I` skips binary files. The pattern holds `[ ]`, so the test file itself does not match it.
- **Banner role.** `Banner.tsx` sets `role='status'`. Each test that finds the banner by `alert` changes to `status`.
- **Prose.** The build removes the four lines of step 6 of #1140 from `design/DESIGN.md`. The Icons row then reads "… (24 on the phone layers button). An icon-only button carries the name".
- **Design system.** `DESIGN.md` and `Banner` are design system inputs. No board shows the change (#1140 D1). The steps run as [Order of work](#order-of-work) says.

## Decisions

**D3 · What the type floor test does when a listed style grows** · Decides: Tech lead

#1140 step 1 lists four styles that may sit under 12.5px. The test can check that list in two ways.

- **A.** The styles under 12.5px must equal the list. If `mono` grows to 13px, the test fails until the build removes `mono` from the list. The list never names a style that does not need it.
- **B.** A style on the list may have any size. If `mono` grows, the test still passes, and the list keeps an entry that is not true.
- **Other:** your own.

Recommended: A, because the list then states the facts of `tokens.json` and its reasons stay true. B loses only the stale-entry check.

## Files that change

| File                                               | New / changed | What                                                                                                               |
| -------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `lib/design/__tests__/design.test.ts`              | changed       | `SMALL_TYPE` and the type floor test; the map label test                                                           |
| `scripts/__tests__/brand-name.test.ts`             | new           | The brand name test                                                                                                |
| `app/components/feedback/Banner.tsx`               | changed       | `role='status'`                                                                                                    |
| `app/components/feedback/__tests__/Alert.test.tsx` | changed       | `:54` and `:69` expect `status`. The name of the test at `:45` says "politely", not "at once"                      |
| `e2e/gallery-looks.spec.ts`                        | changed       | `:52` and `:319` find the banner by `status`                                                                       |
| `design/DESIGN.md`                                 | changed       | Remove the four lines of #1140 step 6; capitalise "An" in the Icons row                                            |
| `design/canvas/project/ds/kinscape/`               | changed       | Steps 4 and 5 of Changing the design system: the README and the component bundle. Also `canvas.json` and `VERSION` |
| `design/source/map-offline.html`                   | changed       | The workflow writes `role="status"` on the banner                                                                  |
| `design/source/map-offline-phone.html`             | changed       | The workflow writes `role="status"` on the banner                                                                  |
| `plans/chores/C1140-design-rule-tests.md`          | new           | This plan                                                                                                          |

## Order of work

These are the steps of [Changing the design system](../../design/CANVAS.md#changing-the-design-system).

1. The CI build agent changes the code:
   1. Add the type floor and map label tests. Change `design/tokens.json` to a 12px `body` on the local tree only, and see the test fail. Undo the change.
   2. Add the brand name test. Add a wrong spelling to a doc on the local tree only, and see the test fail. Undo the change.
   3. Change the tests of the Banner role to `status`, and see them fail. Change `Banner.tsx`.
   4. Remove the four `DESIGN.md` lines.
   5. Paste each failing line in the Evidence of the PR.
2. The CI build agent runs `npm run design-system`. It pushes the branch, asks the tech lead in the PR for steps 3 to 6, and keeps the PR a draft.
3. The tech lead, or a local Claude Code session that the tech lead starts, runs `/publish-design-system`. The session needs a signed-in account.
4. The same person or session runs "Updating the install" (4.1 to 4.6).
5. The same person or session runs "Refreshing the canvas copy" (5.1 to 5.5).
6. No board shows the change. The same person or session pushes the branch. The `design` job then fails on `map-offline.html` and `map-offline-phone.html`, so the session runs the workflow Design: Render snapshots on the branch.

## Risks

- The brand name test reads the whole tree on each `npm test`. `git grep` reads the tree in well under a second, as `repo-names.test.ts` does.
- A new source data file or licence text can spell the name in another way. The test then fails, and the build that adds the file must fix the spelling or ask.

## Proof

| Acceptance check                                                                                               | Proven by                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The tests of steps 1 and 2 pass, and fail on a 12px `body` or a wrong spelling                                 | `design.test.ts`, `brand-name.test.ts`; the failing lines in the PR Evidence                                                                                                                        |
| The tests of steps 3 and 4 pass, and fail on an `Alert` error with `status` or an `Icon` with no `aria-hidden` | `Alert.test.tsx:8`, `Toast.test.tsx:24`, `Toast.test.tsx:65`, `Callout.test.tsx:7`, `TextField.test.tsx:53`, `NoticeCard.test.tsx:22`, `Alert.test.tsx:54`, `Alert.test.tsx:69`, `Icon.test.tsx:27` |
| `Banner` has `role="status"`                                                                                   | `Alert.test.tsx:54`, `Alert.test.tsx:69`; `gallery-looks.spec.ts:52`, `:319`                                                                                                                        |
| `DESIGN.md` no longer holds the four lines                                                                     | The diff of `design/DESIGN.md`                                                                                                                                                                      |
| Steps 2 to 6 of Changing the design system ran                                                                 | The commits of steps 5 and 6 on the branch                                                                                                                                                          |
| The sha256 of each `ds/kinscape/` file is the same as `.design-system/project/`                                | Step 4.6 report in the PR                                                                                                                                                                           |
| `npm run design:export` changes only the two `map-offline` snapshots                                           | The workflow commit; the `design` job passes                                                                                                                                                        |
| `npm test` passes                                                                                              | `npm test` output in the PR                                                                                                                                                                         |

## Out of scope

- `design/DESIGN.md:128` and `:133`: a later Chore removes them.
- A new test file for the feedback roles, or a new `Icon` test (#1140 D2).
- The look of any component.

## Deviations
