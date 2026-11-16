# Plan: DL.2: Gallery proof: CI opens each component card from disk

- **Spec:** #895
- **Requirement IDs:** None. The Spec changes tooling only.
- **Status:** approved

## Approach

A new pure function `galleryHtml` in `lib/design/cards.mts` makes a gallery file from the text of one `preview.html`. It removes line 1 (the `@dsCard` comment). It puts five tags first in the `<head>`: React 18, ReactDOM 18, `../project/tokens.css`, `../project/components/bundle.css` and `../project/components/bundle.js`. `run` in `scripts/design-system.mts` writes `gallery/<Name>.html` for each card in `CARDS`. It also copies the React 18 and ReactDOM 18 development files from `node_modules/react-18/umd/` and `node_modules/react-dom-18/umd/` to `gallery/vendor/`. A copy keeps each gallery file correct for any `out` folder, also the temporary folders of the unit tests.

The gallery spec `e2e/design-gallery.spec.ts` runs from its own config, `e2e/gallery.config.ts`, which has no `webServer`. `npm run design:gallery` runs `node scripts/design-system.mts`, then that config, so a clean checkout passes check 5. The `chromium` project of `playwright.config.ts` ignores the gallery spec, because the `e2e` job writes no gallery.

## Decisions

**D1 · What a gallery file keeps from `preview.html`** · Decides: Tech lead

Behaviour 2 says that a gallery file loads "the body of the card's `preview.html`". Each `preview.html` on `main` also has a `<style>` in its `<head>`, which sets the layout of the cases (`lib/design/cards.mts`, `STYLE`). DL.3 (#896) takes its card images from the gallery files.

- **A.** Keep the whole preview after line 1: its `<head>` style and its `<body>`. The five tags go first in the `<head>`. A gallery file then lays the cases out as the design system does, and DL.3 images show that layout.
- **B.** Keep only the `<body>`. The cases show with no gap, padding or wrap, and DL.3 images show that layout.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What                                                                                                   |
| ----------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `lib/design/cards.mts`                    | Changed       | `galleryHtml(preview)`                                                                                 |
| `lib/design/__tests__/cards.test.ts`      | Changed       | Tests of `galleryHtml`: line 1 removed, five tags in order, preview style and body kept, no `http`     |
| `scripts/design-system.mts`               | Changed       | Writes `gallery/<Name>.html` and `gallery/vendor/`; the log line names both folders                    |
| `scripts/__tests__/design-system.test.ts` | Changed       | "all under project/" becomes "under project/ or gallery/"; new tests for the gallery files (check 1)   |
| `e2e/gallery.config.ts`                   | New           | Playwright config: `testMatch: 'design-gallery.spec.ts'`, Chromium, no `webServer`, no `baseURL`       |
| `e2e/design-gallery.spec.ts`              | New           | One test for each card and width (checks 2 to 4)                                                       |
| `playwright.config.ts`                    | Changed       | The `chromium` project ignores `design-gallery.spec.ts`                                                |
| `package.json`                            | Changed       | `design:gallery` script                                                                                |
| `.github/workflows/ci.yml`                | Changed       | The `design` job: step "Open the gallery files" runs `npm run design:gallery`, before the design check |
| `docs/glossary.md`                        | Changed       | The "Gallery" row loses "Planned (#893)"                                                               |
| `plans/DL.2-gallery-proof.md`             | New           | This plan                                                                                              |

The test "returns the files it wrote, all under project/ with relative paths" changes, because `run` now writes `gallery/` too ([failing-tests rule](README.md#failing-tests)).

## Order of work

1. Write the `galleryHtml` tests. See them fail on the missing behaviour. Then write `galleryHtml`.
2. Change the `design-system.test.ts` tests. See them fail. Then change `run`.
3. Add `e2e/gallery.config.ts`, the gallery spec, the `chromium` ignore and the `design:gallery` script. The spec does these steps for each card in `CARDS` at 1440px and at 390px wide:
   - Collect each `console` message of type `error`, each `pageerror` and each request URL that starts with `http:` or `https:`.
   - Open `.design-system/gallery/<Name>.html` by its file URL.
   - Expect a count of `figure.ks-case` equal to the count of the card's states.
   - Expect no error and no `http` request.
4. Run `npm run design:gallery` with no app server on port 3000.
5. Add the CI step. Edit the "Gallery" row.
6. Run `npm run design-system` on `main` and on the branch. Compare the file lists under `.design-system/project/`.
7. Run the checks in `AGENTS.md` › Commands. Paste the output in Evidence.

## Risks

- **A card does not mount from disk.** The Spec says: stop, and comment the card and the error on #893. Change no component.
- **Chromium blocks a font from a file URL.** That gives a console error. `e2e/design-export.spec.mts` already loads local fonts from a file URL, so this is not likely. If it occurs, stop and ask on the PR. A launch flag hides a difference from the artifact.
- **`git` in the `design` container.** `run` reads the HEAD commit. The `design:export` step runs in the same checkout, but it does not call `git`. If `git` fails there, the CI step shows it.

## Proof

| Acceptance check                                      | Proven by                                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1. One gallery file for each card; same project files | `design-system.test.ts`; the file lists of step 6 in Evidence                       |
| 2. One case for each card state                       | `design-gallery.spec.ts`: count of `figure.ks-case`                                 |
| 3. No console or page error at 1440px and 390px       | `design-gallery.spec.ts`                                                            |
| 4. No `http` or `https` request                       | `design-gallery.spec.ts`; `cards.test.ts`                                           |
| 5. Passes with no app server                          | `e2e/gallery.config.ts` has no `webServer`; the output of step 4 in Evidence        |
| 6. The `design` job runs the spec in its own step     | The `ci.yml` diff; the CI run of the PR                                             |
| 7. The "Gallery" row has no "Planned (#893)"          | `git grep -n "Planned (#893)" docs/glossary.md` in Evidence: three rows, no Gallery |
| 8. `npm test` passes with 100% coverage               | `npm test` output in Evidence                                                       |

## Out of scope

Each item of the Spec's "Out of scope / carried forward". A card's `width` (DL.5) does not change the width of a gallery file.
