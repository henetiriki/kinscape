# Plan: DM.13.4: Feedback and Map style boards at 0.5%

- **Spec:** #225 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

On `main` (`562d465`) the scores are: `style-5-feedback` 7.46%, `style-5-feedback-phone` 12.69%, `map-style` 8.80%, `map-style-phone` 16.47%. I fix each with `/match-design`, then set all four to `blocking`.

Differences come from the snapshot HTML: spacing and type, the phone date sheet and "date sheet" wording, the alert role label on the title line, `Toast` sizes, and the Map style rows and previews.

## Decisions

**D1 · Date field message text** · Decides: Tech lead

`DateField` draws messages as `Text` small (13/20) and the fix as a 500 `TextLink`. The snapshots draw messages at 13.5/1.4 and the fix at 600, 13.5 (desktop) or 15 and 44 tall (phone). The taller lines push everything below down.

- **A.** Messages use `Alert`'s 13.5/1.4; the fix as the snapshots draw it.
- **B.** Keep the tokens. If either Feedback screen stays above 0.5%, it stays `report` and goes to the PO as a design change.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The phone date sheet** · Decides: Tech lead

On phones the snapshot replaces the dock sample with a date sheet: a grabber, the step buttons, the field and a round Play button. Its callout reads "The map still shows 1901-02-28." with the fix link, not "Press Esc".

- **A.** Draw the sheet on phones, Play as the Inputs board's `Button`. On phones `DateField`'s `above` callout offers the fix, not the Esc hint.
- **B.** Draw the sheet but keep the Esc hint, and that difference.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Form field size** · Decides: Tech lead

Both snapshots draw the two Email fields 48 tall with 16px text. `TextField` is 44 with 15px text (DM.13.2 D1).

- **A.** Pass `size='l'` (48px, 16px) to the board's two fields.
- **B.** Leave them at 44, as D1 B says.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                        | New / changed | What                                    |
| ------------------------------------------- | ------------- | --------------------------------------- |
| `app/design-kit/feedback/*`                 | Changed       | Above; D2 sheet sample; D3              |
| `app/components/DateField.{tsx,module.css}` | Changed       | D1, D2                                  |
| `app/components/Toast.module.css`           | Changed       | Phone gap, padding, action              |
| `app/design-kit/map-style/*`                | Changed       | Above                                   |
| `app/**/__tests__/*`                        | Changed       | Phone wording, D2 callout, preview tint |
| `design/screens.json`                       | Changed       | Four entries `blocking`                 |

## Order of work

1. Map style desktop, then phone.
2. Feedback desktop with D1 and D3, then phone with D2 and `Toast`.
3. Full `npm run design:check`, recording every score.
4. Flip the four to `blocking`; lint, typecheck, test, validator, e2e.

## Risks

- **`Toast` and `DateField` are shared.** The Surfaces and Map furniture boards draw toasts (`report`); the full check lists their scores.
- **Size:** about 300 lines.

## Proof

| Acceptance check                 | Proven by                                |
| -------------------------------- | ---------------------------------------- |
| Four entries `blocking`          | `screens.json`; `screens.test.ts` passes |
| Each ≤ 0.5%, other blocking pass | `npm run e2e` output; PR score table     |
| Tests, e2e, validator, 100%      | Output in the PR                         |

## Deviations

- The snapshots and tokens were regenerated before the build, so the Approach lists are superseded; D1's text sizes already matched (13/20).
- Also changed: `Alert` (`aside` prop for the role label), `TextField` (`date='fill'`), `DateField` (`fill`, phone fix link, `--callout-lift`), `Toast` (15px, 12 gap; 50 tall with border).
- The map-style previews are rebuilt as token-coloured gradients to match the new snapshots.

## Out of scope

The other boards (DM.13.5 to DM.13.7); the map's own date sheet; tokens for literal sizes.
