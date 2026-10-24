# Plan: DM.13.5: Inputs board at 0.5%

- **Spec:** #226 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

On `562d465`: `style-6-components-inputs` 7.72%, `-phone` 12.71%, `-2-phone` 10.33%. Most of the gap is content: DM.12.5 reworded the board and drew other samples. I copy the snapshot's samples and words into `sections.tsx`, fix the layout with `/match-design`, then set the three to `blocking`.

Differences, from the snapshot HTML:

- **Samples:** a Google placeholder (D2); "Password, shown"; three Tabs samples on `--sea` (Layers, Filters, phone sheet header with Close); Checkbox Layer rows on, off and loading, and "Keep me signed in on this device"; one untitled error Alert; a rule above a footnote. Captions, matrix rows and facts take the snapshot's words (D1).
- **Components:** Button text (D3); Tabs badge 13.5/600.
- **Phone matrix:** a 15/22 name, then wrapping cells with an overline label ("Focus") above each control.
- **Phone layout:** gap 40, padding 32/16/48; `h2` 22/28; lead 14/20; caption 12.5/18. Part 2 shows only the sheet-header tabs and no key hint.

## Decisions

**D1 · Out-of-date board text** · Decides: Tech lead

The snapshot still calls the 44 hit areas and the 36 token "proposed", which DM.12.5 built, so the app reworded those lines. A different line moves everything below it.

- **A.** Copy the snapshot's words; the PO asks the Design agent to update the canvas.
- **B.** Keep the app's words; the three screens stay `report` until a re-export.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The Google placeholder** · Decides: Tech lead

Both part 1 snapshots draw a 50px "Continue with Google" box. `DESIGN.md` says the button needs an Intent first.

- **A.** Draw it in the kit only: an `aria-hidden` span with the dashed box and `--google-*` colours; no `Button` variant.
- **B.** Leave it out. Neither screen can reach 0.5%; the PO gets a design change.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Button text** · Decides: Tech lead

DM.13.2 gave every Button 15px text and 18px padding, as board 04 draws. Board 06, `DESIGN.md` and `type.button-s` say 14/20 with 16px padding; board 06 draws over 40 such buttons.

- **A.** M, S and XS take `type.button-s` and `space-16` (XS `space-12`). The States page keeps 15/18 through a page class, so it stays `blocking`; the PO gets board 04 as a design change.
- **B.** Keep 15/18 on M. Board 06's 44px buttons, about 20 on phone part 1, keep the difference; a screen above 0.5% stays `report`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Deviations

- **D3 A not applied.** Board 06 and `DESIGN.md` give M 15/22; only S and XS are 14/20, as built. Awaiting a new D3.

## Files that change

| File                                          | New / changed | What                 |
| --------------------------------------------- | ------------- | -------------------- |
| `app/design-kit/inputs/sections.tsx`          | Changed       | Samples and words    |
| `app/design-kit/inputs/{page,Board}.tsx`      | Changed       | Note; phone matrix   |
| `app/design-kit/inputs/page.module.css`       | Changed       | Phone layout, matrix |
| `app/components/{Button,Tabs}.module.css`     | Changed       | D3; badge            |
| `app/design-kit/states/page.{tsx,module.css}` | Changed       | D3 A only            |
| `app/design-kit/inputs/__tests__/*`           | Changed       | New samples          |
| `e2e/inputs.spec.ts`                          | Changed       | Sample names         |
| `design/screens.json`                         | Changed       | Three `blocking`     |

## Order of work

1. D3 and the badge; full `npm run design:check`, recording every score.
2. Part 1 content, then part 2; phone layout and matrix.
3. Flip the three to `blocking`; lint, typecheck, test, validator, e2e.

## Risks

- **Size:** about 600 changed lines. Past the cap, I stop and ask to split by phone part (rule 7).
- **D3 moves every board with a Button**; the full check shows it, and `blocking` boards catch a shift.

## Proof

| Acceptance check                 | Proven by                                |
| -------------------------------- | ---------------------------------------- |
| Three entries `blocking`         | `screens.json`; `screens.test.ts` passes |
| Each ≤ 0.5%, other blocking pass | `npm run e2e` output; PR score table     |
| Tests, e2e, validator, 100%      | Output in the PR                         |

## Out of scope

Other boards (DM.13.3, DM.13.4, DM.13.6, DM.13.7); a working Google button.
