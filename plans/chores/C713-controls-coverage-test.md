# Plan: C713: Fail the tests when a shared component is not in the design system

- **Spec:** #713
- **Status:** draft

## Approach

1. In `lib/design/__tests__/bundle.test.ts`, read the five role folders with `readdirSync` (D1), not `git ls-files`, so an unstaged file counts.
2. Expect the `.tsx` paths in neither `CONTROLS` nor `EXCLUDED` to equal `[]`. Vitest prints each path.
3. Expect the `EXCLUDED` entries that do not exist or are in `CONTROLS` to equal `[]`.
4. `EXCLUDED` is an empty `{ path: string; reason: string }[]`.

## Decisions

**D1 · Which files the test lists** · Decides: Tech lead

Each role folder has `.tsx` tests in `__tests__/`, and no other subfolder. Which files does the test list?

- **A.** Only the files directly in each folder.
- **B.** The files in each folder and its subfolders, except `__tests__/`.
- **Other:** your own.

Recommended: B, because then a component in a new subfolder also fails the test.

## Files that change

`lib/design/__tests__/bundle.test.ts` and the "Shared controls run on React 18 and 19" row in `docs/architecture.md`.

## Order of work

1. Add the tests.
2. Add `app/components/overlays/Stray.tsx`. See the first test fail and name it. Delete the file.
3. Add a missing path to `EXCLUDED`. See the second test fail. Remove the path.
4. Name the test in the architecture row.

## Proof

| Acceptance check                | Proven by              |
| ------------------------------- | ---------------------- |
| Passes after #691               | `npm test` output      |
| A stray file fails, named       | Step 2's failing line  |
| A missing `EXCLUDED` path fails | Step 3's failing line  |
| Checks and the architecture row | PR output and the diff |

## Out of scope

- A new export in an existing file.
- `features/map/components/DateField.tsx`, outside the five folders.
