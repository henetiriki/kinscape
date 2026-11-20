# Plan: B1072: The real NoticeCard and Banner draw differently from the Map boards

- **Spec:** #1072
- **Requirement IDs:** Must not break: [NFR-05](../../docs/requirements.md#nfr-05).
- **Status:** approved

## Approach

The real `NoticeCard` is right (Expected per), so its code does not change. Only the `.banner` rule of `Toast.module.css` changes. It composes `floating` from `Surface.module.css`, as `.toast` does. On desktop it sets `height: 52px` and `padding-right: var(--space-8)`. On a phone, `.shape:has(.action)` has a higher specificity, so the phone box and Retry keep their sizes. `.shape`, `.action` and the `Toast` rules do not change (check 3).

`Banner` joins `PHONE_CARDS`. The width-rule test of `cards.test.ts` does not find it, because its CSS is `Toast.module.css`. The comment of `PHONE_CARDS` says so. The Banner line of `DESIGN.md` gives the `floating` shadow.

This changes a component in `CONTROLS` and `design/DESIGN.md`, so [Changing the design system](../../design/CANVAS.md#changing-the-design-system) steps 2 to 7 apply. Only a local session edits `design/canvas/` ([D1](#decisions)). Do not use the [board swap prompt](../../design/COMPONENTS.md#board-swap-prompt): it keeps the old board on a pixel change, and check 8 expects a change.

## Decisions

**D1 · Who builds this Bug** · Decides: Tech lead

The CI build agent cannot run design steps 3 to 5 or edit `design/canvas/` ([design-system rule](../README.md#design-system)). No path of this plan is in `.github/CODEOWNERS`, so no `hand-back` label comes. #1071 had the same choice and took A.

- **A.** Hand-back: the tech lead adds the `hand-back` label. A local session that the tech lead starts does all of Order of work except step 7. Cost: one local session.
- **B.** Split: the CI build agent does steps 1 to 4 and keeps the PR as a draft. A local session does steps 5 and 6. The CI build agent does steps 8 and 9. Cost: two more hand-offs.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Change the phone board's buttons to 15/22 and keep the drawn card. The tech lead chose the real `NoticeCard` (Expected per).
- Put the shadow and the 52px height on `.shape`. Then `Toast` changes too (check 3).
- A size token for 52px. `size.search` and `size.row-l` are 52px, but they name other parts. `.toast` and `.shape` also give their heights in px.

## Files that change

| File                                                                                      | New / changed | What                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/components/feedback/Toast.module.css`                                                | changed       | `.banner`: `composes: floating`, `height: 52px`, `padding-right: var(--space-8)`. The comment of `.shape` names the 52px desktop banner.                                                                                                                                                                                                                                                                                       |
| `e2e/gallery-looks.spec.ts`                                                               | changed       | Check 1, at 1440px: the "Banner · offline" box has `--shadow-floating`, is 52px tall, and Retry is 8px from its top, bottom and right edge. Check 2, on a phone: the same shadow, a 60px box, a 44px Retry 8px from the top, bottom and right edge.                                                                                                                                                                            |
| `lib/design/cards.mts`                                                                    | changed       | `PHONE_CARDS` lists `Banner`. Its comment says that the width-rule test does not read `Toast.module.css` for `Banner`.                                                                                                                                                                                                                                                                                                         |
| `design/DESIGN.md`                                                                        | changed       | Banner: "`--ink` background, white text, the `floating` shadow, top centre of the map, with one action." (check 9).                                                                                                                                                                                                                                                                                                            |
| `design/canvas/project/Map-phone-states.dc.html`                                          | changed       | `notice` in `empty-date`: `h(K.NoticeCard, { actions: [{ label: 'Jump to 1898' }, { label: 'Clear filters' }], icon: 'place', title: 'No pins in 1901' }, 'Nobody in your filters is pinned to this date.')`. The drawn card, its comment and `mount` go. `offline`: the drawn banner goes. In its place: `KinScape.Banner` with `icon="cloudOff"`, `action="Retry"` and `placed="{{ true }}"`. The drawn Layers button stays. |
| `design/canvas/project/Map.dc.html`                                                       | changed       | `offline`: the drawn banner goes. A plain box `position: absolute; left: 628px; top: 20px; width: 500px` holds `KinScape.Banner` with `icon="cloudOff"` and `action="Retry"`. These are the left, top and width of the drawn banner.                                                                                                                                                                                           |
| `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION` | changed       | Steps 4 and 5.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `design/source/`, `design/*.jpg` of 3 shots, `design/cards/Banner-*.png`                  | changed / new | The render workflow (checks 4 and 8).                                                                                                                                                                                                                                                                                                                                                                                          |
| `plans/bugs/B1072-notice-banner-boards.md`                                                | new           | This plan.                                                                                                                                                                                                                                                                                                                                                                                                                     |

Both banners keep the text "Terrain didn't load. Borders and pins still work."

## Order of work

1. Write the tests of checks 1 and 2. See check 1 fail on the behaviour (the box is 48px tall). Paste the failing line in the PR.
2. Change `Toast.module.css`. Add `Banner` to `PHONE_CARDS`. Change `DESIGN.md`.
3. Run `npm run design:gallery`. The checks 1 and 2 tests pass.
4. Run `npm run design-system` (design step 2).
5. A local Claude Code session that the tech lead starts, with a signed-in account, runs `/publish-design-system` and "Updating the install" (design steps 3 and 4).
6. The same session edits the two boards on the canvas with the Artifact tool, as the table says (design step 7). It runs "Refreshing the canvas copy" (5.1 to 5.5). It posts the sha256 pairs (check 10) and the `npm run design:export` output (check 7) in the PR. It discards the exported `source/` changes, commits `design/canvas/` alone and pushes.
7. The tech lead runs Design: Render snapshots on the branch (design steps 6 and 7 in one render).
8. Compare with `origin/main`. Use `cmp` for each other JPG of `Map` and `Map-phone-states`, and each card image except `Banner`. For the 3 changed JPGs, post the `changedPixels` box of `lib/design/check.mts`.
9. Run the [Commands](../../AGENTS.md#commands) checks. Do the ready check. Write the PR body.

## Risks

- **The phone banner text wraps to three lines.** At 15/22 the text needs two lines in the 358px box, as the 14/20 drawn text does. A third line makes the box taller than 60px, and it covers the Layers button at 156px. Read `map-offline-phone.jpg` after step 7. If the box is taller than 60px, stop for the tech lead.
- **The card frame clips the new shadow.** The `Toast` card has the same shadow and `pad`. Read `Banner-1440.png` and `Banner-390.png` after step 7.
- **The JPG blocks spread a change.** Read "inside the card or the banner" as its box and shadow, widened to whole 8×8 blocks.
- **Another board change lands first.** #1071 merged in #1075, so the JPGs on `main` are the baseline for check 8. If a board change lands before this one, rebase and render again.

## Proof

| Acceptance check                                       | Proven by                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1. Banner at 1440px: shadow, 52px, Retry 8px           | `e2e/gallery-looks.spec.ts` (new)                                                                            |
| 2. Banner at 390px: shadow, sizes as on `main`         | `e2e/gallery-looks.spec.ts` (new)                                                                            |
| 3. `Toast` card image                                  | The gallery comparison of `Toast-1440.png` and `Toast-390.png`; `cmp` in step 8                              |
| 4. `Banner-1440.png`, `PHONE_CARDS`, `Banner-390.png`  | `cards.test.ts` "names only cards that exist"; the files after step 7                                        |
| 5. `Map-phone-states` mounts `NoticeCard` and `Banner` | Read the board; `git grep -n 'role="alert"\|role="status"'` on the board has no match                        |
| 6. `Map` mounts `Banner`                               | Read the board; `git grep -n 'role="alert"'` on the board has no match                                       |
| 7. The export passes on both boards                    | The `npm run design:export` output in the PR                                                                 |
| 8. Only 3 JPGs change, inside the card or the banner   | `cmp` and the boxes of step 8                                                                                |
| 9. `DESIGN.md` gives the `floating` shadow             | Read the Banner line                                                                                         |
| 10. Steps 2 to 7; same sha256                          | The 4.6 and 5.2 pairs in the PR                                                                              |
| 11. Test, typecheck, lint, e2e, coverage               | The outputs in the PR                                                                                        |
| Must not break: #924 and #925 slots                    | Read the boards; the boxes of check 8 hold only the card or the banner                                       |
| Must not break: #1071 `dock` slot                      | Read the boards: `dock` is as on `main`                                                                      |
| Must not break: `Toast`                                | Check 3                                                                                                      |
| Must not break: `map-empty-date.jpg`                   | `cmp` in step 8                                                                                              |
| Must not break: `NoticeCard` images; no app screen     | `cmp` in step 8; `git grep -w Banner -- app features` names only `Banner.tsx`, `Toast.module.css` and a test |
| Must not break: NFR-05 44px                            | The check 2 test (Retry); `e2e/people.spec.ts` "the notice card fits the width, its link is 44px tall"       |

## Out of scope

- The drawn sources sheet: a later Spec gives `SourcesDialog` a card.
- The drawn Layers button of the phone `offline` variant.
