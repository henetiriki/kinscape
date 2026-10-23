# Plan: DM.13: Design sweep: every screen blocking at 0.5%

- **Spec:** #156 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** draft

## Approach

The Spec needs a split (D3) and a narrower scope (D1, D2). For each screen: run `/match-design`, fix the app (the token wins over the snapshot, #111 Q2 and Q8), and flip the screen to `blocking` once it's at 0.5% or under. Both sides render in the same Chromium, so any difference left is real layout drift.

## Differences found

`npm run design:check` on 22e8645:

| Board         | Desktop | Phone             |
| ------------- | ------: | ----------------- |
| Index         |   4.10% | 9.32%; menu 5.39% |
| Type          |   2.66% | 8.79%             |
| Colour        |   6.48% | 31.99%            |
| Foundations   |   7.29% | 12.64%            |
| States        |   2.49% | 9.21%             |
| Feedback      |   8.26% | 12.79%            |
| Inputs        |   7.83% | 12.96%; 2: 10.46% |
| Surfaces      |  11.89% | 18.73%; 2: 16.03% |
| Map furniture |   7.07% | 14.35%            |
| Map style     |   9.13% | 16.75%            |
| `map-desktop` |  13.92% |                   |

- **Kit:** text wraps and block heights differ, so everything below drifts. Even States, which looks identical, is at 2.49%.
- **`map-desktop`:** its top bar, search, Filters, Districts, legend, popup and pins aren't built.
- 24 images have no entry.

## Decisions

**D1 · What this Spec sweeps** · Decides: Tech lead

- **A.** The 23 kit screens. `map-desktop` moves to the not-built list (D2) until its screen Spec builds the missing parts, so the "no `report`" test can land.
- **B.** The 23 kit screens, with `map-desktop` left as `report`. The "no `report`" test waits for the map screen Spec.
- **C.** Wait until every screen is built.
- **Other:** your own.

Recommended: A, because a `report` entry at 13.92% blocks nothing.

**D2 · Images with no entry** · Decides: Tech lead

- **A.** The unit test keeps a `NOT_BUILT` list of 25 names and fails when an image is in neither that list nor `screens.json`, or in both. Each screen Spec moves its name into `screens.json` as `blocking`. The first acceptance check gets "or is on the not-built list".
- **B.** Leave the test that every image has an entry to the last screen Spec.
- **Other:** your own.

Recommended: A, because an unlisted new image then fails `npm test` today.

**D3 · Split** · Decides: Tech lead

At 2.5% to 32% across 23 screens, the work is far over the 600-line cap.

- **A.** Seven slices, each with a board's desktop and phone screens together:
  - **DM.13.1:** the unit test, the shared kit header and nav, the index and menu
  - **DM.13.2:** Type, States
  - **DM.13.3:** Colour, Foundations
  - **DM.13.4:** Feedback, Map style
  - **DM.13.5:** Inputs
  - **DM.13.6:** Surfaces
  - **DM.13.7:** Map furniture, the "no `report`" check, `DESIGN.md`
- **B.** Desktop and phone slices, each still over the cap.
- **Other:** your own.

Recommended: A, because each shared part is fixed once, and fixing the header first lowers every later score.

## Files that change

| File                                     | What                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `lib/design/__tests__/screens.test.ts`   | New. Fails on an image with no entry (D2), on `report`, on `ignore`, or if the threshold isn't 0.5 |
| `design/screens.json`                    | Each slice flips its screens to `blocking`; `map-desktop` comes out (D1)                           |
| `app/design-kit/**`, `app/components/**` | Layout fixes, with tests                                                                           |
| `design/source/*.html`                   | Only where a token disagrees with a snapshot                                                       |
| `design/DESIGN.md`                       | Drops `report` (last slice)                                                                        |

## Risks

- A change to a shared component (`Board.tsx`, `Surface`) can raise other boards' scores. Each slice runs the full check, and the boards already `blocking` catch it.
- A board that can't reach 0.5% without a snapshot edit goes to the PO as a design change. The threshold is never raised.

## Proof

| Acceptance check                          | Proven by                                     |
| ----------------------------------------- | --------------------------------------------- |
| Each image has an entry or is on the list | `screens.test.ts`                             |
| All `blocking`, no `ignore`, 0.5          | `screens.test.ts`                             |
| Each screen ≤ 0.5%                        | `npm run e2e`; the summary table in each PR   |
| 8px move fails CI, names screen           | The linked failed run                         |
| New image with no entry fails             | `screens.test.ts`, on a stubbed list of names |
| Tests, e2e, validator, 100%               | Output in each PR                             |
