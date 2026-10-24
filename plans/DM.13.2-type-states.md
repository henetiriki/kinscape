# Plan: DM.13.2: Type and States boards at 0.5%

- **Spec:** #223 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

The build starts once DM.13.1 (#229) is on `main`. On its head (`ec21b66`) the scores are: `style-1-type` 1.43%, `style-1-type-phone` 9.60%, `style-4-states` 0.62%, `style-4-states-phone` 8.70%. I fix each with `/match-design`, then set all four to `blocking`.

Differences, from the snapshot HTML:

- **Every phone board** (`kit.module.css`): title tracking −0.015em; lede 15/22 (all 11 phone snapshots); notes list 14/20, gap 8, `h2` line 28.
- **Type, desktop:** header max-width 780; notes gap 32, section gap 14; Overline sample ink-3, Mono sample ink-2.
- **Type, phone:** spec line 16, ligatures off; name and hint lines 20 and 18; H1 spec ends "(28 on phone)"; Water chip padding 4/8, radius 4; note 13/20.
- **Type, both:** the snapshots set the polity label at 12.5. The token is 12, so both snapshots are refreshed (sweep rule).
- **States, phone:** state rows with an 88px overline label column, gap 12, 52px tall; "Focus", not "Focus (keyboard)"; name 15/22 with 4px below; padding 32/16/48.
- **States, both:** field text (D1); spaces around inline code (D2).

## Decisions

**D1 · Field text size** · Decides: Tech lead

`TextField` draws 16px text everywhere. The States board's rule says "Field text 15px, 16px on phones", and so do the Inputs snapshots. Both States snapshots show 15px.

- **A.** `TextField`: 15px (`--type-body-size`), 16px on phones. The States phone snapshot's 15px fields stay a difference; if they keep that screen above 0.5%, the PO gets it as a design change.
- **B.** Leave `TextField` alone. Desktop States keeps five fields' worth of difference, and DM.13.5 meets the same question.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Spaces around inline code** · Decides: Tech lead

The States snapshots render "( :focus-visible )" and "through `aria-pressed` or `checked` ." because of line breaks in the HTML. The app renders the text without them.

- **A.** Keep the app's text. If a screen stays above 0.5% because of it, the PO gets it as a design change.
- **B.** Add the spaces in the app to match.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                          | New / changed | What                                                       |
| --------------------------------------------- | ------------- | ---------------------------------------------------------- |
| `app/design-kit/kit.module.css`               | Changed       | Phone title, lede and notes                                |
| `app/design-kit/type/page.{tsx,module.css}`   | Changed       | Above; phone-only "(28 on phone)"                          |
| `app/design-kit/states/page.{tsx,module.css}` | Changed       | Phone rows and labels; short "Focus" label                 |
| `app/components/TextField.module.css`         | Changed       | D1 A only                                                  |
| `app/design-kit/*/__tests__/page.test.tsx`    | Changed       | Phone label and H1 note                                    |
| `design/source/style-1-type{,-phone}.html`    | Changed       | Polity 12.5 → 12; JPGs from the **Design agent shots** run |
| `design/screens.json`                         | Changed       | Four entries `blocking`                                    |

## Order of work

1. Rebase on `main` with #229.
2. Shared phone rules; full `npm run design:check`, recording every score.
3. Type desktop and phone, with the snapshot refresh.
4. States desktop and phone, and D1.
5. Flip the four to `blocking`; lint, typecheck, test, validator, e2e.

## Risks

- **Shared phone rules move nine other phone boards** (`report`; the PR lists their scores). `design-kit-menu-phone` (`blocking`) shows the Type board behind its sheet, so the full check catches a shift.
- **D1 A makes every desktop field 15px**, Inputs boards included.

## Proof

| Acceptance check                 | Proven by                                |
| -------------------------------- | ---------------------------------------- |
| Four entries `blocking`          | `screens.json`; `screens.test.ts` passes |
| Each ≤ 0.5%, other blocking pass | `npm run e2e` output; PR score table     |
| Tests, e2e, validator, 100%      | Output in the PR                         |

## Deviations

- Only the two Type entries are `blocking`. States stay `report` at 0.52% (desktop) and 0.63% (phone): the rest is `Button` (snapshots 15px text and 18px side padding, app 14px and 16px). Changing `Button` alone brings both under 0.5% (0.26%, 0.39%) but restyles every button in the app; the tech lead decides.

## Out of scope

The other boards' differences (DM.13.3 to DM.13.7); tokens for literal sizes such as 13.5 and 14.5.
