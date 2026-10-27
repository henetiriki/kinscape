# Plan: AR.2: Add the `@ks/` alias and the Node-loaded-files rule

- **Spec:** #315
- **Requirement IDs:** none (engineering-only)
- **Status:** approved

## Approach

`@ks/*` joins `@/*` in `tsconfig.json` paths, which Next, `tsc` and ESLint's TypeScript resolver read. Vitest gets its own `@ks` alias. `scripts/node-loaded.mts` returns the Node-loaded globs: `**/*.mts`, `scripts/**`, and a `types.ts` in each folder holding an `.mts`, found with `fs.globSync` when the config loads. `eslint.config.mjs` applies the Node rule to those globs, ignoring `**/__tests__/**`. `layers.mts` exports its `targetOf`, which learns `@ks/`, and `vercel-imports.test.ts` drops its own copy for it.

## Decisions

**D1 · Which lint rule enforces the Node rule** · Decides: Tech lead

- **A.** `@typescript-eslint/no-restricted-imports` with `allowTypeImports`: installed, and separate from the core rule the component blocks set, so neither overrides the other. It skips `import()` and `require()` calls, which no Node-loaded file uses with a repo path today.
- **B.** A second local rule beside `layers/imports`, reusing its import walker, so those calls are checked too: about 40 more lines plus `RuleTester` cases.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Proving `composes … from '@ks/…'` under Vitest** · Decides: Tech lead

Vitest doesn't process `composes` (see `app/components/__tests__/onSurface.test.tsx`), so `npm test` can't prove the last acceptance check.

- **A.** `npm run build` proves it, and the design check shows the focus ring still applies. The check changes to "when `npm run build` runs, then it resolves it" in the Spec.
- **B.** Turn on `css.include` for CSS modules in Vitest. Every component test then runs real CSS, and class names may change, which edits existing tests.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                       | New / changed | What                                                                                  |
| ------------------------------------------ | ------------- | ------------------------------------------------------------------------------------- |
| `tsconfig.json`                            | Changed       | `"@ks/*": ["./*"]`                                                                    |
| `vitest.config.mts`                        | Changed       | `@ks` alias                                                                           |
| `scripts/node-loaded.mts`                  | New           | `nodeLoadedFiles()` and the Node message                                              |
| `eslint.config.mjs`                        | Changed       | Node rule block; perfectionist `internalPattern` adds `^@ks/.+`                       |
| `scripts/layers.mts`                       | Changed       | Export `targetOf`, which also reads `@ks/`                                            |
| `scripts/__tests__/layers.test.ts`         | Changed       | A forbidden `@ks/` import fails                                                       |
| `scripts/__tests__/vercel-imports.test.ts` | Changed       | Use `targetOf`; an `@ks/` case                                                        |
| `scripts/__tests__/node-loaded.test.ts`    | New           | Unit test of `nodeLoadedFiles`; `lintText` cases for the Node rule and the sorter     |
| `app/__tests__/alias.test.tsx`             | New           | Imports `Button` and `lib/boundaries/model.mts` through `@ks/`                        |
| `app/page.tsx`                             | Changed       | Three imports to `@ks/`                                                               |
| `app/components/actions/Button.module.css` | Changed       | `composes: ring from '@ks/…'`                                                         |
| `docs/architecture.md`                     | Changed       | Line 21 becomes the enforced Node rule; `@ks/` stated, `@/` legacy until AR.11 (#324) |

## Order of work

1. Alias in `tsconfig.json` and Vitest, with `alias.test.tsx`.
2. `targetOf` and both fitness tests.
3. `node-loaded.mts`, the lint blocks and their tests.
4. `page.tsx`, `Button.module.css`, docs.

## Risks

- An alias that Next resolves but Vitest doesn't, or the reverse: `alias.test.tsx` and `npm run build` cover each side.
- `globSync` walks `node_modules`: exclude it, `.next`, `.claude/worktrees` and `.claude-pr`, as `globalIgnores` does.
- Inline `import { type X, y }` loads the module at run time. `allowTypeImports` reports it, and `consistent-type-specifier-style` already forbids inline `type`.

## Proof

| Acceptance check                                  | Proven by                                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Vitest resolves a component and an `.mts`         | `alias.test.tsx`                                                                                     |
| `page.tsx` on `@ks/` builds and behaves           | `npm run build`, `npm run e2e`                                                                       |
| Value import through an alias fails, Node message | `lintText` on `lib/boundaries/x.mts`, `lib/boundaries/types.ts`, `scripts/x.ts`, for `@ks/` and `@/` |
| Aliased `import type` passes                      | Same files, `lintText`                                                                               |
| Node scripts behave as before                     | `node scripts/validate-boundaries.mts`, `npm run tokens`, `node scripts/vercel-ignore.mts`           |
| Invisible path through `@ks/` fails               | `vercel-imports.test.ts` case                                                                        |
| Forbidden `@ks/` import fails the layer check     | `layers.test.ts` case                                                                                |
| Suite passes, only the two fitness tests edited   | `npm test`, lint, validator, `design:check`, `npm run e2e`                                           |
| Sorter groups `@ks/` as internal                  | `lintText`: passes after packages, fails when sorted among them                                      |
| `composes … from '@ks/…'` resolves                | Per D2                                                                                               |

## Out of scope

Renaming `@/` imports and lint messages (AR.3, AR.4, AR.11); dropping `@/` (AR.11).
