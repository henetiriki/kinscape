# Plan: C551: Stop `.mts` and `.mjs` files value-importing `.ts` files

- **Spec:** #551
- **Status:** approved

## Approach

`eslint.config.mjs` splits the `**/*.{mts,mjs}` block in two, sharing the relative and `@ks/` patterns. Both gain a `no-restricted-imports` pattern with regex `\.tsx?$` and a move-it-to-`.mts` message. The `.mts` one sets `allowTypeImports: true`. The `.mjs` one doesn't: Node parses `.mjs` as plain JavaScript, so `import type` is a syntax error there. The test helper in `layers-config.test.ts` also returns fatal (parse) messages, so a case can't pass on a parse error.

## Decisions

**D1 · Whether to reject an extensionless `#ks/` import too** · Decides: Tech lead

The new pattern misses `'#ks/lib/ui/hatch'`, which Node can't resolve either. No file has one today.

- **A.** Match `.ts` and `.tsx` only, as the Chore says.
- **B.** Also reject a `#ks/` path with no extension, with a test.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Deviations

- `import type` of a `.ts` file fails in `.mjs` (separate pattern), as @henetiriki asked on the PR after review: Node can't parse it there. This changes the Spec's `.mjs` pass case.

## Files that change

| File                                      | New / changed | What                                         |
| ----------------------------------------- | ------------- | -------------------------------------------- |
| `eslint.config.mjs`                       | changed       | the pattern                                  |
| `scripts/__tests__/layers-config.test.ts` | changed       | helper keeps fatal messages; new cases       |
| `docs/architecture.md`                    | changed       | one sentence after the import-alias sentence |

## Order of work

1. Tests: a value import and a re-export of `#ks/lib/ui/hatch.ts` fail in `scripts/x.mts` and `x/y.mjs`; `import type` from a `.ts` file passes in `.mts` and fails in `.mjs`; a value import of an `.mts` file passes in each. See them fail on the missing message (rule 12).
2. The pattern; docs.

## Risks

- Keeping fatal messages may expose an existing case that passed only on a parse error: fix that case's code (rule 10).

## Proof

| Acceptance check                | Proven by                            |
| ------------------------------- | ------------------------------------ |
| Lint cases                      | new cases in `layers-config.test.ts` |
| Commands pass; `git grep` empty | pasted output                        |
| `docs/architecture.md` rule     | the diff                             |
