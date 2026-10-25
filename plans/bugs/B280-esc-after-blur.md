# Plan: B280: Esc does nothing after Tab leaves a field with an invalid Map date

- **Spec:** #280
- **Requirement IDs:** MAP-03, NFR-06
- **Status:** draft

## Approach

`DateField` handles Esc only in the input's `onKeyDown`, so it stops working once focus leaves. While a problem found by a check is showing, `DateField` also listens for `keydown` on `document` (a `useEffect`, as `TextField` does for its shortcut) and on Esc restores the last good date as the input's handler does. The listener is removed when the problem clears. A problem from `defaultText` on the design-kit boards doesn't add it, so one Esc there doesn't wipe every sample. D1 and D2 set where the listener answers.

## Decisions

**D1 · Where Esc restores the date once focus has left the field** · Decides: Tech lead

- **A.** Anywhere on the page: a `document` listener.
- **B.** Only inside the field's row (the step buttons and the fix): an `onKeyDown` on the field's wrapper. Esc after clicking the map does nothing.
- **Other:** your own.

Recommended: A, because the bug and `DESIGN.md` (Map date field, rule 5) expect Esc to work whether or not the field has focus.

**D2 · An Esc another control also uses** · Decides: Tech lead

The Sources dialog (native `<dialog>`) and the Popup close on Esc without `preventDefault`; the Menu and a non-empty search box call it.

- **A.** Skip only an Esc already taken (`defaultPrevented`). Esc in the Sources dialog closes it and restores the date.
- **B.** Also skip an Esc from inside a `dialog`, `[role=dialog]` or another text box. One Esc does one thing, as the Menu's comment asks ("innermost first").
- **Other:** your own.

Recommended: B, because it keeps the Menu's rule without changing the other overlays.

## Files that change

| File                                                | New / changed | What                                                           |
| --------------------------------------------------- | ------------- | -------------------------------------------------------------- |
| `app/components/forms/DateField.tsx`                | Changed       | `document` Esc listener while a checked problem shows; comment |
| `app/components/forms/__tests__/DateField.test.tsx` | Changed       | Esc after blur; skipped cases (D2); `defaultText` untouched    |
| `e2e/date-dock.spec.ts`                             | Changed       | Type 1650, Tab, Esc on the map page                            |

## Order of work

1. Commit this plan: `plan(B280): approved by @<tech-lead>`.
2. Failing unit test and e2e test, then the listener.
3. Lint, format, tests, boundary validator, `npm run words`, `npm run e2e`.

## Risks

- Two fields with checked problems on one page (design kit only) both restore on one Esc. The map page has one field.
- Esc in the field fires its own handler and the listener; both set the same state, so the second does nothing.

## Proof

| Acceptance check                                                | Proven by                                 |
| --------------------------------------------------------------- | ----------------------------------------- |
| After Tab, Esc restores the last good date and clears the error | `date-dock.spec.ts`; `DateField.test.tsx` |
| Esc still works in the field                                    | Existing unit and design-kit e2e tests    |
| Esc taken by another control leaves the error (D2)              | `DateField.test.tsx`                      |
| Lint, tests (100%), e2e pass                                    | Their output in the PR                    |
