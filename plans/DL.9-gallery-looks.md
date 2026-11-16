# Plan: DL.9: Look tests on gallery files

- **Spec:** #910
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05), [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

A new spec, `e2e/gallery-looks.spec.ts`, holds the ten tests of the Spec table. Each test opens `.design-system/gallery/<Name>.html` by its file URL, as `e2e/design-gallery.spec.ts` does. Each test finds its control in one card state by `getByRole('figure', { name: '<state label>' })`, because the `figcaption` of each case names the figure. The `testMatch` of `e2e/gallery.config.ts` takes both specs, so `npm run design:gallery`, CI and the render workflow run both. The new spec compares no image, so it does not read `pinnedImage`.

The hit-area helper `hitsControl` moves to `e2e/hits.ts`. The new spec and `e2e/design-kit.spec.ts` import it, because "states labels each cell and keeps 44px hit areas" stays until DL.13.

The hashed-class test goes to `e2e/map-desktop.spec.ts` at 1440px. It reads these controls on `/`:

- Zoom in (`iconBtn`);
- a licence link in the Sources dialog (`textLink`);
- a Layers panel checkbox (`checkbox`);
- a Precision segment of the dock (`segItem`).

## Decisions

**D1 · Play is not on `/`** · Decides: Tech lead

`MapShell` passes no `onPlay`, so `/` has no Play. Which controls does the hashed-class test read?

- **A.** Four: IconButton, TextLink, Checkbox, Segmented. Check 5 of #910 says "four". **Answer: A** (Tech lead)
- ~~**B.** Wait until a Spec mounts Play.~~

Recommended: A, because B blocks DL.9.

## Files that change

| File                          | New / changed | What                                                                                                                                                                                                   |
| ----------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `e2e/gallery-looks.spec.ts`   | New           | The ten tests of the Spec table                                                                                                                                                                        |
| `e2e/hits.ts`                 | New           | `hitsControl(control, dx, dy)`                                                                                                                                                                         |
| `e2e/gallery.config.ts`       | Changed       | `testMatch` lists both specs; the comment names both                                                                                                                                                   |
| `playwright.config.ts`        | Changed       | The `chromium` project ignores `gallery-looks.spec.ts`; the comment names it                                                                                                                           |
| `e2e/map-desktop.spec.ts`     | Changed       | "the live controls carry hashed class names, not the plain ones" on `/`                                                                                                                                |
| `e2e/design-kit.spec.ts`      | Changed       | Loses eight tests: the five that move, the hashed-class test, "controls have names, and toggles report their state" and "the arrow keys move the choice in a Segmented control". Imports `hitsControl` |
| `e2e/controls-phone.spec.ts`  | Deleted       | Five tests move; the date callout test goes                                                                                                                                                            |
| `plans/DL.9-gallery-looks.md` | New           | This plan                                                                                                                                                                                              |

The [failing-tests rule](README.md#failing-tests) covers the moved and deleted tests (Behaviour items 3, 5, 6, 7).

## Order of work

1. Add `e2e/hits.ts`. Point `e2e/design-kit.spec.ts` at it.
2. Write `e2e/gallery-looks.spec.ts`. Each test sets its viewport, touch and reduced motion as the old test did. These card states hold the controls:

   | Test                    | Card states                                                                                                                  |
   | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
   | 16px text               | `TextField · focus`, `DateField · default` at 390px                                                                          |
   | 44 x 44px at 390px      | `Checkbox off · default`, `Chip · default`, `Segmented · default` (List), `Tabs · default` (Filters), `IconButton · default` |
   | Placed banner and toast | `Banner · offline`, `Toast · success` at 390 x 844px                                                                         |
   | Tap, hover              | `Button secondary · default` (Copy chain)                                                                                    |
   | Tab and the 2px ring    | Each case of the nine files of the Spec table, one file after the other                                                      |
   | 44px at 1440px          | As the 390px row, less `IconButton`                                                                                          |
   | White ring              | `Banner · offline` (Retry)                                                                                                   |
   | Toast rise              | `Toast · success`, with motion and with reduced motion                                                                       |

3. Add `gallery-looks.spec.ts` to `testMatch` and to the `chromium` `testIgnore`.
4. Run `npm run design:gallery` here (not the pinned image), with no app server. Paste the output: both specs run, and no look test is skipped.
5. Make `.checkbox::before` in `app/components/forms/Checkbox.module.css` cover only the box. Run `npm run design:gallery` and paste the failing line. Restore the file and paste the pass. Commit no CSS change.
6. Add the hashed-class test to `e2e/map-desktop.spec.ts`. Remove the eight tests from `e2e/design-kit.spec.ts`. Run `git rm` on `e2e/controls-phone.spec.ts`.
7. Run `git grep` for the fourteen titles under `e2e/` and for `controls-phone` outside `plans/`. Paste the output.
8. Run the checks in `AGENTS.md` › Commands. Paste the output.
9. In the PR body, give the reason for each of the three tests that go (Behaviour item 6). Give the time of the "Open the gallery files" step on `main` and on the branch.

## Risks

- **The Segmented card shares one radio group.** All five states pass `name: 'view'`, so the file has one group of radios. The Tab test counts one stop for each radio group. If the shared group still fails the test, follow the Spec: keep the test in `e2e/design-kit.spec.ts`, name it in the PR and comment on #893.
- **A probe lands on a neighbour.** A case puts its caption 8px above the control, so an old probe 21px above a small control can hit it. If one fails only for the gallery layout, follow the Spec as above.
- **The focused default `TextField` is under 16px at 390px.** The Spec makes that a finding: file a Bug, and keep the old test.
- **No TextLink is in the DOM of `/`.** The closed Sources dialog renders its licence links. If the list is empty, the test opens the dialog from the account menu first.
- **The gallery step takes longer.** Step 9 measures it.

## Proof

| Acceptance check                                     | Proven by                                               |
| ---------------------------------------------------- | ------------------------------------------------------- |
| 1. `design:gallery` runs both specs, no app server   | Output of step 4                                        |
| 2. Ten tests, only `file:` URLs                      | `e2e/gallery-looks.spec.ts`                             |
| 3. None skipped off the pinned image                 | Output of step 4                                        |
| 4. A broken hit area fails a test                    | Output of step 5                                        |
| 5. Hashed classes on `/`                             | `e2e/map-desktop.spec.ts` in `npm run e2e`              |
| 6. No moved title in a `/design-kit` spec            | `git grep` of step 7                                    |
| 7. `controls-phone.spec.ts` gone and unnamed         | `git grep` of step 7                                    |
| 8. The CI step runs the new spec; `ci.yml` unchanged | The CI log of the PR; `git diff main --stat -- .github` |
| 9. Unit, type, lint and e2e checks pass              | Output of step 8                                        |

## Out of scope

Each item of the Spec's "Out of scope / carried forward". The hashed-class test checks no Button, Chip or Tabs: no app route mounts one (#910 D3, plan D1).

## Deviations

- The Tab test expects the focus border of `TextField · error` (`rgb(180, 65, 47)`) and `TextField · warning` (`rgb(183, 121, 31)`), not the brand colour. The old test never met those states.
