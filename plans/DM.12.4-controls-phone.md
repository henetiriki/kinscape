# Plan: DM.12.4: Controls on a phone

- **Spec:** #155 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

Phone rules go under `(max-width: 639.98px), (max-height: 499.98px)` (#104 D1); desktop is unchanged.

- **Text:** the text field is already 16px; the date field is 22px (D1).
- **Hover:** each of the 11 rules moves its `:hover` into `@media (hover: hover)` (D2). A test fails on a `:hover` outside it in `app/components/*.module.css`.
- **Hit areas:** chip, tab and segment `::before` become centred and `max(100%, 44px)` wide. Checkbox and icon button already meet 44 × 44.
- **Callout:** spans the field's row; the field draws the pointer (D4).
- **Toast and banner:** a `placed` prop sets `data-placed`, which on a phone fixes them inside the gutters at the mocks' offsets: banner `top: 80px`, toast `bottom: 164px` (D3). On a phone, with an action they are 60px tall and the action 44px.

## Decisions

**D1 · The date field's text on a phone** · Decides: PO
The phone mocks keep it at 22px; browsers only zoom below 16px.

- **A.** Keep 22px; the Spec's lines read "at least 16px".
- **B.** 16px; the design check lists the difference.

**Answer: A** (@henetiriki)

**D2 · The States board's forced hover on a touch screen** · Decides: Tech lead
`[data-state='hover']` shares each `:hover` rule.

- **A.** Split each rule; the forced state stays outside. About 70 more lines.
- **B.** Move whole rules; on a touch screen the board's Hover column looks like Rest.

**Answer: A** (@henetiriki)

**D3 · Desktop placement** · Decides: Tech lead

- **A.** `placed` sets only the phone position; a map Spec places them on desktop.
- **B.** `placed` also sets desktop's: banner top centre, toast above the dock.

**Answer: A** (@henetiriki)

**D4 · How the callout fits** · Decides: Tech lead

- **A.** CSS: it spans the step buttons and field; with Play beside them it stops short of the right gutter.
- **B.** JS measures the field and spans the gutters, as the mock does.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                              | New / changed | What                  |
| --------------------------------------------------------------------------------- | ------------- | --------------------- |
| `app/components/` Button, Checkbox, IconButton, TextField, TextLink `.module.css` | Changed       | Hover (D2)            |
| `app/components/` Chip, Tabs, Segmented `.module.css`                             | Changed       | Hover; hit areas      |
| `app/components/DateField.tsx`, `.module.css`, test                               | Changed       | Callout (D4)          |
| `app/components/Toast.tsx`, `Banner.tsx`, `.module.css`, tests                    | Changed       | `placed`; phone shape |
| `app/components/__tests__/hover.test.ts`                                          | New           | The `:hover` rule     |
| `e2e/design-kit.spec.ts`                                                          | Changed       | Phone and touch tests |

## Order of work

1. Hover and its test; hit areas, callout, toast and banner.
2. e2e; lint, format, words, tests, validator, design check, build.

## Risks

- Touch emulation must make `(hover: hover)` false; the e2e asserts it.
- A sheet that clips overflow would cut the callout; #104 must allow it.

## Proof

| Acceptance check            | Proven by                                                                   |
| --------------------------- | --------------------------------------------------------------------------- |
| 16px text                   | e2e at 390: focused fields' `font-size` (D1)                                |
| Callout fits                | e2e at 390: above the field, in 16–374, pointer over it; no sideways scroll |
| No tint after a tap         | e2e: a tap leaves each background unchanged; mouse hover changes it         |
| `:hover` rule test          | `hover.test.ts`, with a failing sample                                      |
| 44 × 44 hit areas           | e2e at 390: `elementFromPoint` 21px from each control's centre hits it      |
| Toast and banner placed     | e2e at 390: banner top 80, toast 164 from the bottom, both in 16–374        |
| Board at 390                | Design check scores for `style-5-feedback-phone` in the PR                  |
| Tests, e2e, build, coverage | Their output in the PR                                                      |

## Deviations

- The e2e tests are in a new `e2e/controls-phone.spec.ts`, not `design-kit.spec.ts`.
- The callout moves into the field's row, so it spans it on desktop too; the pointer is its own element on the field.
- The board's Toast and Banner stay unplaced; the e2e sets `data-placed` to measure the phone position.

## Flagged concerns

- The phone mocks' callout shows the fix link, not "Press Esc"; the board's heading is "In the date sheet". The Spec keeps the current copy.
