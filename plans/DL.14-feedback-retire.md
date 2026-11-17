# Plan: DL.14: /design-kit/feedback goes

- **Spec:** #915
- **Requirement IDs:** None. The Spec deletes a hidden dev page.
- **Status:** approved

## Approach

The board retires by the retirement steps of DL.11, as `plans/DL.11-inputs-retire.md` did for `/design-kit/inputs`. The folder `app/design-kit/feedback/` goes whole, with `DateCase.tsx` and its tests. No other file imports from it. The two `design/screens.json` entries go, and `NO_ENTRY` in `screens.test.ts` gains their names.

In `e2e/design-kit.spec.ts`, the "Feedback" entry of `BOARD_LINKS` has `gone: true`. The index and nav tests then skip its page, but they still expect its link. The four tests of "the map date field" go, and the two phone loops keep only `type`. `Locator` then has no use, so its import goes.

The test "a board that is gone gives a 404" of DL.11 and DL.13 loops over each board of `BOARD_LINKS` with `gone`, so it covers `/design-kit/feedback`. The build adds no test for item 6 (see Deviations).

## Files that change

| File                                   | New / changed | What                                                                              |
| -------------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| `app/design-kit/feedback/`             | deleted       | `page.tsx`, `DateCase.tsx`, `page.module.css`, `__tests__/page.test.tsx` (item 1) |
| `design/screens.json`                  | changed       | Delete `style-5-feedback` and `style-5-feedback-phone` (item 2)                   |
| `lib/design/__tests__/screens.test.ts` | changed       | `NO_ENTRY` gains the two names, in sort order (item 4)                            |
| `e2e/design-kit.spec.ts`               | changed       | The four date field tests and `Locator` go; the phone loops keep `type` (item 5)  |

## Order of work

1. Run `git rm -r app/design-kit/feedback`.
2. Delete the two entries of `design/screens.json`. Add the two names to `NO_ENTRY`.
3. Change `e2e/design-kit.spec.ts`. Change the phone `describe` comment to "the Type board".
4. Run `git grep -n design-kit/feedback -- app e2e lib design/screens.json`. Expect only `KitNav.test.tsx`, `KitMenu.test.tsx` and `e2e/design-kit.spec.ts`.
5. Run `npm run design:check` and the checks in `AGENTS.md`. Push.

## Risks

- A test that opens `/design-kit/feedback` and is not in item 5 stops the build (Spec concern). On `main` on 2026-11-17, the four date field tests and the phone loops are the only ones.

## Proof

| Acceptance check | Proven by                                                                      |
| ---------------- | ------------------------------------------------------------------------------ |
| 1                | The `git grep` of step 4, pasted in the PR                                     |
| 2                | The test "a board that is gone gives a 404" in `e2e/design-kit.spec.ts`        |
| 3                | `npm run design:check`                                                         |
| 4                | `git diff main --stat -- design/canvas design/source 'design/*.jpg'` in the PR |
| 5                | The check output in the PR                                                     |

## Out of scope

- The `SG-*` boards, their snapshots, JPGs and `design/DESIGN.md` rows, the two `NO_ENTRY` names, and the `DESIGN.md` sentence that names the route: DL.21 (#929).

## Deviations

- Spec item 6 says one new 404 test. DL.13 (#954) merged first. The test "a board that is gone gives a 404" now covers `/design-kit/feedback`, so the build adds no test. The route stays as plain text in `BOARD_LINKS`.
