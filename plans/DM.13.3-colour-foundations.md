# Plan: DM.13.3: Colour and Foundations boards at 0.5%

- **Spec:** #224 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** draft

## Approach

On `main` (`562d465`) the scores are: `style-2-colour` 1.14%, `style-2-colour-phone` 24.72%, `style-3-foundations` 6.67%, `style-3-foundations-phone` 13.12%. I fix each with `/match-design`, then set all four to `blocking`.

Differences, from the snapshot HTML:

- **Colour, both:** the `--surface` and `--white` chips have a 1px `--line` bottom border; it moves everything from Focus down by 1px.
- **Colour, phone:** board gap 32; section gap 12; heading stacked with gap 4, `h2` line 28, note 13/20; swatch gap 12; swatch text padding 8/12/12, gap 4; name 12/20, no wrap; value line 16; use line 18; system tones gap 16, each tone gap 8, lines 12/16; footer 13/20.
- **Foundations, desktop:** the Elevation heading sits inside the Corner radius section, 18px down; the Icons note uses the snapshot's wording, with `aria-hidden` in code; text sizes (D1).
- **Foundations, phone:** board gap 32; section gap 12; spacing rows gap 12, the bar with its use stacked under it (gap 4), aligned to the top; radii gap 16/12; Elevation a column, gap 16, padding 20, card gap 4; icon tiles gap 4; motion rows stacked, gap 4, padding 12/0, 13/20; text sizes (D1).

## Decisions

**D1 · Foundations text sizes** · Decides: Tech lead

The board draws its text with `Text` variants (small 13/20, caption 12.5/18, mono 12/16, label 14/20). Both snapshots use sizes no type token has: notes 13.5, mono values 12.5, shadow values 11, motion titles 13.5/600, icon labels 12.

- **A.** Draw these with page classes at the snapshot's sizes, as the Colour board already does. The type tokens don't change.
- **B.** Keep `Text`; the tokens win. Both Foundations screens stay `report` until the Design agent re-exports them with token sizes, and the first two acceptance checks drop them.
- **Other:** your own.

Recommended: A, because these sizes are board layout, like DM.13.2's literal 13.5 and 14.5; "the token wins" is for a value the board shows, such as the polity label.

**D2 · Alerts on the Colour board** · Decides: Tech lead

`Alert` matches the Feedback board (gap 12, padding 12/14, text 13.5). The Colour snapshots draw it differently: desktop gap 10, text 13; phone padding 12/16, title and text line 20.

- **A.** Leave `Alert` alone. If either Colour screen stays above 0.5% because of it, it stays `report` and goes to the PO as a design change.
- **B.** The Colour board passes a class that restyles its four alerts to match.
- **Other:** your own.

Recommended: A, because one component should look the same on every board; I estimate the alerts at about 0.15% (desktop) and 0.35% (phone).

## Files that change

| File                                               | New / changed | What                                     |
| -------------------------------------------------- | ------------- | ---------------------------------------- |
| `app/design-kit/colour/page.{tsx,module.css}`      | Changed       | Chip border; phone layout                |
| `app/design-kit/colour/swatches.ts`                | Changed       | Mark the two white chips                 |
| `app/design-kit/foundations/page.{tsx,module.css}` | Changed       | Elevation heading, Icons note, phone, D1 |
| `app/design-kit/*/__tests__/*.test.tsx`            | Changed       | Icons note, chip border                  |
| `design/screens.json`                              | Changed       | Four entries `blocking`                  |

## Order of work

1. Colour: chip border, then phone layout.
2. Foundations desktop, then phone, with D1.
3. Full `npm run design:check`, recording every score.
4. Flip the four to `blocking`; lint, typecheck, test, validator, e2e.

## Risks

- **Kit-only change.** No shared component changes under D1 A and D2 A, so no other board should move; the full check confirms it.
- **Elevation moves inside Corner radius.** It keeps its own `Elevation` region, which the e2e test finds.
- **Size:** about 250 lines.

## Proof

| Acceptance check                 | Proven by                                |
| -------------------------------- | ---------------------------------------- |
| Four entries `blocking`          | `screens.json`; `screens.test.ts` passes |
| Each ≤ 0.5%, other blocking pass | `npm run e2e` output; PR score table     |
| Tests, e2e, validator, 100%      | Output in the PR                         |

## Out of scope

The other boards (DM.13.4 to DM.13.7); `Alert` (DM.13.4); tokens for literal sizes.
