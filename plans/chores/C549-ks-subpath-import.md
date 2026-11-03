# Plan: C549: Use the `#ks/` subpath import in `.mts` and `.mjs` files

- **Spec:** #549
- **Status:** draft

## Approach

`package.json` gains `"imports": { "#ks/*": "./*" }`, so Node, Vite, TypeScript and Turbopack resolve `#ks/` without tsconfig. Imports are rewritten by hand, then `eslint --fix` re-sorts them. `eslint.config.mjs` swaps the Node-loaded blocks for two `no-restricted-imports` blocks keyed by extension. `targetOf` treats `#ks/` like `@ks/` (both prefixes are 4 characters).

## Decisions

**D1 · Which alias `.js` and `.jsx` files take** · Decides: Tech lead

The Chore keys rules to `{mts,mjs}` and `{ts,tsx}`; `RELATIVE` covers `.js` and `.jsx` today. None are tracked.

- **A.** Leave them unruled, as the Chore words it.
- **B.** Join the `{ts,tsx}` block: Next bundles them.
- **Other:** your own.

Recommended: B, because it keeps today's relative-import ban.

## Files that change

| File                                         | New / changed | What                                                                              |
| -------------------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| `package.json`                               | changed       | `imports`                                                                         |
| Each file with a relative import             | changed       | `#ks/` in `.mts`/`.mjs`, `@ks/` in `.ts`                                          |
| `eslint.config.mjs`                          | changed       | extension blocks, `internalPattern`                                               |
| `scripts/layers.mts`                         | changed       | `targetOf` and header comment                                                     |
| `scripts/__tests__/layers{,-config}.test.ts` | changed       | `#ks/` cases; the relative-import passes become failures; sorter cases moved here |
| `scripts/__tests__/vercel-imports.test.ts`   | changed       | a `#ks/` case                                                                     |
| `scripts/node-loaded.mts` and its test       | deleted       |                                                                                   |
| `docs/architecture.md`                       | changed       | lines 25 and 49                                                                   |

## Order of work

1. Failing `targetOf` and lint-config tests, then `layers.mts` and `eslint.config.mjs`.
2. `package.json`; rewrite imports; `next build` first, stopping as the Chore says if it fails.
3. Delete `node-loaded`; docs.

## Risks

- `gatherTypes` (`lib/design/bundle.mts:147`) reads `@ks/` only: compare `npm run design-system` output before and after; if it changes, teach it `#ks/`.
- The diff nears 600 lines; most is deletion.

## Proof

| Acceptance check       | Proven by                           |
| ---------------------- | ----------------------------------- |
| Commands pass          | pasted output                       |
| `account:add` resolves | run with no arguments, error pasted |
| Three `git grep`s      | pasted empty output                 |
| `node-loaded` gone     | `git ls-files scripts`              |
