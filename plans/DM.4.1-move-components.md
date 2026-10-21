# Plan: DM.4.1: Move components into app/components

- **Spec:** #130 (Intent #111)
- **Requirement IDs:** NFR-06
- **Status:** approved

## Approach

One `git mv components app/components` moves the 14 components, `controls.ts` and `__tests__` together. Imports inside the folder are relative (`./Credits`, `../Button`) and stay valid. Only the three files that use `@/components/…` change to `@/app/components/…`. The Vitest globs drop `components`, since `app` already covers the folder. The colour-literal test reads `app/components`. No file content changes in the move, so git records each file as a 100% rename.

## Decisions

**D1 · The CI cache key** · Decides: Tech lead
`.github/workflows/ci.yml:104` hashes `components/**` for the Next build cache. `app/**` already covers the moved files, so the stale glob matches nothing.

- **A.** Remove `'components/**'` from the key in this PR. If the Actions token can't push workflow changes, the tech lead commits that one line.
- **B.** Leave it. `hashFiles` skips a glob that matches nothing, so the cache still works.
- **Other:** your own.

Recommended: A, because no stale path is left behind.

**Answer (@henetiriki): A.**

## Files that change

| File                                  | New / changed | What                                               |
| ------------------------------------- | ------------- | -------------------------------------------------- |
| `components/**` → `app/components/**` | Moved         | `git mv`, contents unchanged                       |
| `app/page.tsx`                        | Changed       | Import `MapShell` from `@/app/components/MapShell` |
| `app/design-kit/page.tsx`             | Changed       | 8 imports to `@/app/components/…`                  |
| `app/__tests__/page.test.tsx`         | Changed       | `vi.mock('@/app/components/MapShell', …)`          |
| `vitest.config.mts`                   | Changed       | Both globs become `{app,lib,scripts}`              |
| `lib/design/__tests__/design.test.ts` | Changed       | Scan `app/components/*.tsx`                        |
| `.github/workflows/ci.yml`            | Changed       | D1 A only                                          |

## Order of work

1. Before the move, run `npm run design:check` and keep its list of differences.
2. `git mv components app/components`. Commit on its own so the renames show cleanly.
3. Update the imports, the Vitest globs, the colour-literal test and D1.
4. Run `npm run lint`, `npm test`, `npm run validate:boundaries`, `npm run e2e`, `npm run build` and `npm run design:check`.

## Risks

- **Open branches that touch `components/`:** they rebase after this merges. Git follows the renames, so their edits usually land on the new paths.
- **A missed import:** `tsc` in the build and the Vitest run both fail on it. `git grep -nE "@/components|'components/"` must come back empty, apart from `plans/`.
- **The folder becomes a route:** it has no `page.tsx` or `route.ts`, so it can't. `next build`'s route list proves it.

## Proof

| Acceptance check                                         | Proven by                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------ |
| `components/` gone; `app/components/` has the same files | `git diff --stat -M origin/main` lists only 100% renames for them        |
| All imports read `@/app/components/…`                    | The `git grep` above is empty                                            |
| Lint, tests (100%), boundaries, e2e and build pass       | Output in the PR; the test diff touches paths only                       |
| `/` and `/design-kit` unchanged                          | e2e passes; `design:check` lists the same differences as before the move |
| Colour-literal test scans `app/components/*.tsx`         | Its test names in the Vitest output read `app/components/…`              |

## Out of scope

- Old plans in `plans/` still name `components/`; they are history and stay as written.
