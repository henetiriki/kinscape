# Plan: C296: Move `app/` exported types into per-folder `types.ts`

- **Spec:** #296
- **Status:** draft

## Approach

Cut each type into its folder's `types.ts` unchanged, then repoint importers: `@/app/components/<folder>/types` in components, `./types` or `../types` in the design kit. `controls.ts` holds only `ControlState`, so it is deleted. Owners import their types back; the `typeof` cycles are type-only and erased.

## Decisions

**D1 · `Swatch` and `LabelKey`** · Decides: Tech lead

`Group` uses `Swatch` and `Label` uses `LabelKey`, so neither can stay unexported in place once its user moves.

- **A.** Move each, unexported, into the `types.ts` beside its user.
- **B.** Move both exported: 28 move, 2 unexported.
- **Other:** your own.

Recommended: A, because they stay unexported and their only user moves.

**D2 · `TextVariant` is built from unexported `Heading` and `Other`** · Decides: Tech lead

`Text.tsx` also uses both.

- **A.** Move both to `foundation/types.ts`, exported; `Text.tsx` imports them.
- **B.** Same, renamed `HeadingVariant` and `BodyVariant`.
- **Other:** your own.

Recommended: A, because no type changes.

## Files that change

| File                           | New / changed | What                                     |
| ------------------------------ | ------------- | ---------------------------------------- |
| Eight `types.ts` named in #296 | New           | The types                                |
| 16 declaring files             | Changed       | Types removed; `PATHS`, `MARKS` exported |
| `foundation/controls.ts`       | Deleted       | Emptied                                  |
| About 40 importers             | Changed       | Import path                              |

## Order of work

1. One commit per folder: types, importers, then lint, format and typecheck.
2. Unexport `LayerRow` and `DialogForm`.

## Risks

- The diff nears 600 lines (about 380 moved, 170 imports). If it passes, I stop under rule 7.

## Proof

| Acceptance check                       | Proven by                     |
| -------------------------------------- | ----------------------------- |
| The `git grep` finds only `types.ts`   | Its output                    |
| Lint, typecheck, tests, validator, e2e | Their output                  |
| Under 600 lines                        | `git diff --stat origin/main` |
