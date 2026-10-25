# Plan: DM.13.6: Surfaces board at 0.5%

- **Spec:** #227 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

I fix each screen with `/match-design`, then set all three to `blocking`. The differences come from the snapshot HTML.

Board 07 shares its layout with board 06 (`inputs/page.module.css`, `inputs/Board.tsx`). Board 07 only:

- **Progress bar:** label above the bar (mono 12/16, ink-3); bars 320 wide, 16 apart.
- **Hit areas:** a column, gap 12: the 36px Close (surface-2) and Copy chain, each beside a dashed pill "44 × 44 hit area" (12.5/18, radius 4).
- **Large Notice card:** brand icon, not pin.

## Decisions

**D1 · The layout shared with board 06** · Decides: Tech lead

- **A.** Build after DM.13.5 merges, rebased on it; fix only what is left.
- **B.** Whichever slice builds first fixes the shared layout.

**Answer: A** (@henetiriki)

**D2 · Button S and XS text** · Decides: Tech lead

- **A.** S and XS use `type.button-s`; S padding 16. M keeps 15/18.
- **B.** Leave Button.

**Answer: A** (@henetiriki)

**D3 · Header note and part link wording** · Decides: Tech lead

- **A.** Use the snapshot's words on board 07.
- **B.** Keep the app's words.

**Answer: A** (@henetiriki)

## Files that change

| File                                             | What                                 |
| ------------------------------------------------ | ------------------------------------ |
| `app/design-kit/surfaces/page.{tsx,module.css}`  | One part at a time, stages, callout  |
| `app/design-kit/surfaces/sections.tsx`           | Progress bar, callout, Facts wording |
| `app/components/NoticeCard.module.css`           | Large icon, text gap, 44 buttons     |
| `app/components/Popup.module.css`                | Phone sheet look-up                  |
| `app/components/SourcesDialog.module.css`        | Checked line height                  |
| `e2e/menu-popup.spec.ts`, `e2e/surfaces.spec.ts` | Part 2 specs open `?part=2`          |
| `design/screens.json`                            | Three entries `blocking`             |

## Deviations

- DM.13.5 had already fixed the shared layout and Button S/XS (D1 A, D2 A): only the notice 44px buttons (15/22) changed.
- The desktop snapshot is part 1 of 2, so the board shows one part at a time at every width, with the part link.
- Facts text follows the snapshot (D3 A): "(proposed)" and other newer wording is gone; phone-only rows use `ByViewport`.
- Kit-only looks the snapshot draws: Dialog panel padding 24, two-line Menu item 52 tall only when hovered.

## Risks

- **Shared rules move other boards.** The full design check passes for every `blocking` screen.

## Proof

| Acceptance check                 | Proven by                                |
| -------------------------------- | ---------------------------------------- |
| Three entries `blocking`         | `screens.json`; `screens.test.ts` passes |
| Each ≤ 0.5%, other blocking pass | `npm run e2e` output; PR score table     |
| Tests, e2e, validator, 100%      | Output in the PR                         |

## Out of scope

Other boards (DM.13.3 to DM.13.7).
