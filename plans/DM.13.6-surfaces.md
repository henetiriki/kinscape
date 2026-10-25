# Plan: DM.13.6: Surfaces board at 0.5%

- **Spec:** #227 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

I fix each screen with `/match-design`, then set all three to `blocking`. The plan run had no Playwright browser, so the differences below come from the snapshot HTML.

Most are in the layout board 07 shares with board 06 (`inputs/page.module.css`, `inputs/Board.tsx`). The Inputs snapshots draw the same rules (D1):

- **Desktop:** page gap 48; header max-width 860; Measurements name column 150; a `no token` cell italic ink-3.
- **Phone:** page gap 40, padding 32/16/48; header note 13/20; section gap 20, intro gap 4; H2 22/28; lede 14/20; variants gap 20; caption 12.5/18, 8 below its sample.
- **Phone Measurements:** "**Name** · value" at 13/20, the token under it; padding 8, gap 4; `role="table"` stays. Accessibility: a 72px term beside its text.
- **Phone matrix:** a name (15/22) over its state cells, which wrap 16 apart, each under its overline label.

Board 07 only:

- **Progress bar:** label above the bar (mono 12/16, ink-3); bars 320 wide, 16 apart.
- **Hit areas:** a column, gap 12: the 36px Close (surface-2) and Copy chain, each beside a dashed pill "44 × 44 hit area (proposed)" (12.5/18, radius 4), not inside a dashed box.
- **Large Notice card:** brand icon, not pin.

## Decisions

**D1 · The layout shared with board 06** · Decides: Tech lead

DM.13.5 (#226) needs the same shared fixes.

- **A.** Build this slice after DM.13.5 merges, rebased on it; fix only what is left.
- **B.** Whichever slice builds first fixes the shared layout; the other rebases.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Button S and XS text** · Decides: Tech lead

DM.13.2 gave every Button 15px text and 18px padding. Boards 06 and 07 draw every 40 and 36 button at 14/20, padding 16 (S) or 12 (XS), as `type.button-s` says.

- **A.** S and XS use `type.button-s`; S padding 16. M keeps 15/18.
- **B.** Leave Button. The Notice card and Copy chain buttons stay different.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Header note and part link wording** · Decides: Tech lead

The snapshots say 'A tap target under 44 is marked "44 × 44 hit area (proposed)".' and "Part 2: phone sheet headers, the menu, the popup and the callout". The app says "keeps a 44 × 44 hit area" and "menu, popup, callout".

- **A.** Use the snapshot's words on board 07, which still draws the "(proposed)" pills.
- **B.** Keep the app's words; any difference left goes to the PO.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                              | New / changed | What                                |
| ------------------------------------------------- | ------------- | ----------------------------------- |
| `app/design-kit/inputs/page.module.css`           | Changed       | Shared layout (D1)                  |
| `app/design-kit/inputs/Board.tsx`                 | Changed       | `no token` cell; phone matrix label |
| `app/design-kit/surfaces/page.{tsx,module.css}`   | Changed       | Header, progress bars, hit areas    |
| `app/design-kit/surfaces/sections.tsx`            | Changed       | Progress bar and hit-area markup    |
| `app/components/NoticeCard.module.css`            | Changed       | Large icon colour                   |
| `app/components/Button.module.css`                | Changed       | D2 A only                           |
| `app/design-kit/surfaces/__tests__/page.test.tsx` | Changed       | Part link name (D3 A)               |
| `design/screens.json`                             | Changed       | Three entries `blocking`            |

## Order of work

1. Rebase on `main` (D1); full `npm run design:check`, recording every score.
2. Shared layout, if D1 leaves it here.
3. Board 07 samples, D2, D3.
4. Flip the three to `blocking`; lint, typecheck, test, validator, e2e.

## Risks

- **Shared rules and Button move other boards.** The States boards (`blocking`) draw S buttons; the full check catches a shift, and the PR lists every score.

## Proof

| Acceptance check                 | Proven by                                |
| -------------------------------- | ---------------------------------------- |
| Three entries `blocking`         | `screens.json`; `screens.test.ts` passes |
| Each ≤ 0.5%, other blocking pass | `npm run e2e` output; PR score table     |
| Tests, e2e, validator, 100%      | Output in the PR                         |

## Out of scope

Other boards (DM.13.3 to DM.13.7).
