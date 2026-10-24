# Plan: DM.13.3: Colour and Foundations boards at 0.5%

- **Spec:** #224 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** draft

## Approach

On `178a796` the scores are: `style-2-colour` 1.14%, `style-2-colour-phone` 24.72%, `style-3-foundations` 6.67%, `style-3-foundations-phone` 13.12%. I fix each with `/match-design`, then set all four to `blocking`.

Differences, from the snapshot HTML:

- **Colour, both:** the `--surface` and `--white` chips have a 1px `--line` bottom edge, like the focus ring chip.
- **Colour, phone:** stack gap 32, section gap 12; heading stacked with gap 4, note 13/20; swatch gap 12; swatch text padding 8/12/12, gap 4, name 12px, value line 16, use 12.5/18; system colours gap 16, each tone gap 8, lines 16; footer 13/20.
- **Foundations, desktop:** Elevation 18px lower (the snapshot puts it in the Corner radius section); text sizes per D2.
- **Foundations, phone:** stack and column gaps 32, section gap 12; spacing rows 12 apart, bar 12 tall with radius 4 over its caption (gap 4); radius grid gap 16/12, boxes 88×64 border-box; elevation stacked, gap 16, padding 20, card gap 4; icons gap 8, tile gap 4, label 12; motion rows padding 12, title and value on one line, gap 4; notes 13/20.
- **Foundations, both:** the Icons note takes the snapshot's newer copy ("Shown at 16, 18 or 20px (24 on the phone layers button). Always `aria-hidden`; …"), without the stray space before ";" (as DM.13.2 D2).

## Decisions

**D1 · Alerts on the Colour board** · Decides: Tech lead

The Colour snapshots draw their four alerts differently from the Feedback snapshots, which define `Alert`: min-height 64, body 13px, gap 10 (12 on phone), padding 12/14 (12/16 on phone). The app draws the Feedback alert.

- **A.** Keep `Alert` as Feedback defines it. If a Colour screen stays above 0.5% because of it, the PO gets it as a design change.
- **B.** Add a `className` to `Alert` and give the Colour board's four the snapshot's spacing.
- **Other:** your own.

Recommended: A, because the board should show the alert the app uses.

**D2 · Literal text sizes on Foundations** · Decides: Tech lead

The Foundations snapshots set the step and radius values in 12.5px mono, shadows in 11px mono and the desktop notes at 13.5px. The page draws them with `Text` variants (mono 12/16, small 13/20).

- **A.** Draw them with page classes at the snapshot sizes, as the Colour page does. Tokens don't change.
- **B.** Keep the `Text` variants and ask the Design agent to re-export both snapshots with token sizes. Until then both screens stay `report`, and the first acceptance check changes.
- **Other:** your own.

Recommended: A, because these are specimen sizes, not component tokens.

## Files that change

| File                                          | New / changed | What                                |
| --------------------------------------------- | ------------- | ----------------------------------- |
| `app/design-kit/colour/page.{tsx,module.css}` | Changed       | White chip edge; phone rules        |
| `app/design-kit/foundations/page.tsx`         | Changed       | Icons copy; D2 A classes            |
| `app/design-kit/foundations/page.module.css`  | Changed       | Elevation offset; phone rules; D2 A |
| `app/components/Alert.{tsx,module.css}`       | Changed       | D1 B only                           |
| `app/design-kit/*/__tests__/page.test.tsx`    | Changed       | Icons copy; edge class              |
| `design/screens.json`                         | Changed       | Four entries `blocking`             |

## Order of work

1. Colour chip edge, then the phone rules; record the scores.
2. Foundations desktop, then phone; record the scores.
3. D1 as answered.
4. Flip the four to `blocking`; lint, typecheck, test, validator, full e2e.

## Risks

- **Colour phone is the widest gap**, but most of it is spacing drift compounding down the board.
- **D1 B touches the shared `Alert`**, which can move the Feedback boards (DM.13.4).

## Proof

| Acceptance check                 | Proven by                                |
| -------------------------------- | ---------------------------------------- |
| Four entries `blocking`          | `screens.json`; `screens.test.ts` passes |
| Each ≤ 0.5%, other blocking pass | `npm run e2e` output; PR score table     |
| Tests, e2e, validator, 100%      | Output in the PR                         |

## Out of scope

Other boards (DM.13.4 to DM.13.7); `design/source` edits, which the Design agent owns.
