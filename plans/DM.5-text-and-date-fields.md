# Plan: DM.5: Text field and map date field

- **Spec:** #116 (Intent #111)
- **Requirement IDs:** MAP-03, NFR-06
- **Status:** approved

## Approach

Pure `checkDate(text, min, max)` returns the first day and precision, or the message and fix. `DateField` checks on Enter or blur and calls `onChange(day, precision)`; Esc puts back `shownDate(day, precision)`. A problem stays until the next check. `TextField` takes `label`, `hideLabel`, `helper`, `error` and `state`. `Text` gains `tone` for message colours; a fix is a `<button>` composing `TextLink`'s class.

## Decisions

**D1 · Split the Spec** · Decides: Tech lead
The estimate is about 1,300 changed lines; the cap is 600.

- **A.** DM.5.1: `Icon`, `TextField`, `tone`, the states row. DM.5.2: `checkDate`, `DateField`. DM.5.3: the feedback board.
- **B.** Two: DM.5.1 as A; DM.5.2 the rest (~950 lines).
- **Other:** your own.

**Answer:** Other: keep this change in one Spec and PR.

**D2 · How the board holds each case** · Decides: Tech lead

- **A.** Each case is a live field: `defaultText` is checked on first render, except with `state='focus'` (Typing).
- **B.** Read-only pictures; only the dock example is live.
- **Other:** your own.

**Answer:** A.

**D3 · The message above the field** · Decides: Tech lead
The dock example adds a sentence and drops the fix.

- **A.** As drawn: the message bold, then "The map still shows {last good date}. Press Esc to go back to it."; no fix.
- **B.** The same message and fix as below.
- **Other:** your own.

**Answer:** A.

**D4 · The info note's 4 seconds** · Decides: Tech lead
A self-clearing note could vanish before the design check shoots.

- **A.** `DateField` shows a `notice` while it is passed; #103 clears it after 4 seconds, with the precision switch.
- **B.** `DateField` clears it; the design check fakes timers on this board.
- **Other:** your own.

**Answer:** A.

**D5 · Where the board's drawing differs** · Decides: Tech lead
Its form fields are 48px; its card step buttons 40px and `aria-hidden`.

- **A.** Card step buttons are `aria-hidden` boxes in the board's CSS; form fields are 44px and the check reports the difference.
- **B.** Real `IconButton`s in the cards.
- **C.** As A, plus an ignore region over Form fields until the sign-in Spec.

**Answer:** A.

## Files that change

| File                                                    | New / changed | What                                           |
| ------------------------------------------------------- | ------------- | ---------------------------------------------- |
| `lib/map/date-input.ts`, `__tests__/date-input.test.ts` | New           | `checkDate`; every case                        |
| `app/components/Icon.tsx`                               | New           | `error`, `warning`                             |
| `app/components/TextField.tsx`, `.module.css`, test     | New           | Five states, error, ARIA                       |
| `app/components/DateField.tsx`, `.module.css`, test     | New           | 188px, checks, Esc, fix, notice, placement     |
| `app/components/Text.tsx`, `.module.css`, test          | Changed       | `tone`                                         |
| `app/design-kit/feedback/page.tsx`, `.module.css`, test | New           | Header, eight cases, dock, Behaviour, Form     |
| `app/design-kit/feedback/DateCase.tsx`                  | New           | Client: holds a card's date                    |
| `app/design-kit/boards.ts`                              | Changed       | Feedback row, 05                               |
| `app/design-kit/states/page.tsx`, test                  | Changed       | Text field row                                 |
| `design/screens.json`                                   | Changed       | `style-5-feedback`; states row un-ignored      |
| `e2e/design-kit.spec.ts`                                | Changed       | Fields show the border; feedback typing        |
| `design/DESIGN.md`                                      | Changed       | Map date field built in `/design-kit/feedback` |

## Order of work

1. On `main`, run `npm run design:check` and keep the report.
2. `Icon`, `tone`, `TextField`, states row; tests.
3. `checkDate`, `DateField`; tests.
4. Feedback board, `boards.ts`, `screens.json`, e2e, `DESIGN.md`.
5. Lint, tests, validator, e2e, design check.

## Risks

- The ring test counts every input; fields assert the 2px border instead.

## Proof

| Acceptance check                    | Proven by                                                             |
| ----------------------------------- | --------------------------------------------------------------------- |
| 1901-02-30 keeps text, message, fix | `DateField` test; e2e types it on the Default card                    |
| 14/06/1901, 1650, after today       | `checkDate` and `DateField` tests                                     |
| 1901-6-4 is 1901-06-04              | `checkDate` test; e2e reads the field after Enter                     |
| Esc restores and clears             | `DateField` test; e2e                                                 |
| Design check                        | Report: Feedback differs only in Form fields (D5); states row matches |
| Parsing covered                     | `date-input.test.ts`, 100% coverage                                   |

## Flagged concerns

- The states row draws 15px text; `TextField` uses Body L, 16px.
