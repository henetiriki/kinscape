# Plan: DL.27: SignInLayout: the sign-in frame joins the design system

- **Spec:** #923
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05)
- **Status:** approved

## Approach

`git mv` moves `AuthLayout.tsx`, its stylesheet and its test to `app/components/layout/`, with the name `SignInLayout`. The code, the slots and the CSS rules stay the same, so no screen changes a pixel. The card follows `ColumnLayout`: group "Layout", `width: 1440`, `contain`, and a fixed `frame` (D1). The frame is `min-height: 100vh`, and a `height` does not beat a `min-height`, so D1 decides how the card bounds it. DL.6 (#934) swapped its three phone boards with the same media query, so all five boards of Behaviour item 6 are swapped. The wordmark is part of the frame, so a swap drops the drawn wordmark of the board and keeps the rest of its hero and form.

## Decisions

**D1 · How the card bounds a `min-height: 100vh` frame** · Decides: Tech lead

`frame` writes only `height: <frame>px`. `.layout` keeps `min-height: 100vh`, so a state is as tall as the viewport: 900px in a gallery file, and the card height in the artifact. #924 (DL.28, `MapLayout`) has the same concern and no value. It says: "set it in the card and not in the component".

- **A.** `previewHtml` writes `min-height: 0` beside the `height` of `frame`. The card sets `frame: 480`, as `ColumnLayout` does. The `ColumnLayout` preview gets one more rule and the same pixels. #924 can use the same `frame`. Cost: one rule and one test.
- **B.** The card sets no `frame`, and its `height` fits one 900px state. Cost: none in code. The state follows the viewport, so in the artifact it can overflow the card by its caption.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · How a board fills the `hero` slot** · Decides: Tech lead

A board cannot fill a named prop in markup. The exporter reads a prop only from `renderVals()`, and it throws on an `<svg>` child.

- **A.** The board script holds the drawn hero as a string. `renderVals()` mounts it with `dangerouslySetInnerHTML`. The form stays markup. Cost: the canvas cannot edit the hero text.
- ~~**B.** The boards keep their drawn frame. Cost: a Chore for a markup way to fill a named slot.~~

**Answer: A** (@henetiriki)

**D3 · Order of step 7** · Decides: Tech lead

The local session cannot start Chromium, so it cannot check the export or the pixels.

- **A.** Swap the boards in the repo copy first. CI renders them. Publish to the canvas only when no `sign-in-*` JPG changes.
- ~~**B.** Swap on the canvas first, then refresh the repo copy. Cost: a failed board is already on the canvas.~~

**Answer: A** (@henetiriki)

## Alternatives considered

- Rename `--auth-sea` to `--sign-in-sea`. Behaviour item 1 keeps the CSS rules, and the name is not `AuthLayout`.

## Files that change

| File                                                                                                                         | New / changed  | What                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------ |
| `app/components/auth/AuthLayout.tsx`, `.module.css`, `__tests__/AuthLayout.test.tsx` → `app/components/layout/SignInLayout*` | Moved, changed | New name, import paths and test title; same rules and tests                          |
| `app/sign-in/page.tsx`                                                                                                       | Changed        | Uses `SignInLayout`                                                                  |
| `lib/design/bundle.mts`                                                                                                      | Changed        | `CONTROLS` gains `SignInLayout` after `ColumnLayout`                                 |
| `lib/design/cards.mts`                                                                                                       | Changed        | `PHONE_CARDS` gains `SignInLayout`; its comment says ten; `frame` rule (D1)          |
| `lib/design/states.mts`                                                                                                      | Changed        | The card: one state, `Hero` in `hero` and `Form` as children, `width: 1440`, `frame` |
| `lib/design/__tests__/{bundle.test.ts,cards.test.ts,react-18.test.tsx}`, `scripts/__tests__/design-system.test.ts`           | Changed        | 52 → 53 controls; the `frame` rule; one React 18 case                                |
| `design/DESIGN.md`                                                                                                           | Changed        | Behaviour item 7                                                                     |
| `.design-system/`, `design/canvas/project/ds/`, `canvas.json`, `VERSION`, `design/cards/SignInLayout-{1440,390}.png`         | Changed        | Steps 2 to 6                                                                         |
| The five boards of Behaviour item 6, with their five snapshots and JPGs                                                      | Changed        | Step 7. No other board imports them                                                  |

## Order of work

1. If D1 is A, write the `frame` test in `cards.test.ts`. See it fail on the missing `min-height: 0`. Change `previewHtml`. Commit.
2. `git mv` the three files. Rename the component and the paths. Update `app/sign-in/page.tsx`. Run `npm test` and `npm run e2e`. Commit.
3. Add `CONTROLS`, `PHONE_CARDS`, the card and the React 18 case. Run `npm run design-system` (step 2) and `npm run design:gallery`. Commit.
4. Update `design/DESIGN.md`. Push. Keep the PR a draft, and ask in it for steps 3 to 7.
5. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5 (`/publish-design-system`, "Updating the install", "Refreshing the canvas copy"). The session needs a signed-in account.
6. The tech lead runs Design: Render snapshots (step 6).
7. The same person or session swaps the five boards with the [board swap prompt](../design/COMPONENTS.md#board-swap-prompt) and refreshes the canvas copy. The tech lead runs the workflow again (step 7).

## Risks

- A drawn form keeps its own gap and padding inside the `form` slot, and the pane adds its own. The swap can then move a pixel. The swap prompt keeps that board as it was, and check 9 says what follows.
- Estimate: about 150 changed lines, without the moved lines, the plan and the generated files. The size cap is not near.

## Proof

| Acceptance check | Proven by                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1                | `npm run design:check`; `git diff main -- design/screens.json` is empty                                               |
| 2                | `git grep AuthLayout -- . ':!plans' ':!design/source' ':!design/canvas'` is empty                                     |
| 3                | `SignInLayout.test.tsx` holds the six tests of `AuthLayout.test.tsx`                                                  |
| 4                | `bundle.test.ts`, `react-18.test.tsx`                                                                                 |
| 5                | `scripts/__tests__/design-system.test.ts`; line 1 of `.design-system/project/components/SignInLayout/preview.html`    |
| 6                | `git ls-files design/cards/SignInLayout-*`                                                                            |
| 7                | The PR lists who ran each step                                                                                        |
| 8                | `sha256sum` of both trees in the PR                                                                                   |
| 9                | The board files; `git diff --name-only <commit before the swap> HEAD -- 'design/*.jpg'` is empty after the step 7 run |
| 10               | `npm test`, `npm run typecheck`, `npm run lint`, `npm run e2e`                                                        |

## Out of scope

As the Spec says. The three `-proposed` Sign-in boards keep their drawn frame.

## Deviations

- Merged `main` after DL.26 (#1043) and ran steps 3 to 5 again, so the artifact and the canvas hold both Specs (`6f3f9f5a`, `a3186c85`).
- The five boards carry the hero as a string (D2) and step 7 ran repo-first (D3) (`032fb279` to `984ffa50`).
- The three phone boards wrap the submit button in a `div` with `margin-top`. The exporter drops `style` on a nested `<x-import>` (`08dcfb68`).
