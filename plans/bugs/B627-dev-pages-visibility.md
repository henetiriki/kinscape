# Plan: B627: Design-kit and screens visibility check moves out of the layout

- **Spec:** #627 (Bug)
- **Requirement IDs:** [NFR-03](../../docs/requirements.md#nfr-03), [NFR-10](../../docs/requirements.md#nfr-10)
- **Status:** approved

## Approach

`devPagesVisible(env)` in `server/dev-pages.mts` is an allowlist: `VERCEL_ENV === 'preview'`, `NODE_ENV` of `development` or `test`, or `KINSCAPE_DEV_PAGES === '1'`. `proxy.ts` answers 404 for `/design-kit` and `/screens` when they are hidden, before the cookie check. `requireDevPage()` in `server/auth/current.mts` calls `notFound()` when they are hidden, then `requireSession()`; every page under both folders calls it. The layouts lose their `VERCEL_ENV` check. `parseEnv` refuses `KINSCAPE_DEV_PAGES` on Vercel. `scripts/check-production.mts` checks a deployment by hand.

## Decisions

**D1 · Where the check lives** · Decides: Tech lead

- **A.** `proxy.ts` answers 404 unless allowlisted; each `page.tsx` repeats it.
- ~~**B.** Exclude the folders from production builds.~~

**Answer: A** (@henetiriki)

**D2 · How e2e sees the kit** · Decides: Tech lead

- **A.** `KINSCAPE_DEV_PAGES=1` on Playwright's main server; a second server on :3001 without it serves `e2e/dev-pages.spec.mts`; the server refuses the variable on Vercel.
- ~~**B.** `KINSCAPE_MEMORY_ADAPTERS=1` opens the pages too.~~

**Answer: A** (@henetiriki)

**D3 · Smoke script and Vercel Authentication** · Decides: Tech lead

- **A.** Sends `x-vercel-protection-bypass` when `VERCEL_AUTOMATION_BYPASS_SECRET` is set in the caller's shell.
- ~~**B.** No bypass.~~

**Answer: A** (@henetiriki)

**D4 · When Vercel Authentication comes off production** · Decides: Tech lead

**Answer:** when M2 sign-in ships to production (@henetiriki)

## Files that change

| File                                                                                         | What                                                                                          |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `server/dev-pages.mts`, `server/__tests__/dev-pages.test.ts`                                 | Allowlist                                                                                     |
| `proxy.ts`, `__tests__/proxy.test.ts`                                                        | 404 for hidden pages                                                                          |
| `server/auth/current.mts`, `server/env.mts`, their tests                                     | `requireDevPage()`; D2 guard                                                                  |
| `app/design-kit/**/page.tsx`, `app/screens/add-pin/page.tsx`, `layout.tsx`s, and their tests | Page check; layout check removed (layout 404 tests deleted; page tests mock `requireDevPage`) |
| `playwright.config.ts`, `e2e/dev-pages.spec.mts`                                             | D2                                                                                            |
| `scripts/check-production.mts`, its test, `package.json`                                     | `/design-kit` 404; `/` redirects; `check:production` script                                   |
| `docs/architecture.md`, `docs/repo-settings.md`                                              | Layout rule; Vercel rows; new variable                                                        |

## Order of work

1. Failing tests for the allowlist and proxy, then the code.
2. Pages, guard, e2e, script, docs.

## Risks

- Playwright's second server waits for the first one's build: the array runs in order.

## Proof

| Acceptance check                                   | Proven by                                       |
| -------------------------------------------------- | ----------------------------------------------- |
| Hidden outside Preview and development             | `dev-pages.test.ts`, `proxy.test.ts`            |
| RSC and prefetch requests get 404, with any cookie | `e2e/dev-pages.spec.mts`; a curl run on `:3001` |
| A production deployment hides them                 | `scripts/check-production.mts` after deploy     |

## Flagged concerns

- New variable `KINSCAPE_DEV_PAGES`: local and e2e only, refused on Vercel.

## Deviations

- `scripts/safety.mts` counts `requireDevPage()` as a page's session check, with a `gate.test.ts` case.
- Review: the gate check requires `requireDevPage()` in every route under `/design-kit` and `/screens`.
- Review: an unset `NODE_ENV` hides the pages; only `development` and `test` show them.
- Review: `e2e/dev-pages.spec.mts` also prefetches the layout segments.
