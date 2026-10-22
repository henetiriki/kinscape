# Plan: DM.12.2: Type, States and Feedback boards on a phone

- **Spec:** #153 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

CSS only, plus one span per States cell. Each board's module gets one block under the kit bar's query, `(max-width: 639.98px), (max-height: 499.98px)` (#104 D1): padding `var(--space-24) var(--size-gutter-phone)`, no `min-height`, every grid one column. Desktop rules are untouched.

- **Type:** the heading row hides; name and use share a line above the font line and sample.
- **States:** the heading row hides; each cell gets its state label, shown only on a phone, at left of the control.
- **Feedback:** the dock wraps Year / Month / Day under the field.

## Decisions

**D1 · Copy the phone snapshots change** · Decides: PO
The snapshots change seven lines: "(28 on phone)" on H1; "Focus" for "Focus (keyboard)"; "In the date sheet" for "In the dock" in a heading, the lede and Behaviour 8; "above the date sheet"; "Under the search bar" for "Top centre". The dock example is drawn as the phone date sheet.

- **A.** Keep the desktop copy and dock; list these as differences. The Spec's "In the date sheet" example becomes "In the dock".
- **B.** Phone copy and a drawn date sheet on a phone: each line rendered twice, one hidden per width, about 80 more lines, and a sheet look before M1.5.3 (#104) builds it.
- **Other:** your own.

**Answer: A** (@henetiriki).

**D2 · Where the shared phone rules live** · Decides: Tech lead
The 28px title and one-column notes change classes in `kit.module.css` that every board uses.

- **A.** Put them there; Colour, Foundations and Map style get them on a phone ahead of DM.12.3.
- **B.** Override them in the three boards' modules; DM.12.3 moves them.
- **Other:** your own.

**Answer: A** (@henetiriki).

Recommended: A, because the rule is said once and DM.12.3 needs it.

**D3 · The Link's hit area** · Decides: PO
`TextLink` has no 44px hit area, so the Link row fails "any control … at least 44 × 44px".

- **A.** Exempt in-text links (WCAG 2.5.8's inline exception); the check reads "any control except the Link".
- **B.** Give `TextLink` a 44px-tall hit area everywhere.
- **Other:** your own.

**Answer: A** (@henetiriki).

Recommended: A, because in a paragraph a taller hit area catches taps meant for the lines around it.

## Files that change

| File                                                | New / changed | What                                   |
| --------------------------------------------------- | ------------- | -------------------------------------- |
| `app/design-kit/kit.module.css`                     | Changed       | Phone title and notes (D2 A)           |
| `app/design-kit/type/page.module.css`               | Changed       | Phone block                            |
| `app/design-kit/states/page.tsx`, `page.module.css` | Changed       | State label per cell; phone block      |
| `app/design-kit/states/__tests__/page.test.tsx`     | Changed       | Each row has the five labels           |
| `app/design-kit/feedback/page.module.css`           | Changed       | Phone block                            |
| `e2e/design-kit.spec.ts`                            | Changed       | Phone tests at 390 × 844 and 800 × 450 |
| `design/screens.json`                               | Changed       | Three phone entries, `report`          |

## Order of work

1. `kit.module.css`; Type, States and its test, Feedback.
2. e2e and `screens.json`.
3. Lint, format, words, tests, validator, e2e, design check, build.

## Risks

- The query is copied into four modules (sharing it needs a PostCSS plugin).
- If the 330px callout crosses a gutter, the sea padding shrinks on a phone.

## Proof

| Acceptance check                 | Proven by                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------- |
| No sideways scroll at 390        | e2e per board at both sizes: `scrollWidth` equals `clientWidth`                  |
| One column inside 16px gutters   | e2e: every box in `main`, callout included, lies in 16–374; rows share one x     |
| 44px hit areas on States         | e2e at 390: `hitsControl` on each live control (D3)                              |
| 1440 unchanged                   | Design check scores for the three desktop entries match `main`; desktop e2e pass |
| Phone entries in `report`        | `screens.json` diff; design check output in the PR                               |
| Tests, e2e, build, 100% coverage | Their output in the PR                                                           |

## Flagged concerns

- No phone project is needed: the design check sets each entry's viewport (`e2e/design-check.spec.ts:76`).
- 640–1279px wide keeps the desktop layout (#104 D1).
