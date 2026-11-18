# Plan: DL.21: The last design kit pages go, with the checks that name them

- **Spec:** #929
- **Requirement IDs:** [NFR-03](../docs/requirements.md#nfr-03), [NFR-05](../docs/requirements.md#nfr-05), [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

The build first moves the phone notice card test to `/people/new`, and then deletes `app/design-kit/` and the three e2e files. Each check that names `/design-kit` then names `/screens` only. The gate rule of `scripts/safety.mts` reads `isDevPage()` from `server/dev-pages.mts`, so it keeps `app/screens/` with no new list (Spec concern 1). No file outside the folder imports from it. Each module that the kit imports keeps another importer, so no export loses its wiring. No design system input changes, so the design system steps do not apply.

Check 1 also covers three files that Behaviour 6 does not name: the comments in `scripts/safety.mts` and `server/auth/current.mts`, and `scripts/__tests__/gate.test.ts`. The build changes only the words `/design-kit` there. A line that says "design kit" without a hyphen stays for DL.21.2 (#992, item 7), as the Spec's Out of scope says.

## Files that change

| File                                                                       | New / changed | What                                                                                         |
| -------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| `e2e/people.spec.ts`                                                       | changed       | The phone notice card test, in `phone, 390 × 844` (Behaviour 3)                              |
| `app/design-kit/`                                                          | deleted       | The whole folder, with its 8 test files (Behaviour 1)                                        |
| `e2e/design-kit.spec.ts`, `e2e/surfaces.spec.ts`, `e2e/menu-popup.spec.ts` | deleted       | Behaviour 2                                                                                  |
| `design/screens.json`                                                      | changed       | The nine entries go (Behaviour 4)                                                            |
| `lib/design/__tests__/screens.test.ts`                                     | changed       | `NO_ENTRY` gains the nine names, in sort order (Behaviour 4)                                 |
| `e2e/design-states.ts`                                                     | changed       | `kit-menu-open` goes (Behaviour 5)                                                           |
| `server/dev-pages.mts`                                                     | changed       | `DEV_PAGE` matches `/screens` and the paths under it only; its doc comment names `/screens`  |
| `scripts/check-production.mts`                                             | changed       | The 404 check asks for `/screens/add-pin`                                                    |
| `e2e/gate.spec.mts`                                                        | changed       | The loop runs on `/` and `/screens/add-pin`                                                  |
| `e2e/dev-pages.spec.mts`                                                   | changed       | The three `/design-kit` rows of `PAGES` go; the comment above names the `/screens` layout    |
| `scripts/layers.mts`                                                       | changed       | `DEV_ONLY`, `layerOf` and the top comment name `app/screens` only                            |
| `eslint.config.mjs`                                                        | changed       | The group `kit-style` and its half of the comment go                                         |
| `scripts/safety.mts`, `server/auth/current.mts`                            | changed       | The doc comment names `/screens` only (check 1)                                              |
| `server/__tests__/dev-pages.test.ts`                                       | changed       | The `/design-kit` and `/design-kits` paths go; `/screens/` joins "covers"                    |
| `scripts/__tests__/check-production.test.ts`                               | changed       | `/screens/add-pin` in `GOOD`, the 200 case and the expected calls                            |
| `scripts/__tests__/gate.test.ts`                                           | changed       | `app/screens/` paths in `routeOf` and `gateBreaks` cases (check 1)                           |
| `scripts/__tests__/layers.test.ts`                                         | changed       | The `app/design-kit` rows use `app/screens` paths                                            |
| `scripts/__tests__/layers-config.test.ts`                                  | changed       | "keeps stylesheets last" lints an `app/screens` page with one stylesheet; the kit order goes |
| `__tests__/proxy.test.ts`                                                  | changed       | `/screens` paths in the hidden, Preview and matcher cases                                    |
| `app/__tests__/MapHost.test.tsx`                                           | changed       | `/screens/add-pin` in place of `/design-kit`                                                 |

## Order of work

1. Add the test to `e2e/people.spec.ts`, with its three assertions on the card "Edit people on a computer" and the link "See all people". Run it on the code of `main`. It must pass before step 2.
2. Run `git rm -r app/design-kit e2e/design-kit.spec.ts e2e/surfaces.spec.ts e2e/menu-popup.spec.ts`.
3. Make the changes of Behaviour 4 and 5.
4. Change the checks and their comments, as the table says.
5. Change the unit tests, as the table says.
6. Run the search of check 1: `git grep -n -E "design-kit|KitNav|KitMenu|kit-style" -- app e2e features lib scripts server __tests__ eslint.config.mjs design/screens.json`. Paste the output in the PR.
7. Run `git diff main --stat` with the paths of check 7. Paste the empty output in the PR.
8. Start `npm run dev`, sign in as the fixture Account, and ask for `/design-kit`, `/design-kit/type` and `/design-kit/surfaces`. Paste the three 404 responses in the PR (check 2).
9. In the PR body, list each test that goes, in the three groups of Behaviour 8.
10. Run `npm run design:check` and each check in `AGENTS.md` › Commands.

## Risks

- **The link is not 44px tall.** Then step 1 fails. The build files a Bug, as the Spec says, and stops for the tech lead: check 5 cannot pass without a change to the component.
- **A missed reader.** `e2e/widths.spec.ts` and the design check read routes from `design/screens.json`, so step 3 removes the routes there. No doc links to a deleted file: the only links are to the JPGs, which stay.
- **Merge conflicts.** #958 (DL.22.2) and #959 (DL.22.3) move tests out of `e2e/people.spec.ts`. #964 (DL.26) edits `design/screens.json`. The PR that merges second resolves the conflict.

## Proof

| Acceptance check                                     | Proven by                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1. Only `NO_ENTRY` and `shots.mts` name the kit      | The `git grep` output of step 6 in the PR                                       |
| 2. The three routes give a 404                       | The responses of step 8 in the PR                                               |
| 3. `check-production` asks for `/screens/add-pin`    | `scripts/__tests__/check-production.test.ts`, with its 200 case                 |
| 4. `/screens/add-pin` is gated and hidden            | `e2e/gate.spec.mts` and `e2e/dev-pages.spec.mts`                                |
| 5. The moved test passes                             | `e2e/people.spec.ts` in `npm run e2e`                                           |
| 6. Each entry left passes; `NO_ENTRY` holds the nine | `npm run design:check`; `lib/design/__tests__/screens.test.ts`                  |
| 7. No canvas, source, JPG, token or doc change       | The `git diff --stat` output of step 7 in the PR                                |
| 8. The checks pass                                   | `npm test`, `npm run typecheck`, `npm run lint`, `npm run words`, `npm run e2e` |

## Out of scope

As the Spec says:

- The `kit` tokens, the doc rows and the "design kit" comments and test titles: DL.21.2 (#992).
- The `SG-*` and `Kit-*` boards, their files and records, and `PHONE_BOARD`: DL.21.3 (#993).

## Deviations

- Step 8 used `npm run build` and `next start` with `KINSCAPE_DEV_PAGES=1`, not `npm run dev`. Turbopack dev does not start in the sandbox of a local session.
- The `layerOf` row `['app/design-kit/page.tsx', undefined]` of `scripts/__tests__/layers.test.ts` goes. The `['app/screens/add-pin/page.tsx', undefined]` row covers the same case.
