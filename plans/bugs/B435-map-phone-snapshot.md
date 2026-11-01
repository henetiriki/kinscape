# Plan: B435: style-8-components-map-phone differs from its snapshot

- **Spec:** #435
- **Requirement IDs:** None (design kit)
- **Status:** draft

## Approach

The canvas takes the built caption and curly quotes (Bug D1 A, D2 A); the app fixes the rest at its cause (D3 A, D4 A). Likely causes, confirmed at build against the check's diff:

- **Placeholder:** `.input` in `SearchBar.module.css` sets no `line-height`; the snapshot's field is 16 / 24 (`type.body-l`).
- **Avatar:** the 1px is measured against the snapshot's span (44 flex, 16 / 24 · 600) in the browser and fixed in `Avatar.module.css`.
- **Boards:** `KitMenu.module.css` gives the button `line-height: normal`; the snapshot has 15 / 22.
- **Alt row:** the snapshot's spaces around each `<code>` sit inside it, in the mono font, so line 2 starts further right.
- **Layers icons:** every board draws `layers` with butt caps (no `stroke-linecap`); `Icon` gives every icon round caps (D1).

## Decisions

**D1 · The Layers icon's caps are in the shared Icon** · Decides: Tech lead

Bug D3 A puts the smaller fixes in `app/design-kit/`. The Layers button's difference comes from `app/components/foundation/Icon.tsx`, which draws `layers` with round caps; all 16 snapshots that draw it, including the icon set on board 03, use butt caps.

- **A.** Give the `layers` paths `strokeLinecap='butt'` in `Icon.tsx`, with a test. Boards 03 and 08 should score better; the PR lists every screen's score.
- **B.** Change nothing; the PR's Evidence says why it can't match from `app/design-kit/`.
- **Other:** your own.

Recommended: A, because the boards agree on the drawing and the map's phone screens will use the same icon.

## Files that change

| File                                                                                         | New / changed | What                                                               |
| -------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------ |
| `design/canvas/project/SG-Furniture-phone.dc.html`, `design/canvas/VERSION`                  | Changed       | Tech lead: the four texts, then the refreshed copy (Bug steps 3–4) |
| `design/source/style-8-components-map-phone.html`, `design/style-8-components-map-phone.jpg` | Changed       | The Design agent shots workflow (step 6)                           |
| `features/map/components/SearchBar.module.css`                                               | Changed       | `.input` takes `type.body-l`'s line height                         |
| `app/components/foundation/Avatar.module.css`                                                | Changed       | The 1px fix                                                        |
| `app/design-kit/KitMenu.module.css`                                                          | Changed       | The Boards button's line height                                    |
| `app/design-kit/map-furniture/sections.tsx`                                                  | Changed       | The Alt row's spacing, as the snapshot sets it                     |
| `app/components/foundation/Icon.tsx`, `__tests__/Icon.test.tsx`                              | Changed       | Under D1 A: butt caps on `layers`, and a test that fails first     |

## Order of work

1. Record D1, then commit `plan(B435): approved by @<tech-lead>`.
2. Run the full `npm run design:check` on Linux and keep every score as the baseline.
3. The pill input, then the avatar; then the Boards button, the Alt row and (D1 A) the icon, re-running the check after each.
4. Run lint, `format:check`, `words`, the tests, `validate:boundaries`, `e2e` and `design:check`. Push.
5. Ask the tech lead in the PR to run Bug steps 3–6 (signed-in session) and, optionally, step 10, then to paste the macOS score.
6. After the shots commit, run the checks again and paste every score against the baseline.

## Risks

- **Shared header:** the Boards button is on every kit phone screen, and Avatar on the surfaces boards; any screen scoring worse than the baseline is fixed or reported.
- **Platform text:** macOS scores 0.08% above Linux; the margin is judged on the tech lead's macOS score.

## Proof

| Acceptance check                                          | Proven by                                                   |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| Passes on macOS and CI with a clear margin                | CI's design check summary; the tech lead's macOS score      |
| Boards, Alt row and Layers icons gone from the diff       | The diff image before and after, or a reason, in Evidence   |
| `e2e` passes on macOS                                     | The tech lead's run                                         |
| Export leaves `design/source/` unchanged; no screen worse | `npm run design:export` output; scores against the baseline |
| Refresh steps ran as `DESIGN.md` says                     | Evidence, from the tech lead                                |

## Out of scope

- Other boards' text; the map's own phone pill.
