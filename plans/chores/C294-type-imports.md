# Plan: C294: Enforce `import type` for type imports and document where types live

- **Spec:** #294
- **Status:** draft

## Approach

Add both rules at `error` to the existing `**/*.{js,jsx,mjs,mts,ts,tsx}` block; the `import` plugin and the TypeScript parser already cover it, and `package.json` stays outside it. A dry run with `--rule` flags 90 inline specifiers in about 60 files, multi-line imports included, all fixable; `consistent-type-imports` flags none today. `npm run lint -- --fix`, then `npm run format`, splits them; perfectionist re-sorts the new lines.

## Decisions

**D1 · File name for shared types where modules are `.mts`** · Decides: Tech lead

`lib/boundaries/` and `scripts/` use `.mts` for modules Node imports. Should the new row say `types.ts` there too?

- **A.** Always `types.ts`: Node erases `import type`, so it never loads the file.
- **B.** `types.mts` in `.mts` folders, `types.ts` elsewhere.
- **Other:** your own.

Recommended: A, because one name is easier to find and lint.

## Files that change

| File                     | New / changed | What                                      |
| ------------------------ | ------------- | ----------------------------------------- |
| `eslint.config.mjs`      | Changed       | The two rules                             |
| About 60 `.ts/.tsx/.mts` | Changed       | `--fix` output only                       |
| `docs/architecture.md`   | Changed       | _Where does X go_ row, _Enforcement_ line |

## Order of work

1. Rules, then `--fix` and `format`, in one commit.
2. Docs row (per D1) and Enforcement line.

## Proof

| Acceptance check                      | Proven by                                                |
| ------------------------------------- | -------------------------------------------------------- |
| Lint fails on inline, passes on split | Lint output on a planted file of each form, then deleted |
| The `git grep` finds nothing          | Its output                                               |
| Docs row and line; `npm run words`    | The diff; its output                                     |
| Lint, tests, validator, e2e           | Their output                                             |
