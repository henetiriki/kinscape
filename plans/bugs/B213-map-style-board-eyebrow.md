# Plan: B213: MapLibre board has incorrect eyebrow

- **Spec:** #213 (Bug; board built in DM.11, #151)
- **Requirement IDs:** NFR-06
- **Status:** approved

## Approach

`app/design-kit/map-style/page.tsx:27` hard-codes the eyebrow `Style guide · 06`, copied from the Inputs board. The design ([map-style.html](../../design/source/map-style.html)) and the `eyebrow` in `BOARDS` (`app/design-kit/boards.ts`) both say `Map style`. Make the page's eyebrow `Map style` and add a unit test for it.

## Decisions

**D1 · Where the page gets its eyebrow** · Decides: Tech lead

- **A.** Hard-code `Map style` in the page, as the other eight boards hard-code theirs.
- **B.** Add `boardEyebrow(slug)` beside `boardTitle` in `boards.ts` and read it on this page only, so the page and the kit menu can't drift apart.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                               | New / changed | What                                      |
| -------------------------------------------------- | ------------- | ----------------------------------------- |
| `app/design-kit/map-style/page.tsx`                | changed       | Eyebrow reads `Map style`                 |
| `app/design-kit/map-style/__tests__/page.test.tsx` | changed       | Test: the header's eyebrow is `Map style` |
| `app/design-kit/boards.ts`                         | changed       | Only with D1: B, adds `boardEyebrow`      |

## Order of work

1. Commit this plan: `plan(B213): approved by @henetiriki`.
2. Write the failing test, then fix the page.
3. Run lint, format check, `npm test`, `npm run validate:boundaries`, `npm run e2e` and `npm run design:check -- -g map-style`.

## Proof

| Acceptance check                                  | Proven by                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `/design-kit/map-style` eyebrow reads `Map style` | Unit test in `page.test.tsx`; the PO checks the preview                  |
| Board still matches its design snapshot           | `npm run design:check -- -g map-style` mismatch no higher than on `main` |
