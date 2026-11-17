# Plan: DL.14: /design-kit/feedback goes

- **Spec:** #915
- **Requirement IDs:** None. The Spec deletes a hidden dev page.
- **Status:** approved

## Approach

The board retires by the retirement steps of DL.11, as `plans/DL.11-inputs-retire.md` did for `/design-kit/inputs`. The folder `app/design-kit/feedback/` goes whole, with `DateCase.tsx` and its tests. No other file imports from it. The two `design/screens.json` entries go, and `NO_ENTRY` in `screens.test.ts` gains their names.

In `e2e/design-kit.spec.ts`, the "Feedback" entry of `BOARD_LINKS` gets `gone: true`. The index and nav tests then skip its page, but they still expect its link. The four tests of "the map date field" go, and the two phone loops lose `feedback`. `Locator` then has no use, so its import goes.

The test "a board that is gone gives a 404" becomes a loop over a literal list: `['/design-kit/inputs', '/design-kit/feedback']`. Each route is plain text, and each gets its own test (Spec item 6). DL.13 and the next retirements add their route to the same list.

## Files that change

| File                                   | New / changed | What                                                                                                                |
| -------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `app/design-kit/feedback/`             | deleted       | `page.tsx`, `DateCase.tsx`, `page.module.css`, `__tests__/page.test.tsx` (item 1)                                   |
| `design/screens.json`                  | changed       | Delete `style-5-feedback` and `style-5-feedback-phone` (item 2)                                                     |
| `lib/design/__tests__/screens.test.ts` | changed       | `NO_ENTRY` gains the two names, in sort order (item 4)                                                              |
| `e2e/design-kit.spec.ts`               | changed       | `gone` flag; the four date field tests and `Locator` go; the phone loops lose `feedback`; the 404 loop (items 5, 6) |

## Order of work

1. Run `git rm -r app/design-kit/feedback`.
2. Delete the two entries of `design/screens.json`. Add the two names to `NO_ENTRY`.
3. Change `e2e/design-kit.spec.ts`. Change the phone `describe` comment to "the Type and States boards".
4. Run `git grep -n design-kit/feedback -- app e2e lib design/screens.json`. Expect only `KitNav.test.tsx`, `KitMenu.test.tsx` and `e2e/design-kit.spec.ts`.
5. Run `npm run design:check` and the checks in `AGENTS.md`. Push.

## Risks

- #914 (DL.13) changes the same lines of `e2e/design-kit.spec.ts` and `NO_ENTRY`. The second PR to merge rebases and keeps both changes.
- A test that opens `/design-kit/feedback` and is not in item 5 stops the build (Spec concern). On `main` on 2026-11-17, the four date field tests and the phone loops are the only ones.

## Proof

| Acceptance check | Proven by                                                                      |
| ---------------- | ------------------------------------------------------------------------------ |
| 1                | The `git grep` of step 4, pasted in the PR                                     |
| 2                | The `/design-kit/feedback gives a 404` test in `e2e/design-kit.spec.ts`        |
| 3                | `npm run design:check`                                                         |
| 4                | `git diff main --stat -- design/canvas design/source 'design/*.jpg'` in the PR |
| 5                | The check output in the PR                                                     |

## Out of scope

- The `SG-*` boards, their snapshots, JPGs and `design/DESIGN.md` rows, the two `NO_ENTRY` names, and the `DESIGN.md` sentence that names the route: DL.21 (#929).
