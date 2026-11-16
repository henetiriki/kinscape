# Plan: B907: The slow-server loading screen test waits for the prefetch

- **Spec:** #907 (Bug)
- **Requirement IDs:** [PPL-01](../../docs/requirements.md#ppl-01)
- **Status:** approved

## Approach

The cause in the Bug is correct. On `main` (68e93b4), 1 of 40 runs of _Steps to reproduce_ step 1 failed at line 136. In Next 16.4.5, `router.prefetch('/people')` sends two requests to `/people`:

1. The route tree request, with `Next-Router-Segment-Prefetch: /_tree`.
2. The loading-boundary request, with `Next-Router-Prefetch: 1` and no segment header. Its response holds the loading screen.

`next/dist/client/components/segment-cache/cache.js` sends both. If the delay route holds request 2, the router has no loading screen at the click. The test starts a `requestfinished` listener before `page.goto('/')`. It polls until request 2 ends with an OK status (D1), and only then adds the delay route. The poll message names the missing prefetch, so a run with no prefetch fails clearly.

## Decisions

**D1 · Which request ends the prefetch** · Decides: Tech lead

The Bug says "waits for the prefetch response of `/people`". The prefetch has two requests.

- **A.** Wait for request 2. The test then depends on two Next request headers. If a Next upgrade changes them, the poll fails with its message.
- **B.** Wait for the first `/people` request with `Next-Router-Prefetch`. That is request 1, which holds no loading screen, so the race stays.
- **C.** Wait until both requests end. The test must then know the count of requests, which also depends on Next.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- `waitForLoadState('networkidle')`. The map loads tiles and boundary files, so the wait has no fixed end.
- A longer delay or a retry. The race stays.
- Look for "Loading people" in the response body. `PeopleLoading` is a client component, so the RSC payload does not hold the text.

## Files that change

| File                                          | New / changed | What                                                     |
| --------------------------------------------- | ------------- | -------------------------------------------------------- |
| `plans/bugs/B907-slow-server-loading-test.md` | New           | This plan                                                |
| `e2e/navigation.spec.ts`                      | Changed       | A `prefetched` helper; the slow-server test waits for it |

## Order of work

1. Commit this plan: `plan(B907): approved by @<tech lead>`.
2. Add `prefetched(page, path)` beside `mark`. It returns a function that is true after request 2 ends with an OK status.
3. In the slow-server test, call it before `page.goto('/')`. After `mark`, poll it for up to 10 s with a message. Then add the delay route.
4. Change the helper path to `/none` for one local run. Paste the failure message in the PR. Then revert the change.
5. Run step 1 of _Steps to reproduce_ with `npm run e2e`. Paste the result in the PR's Evidence.
6. Run the checks in `AGENTS.md` › Commands.

## Risks

- **A click before the prefetch ends.** A user who chooses "People" before request 2 ends sees no loading screen. The screen waits with no feedback until the server responds, as in #841. This is likely only on a slow server, in the first seconds after the map loads. A fix changes the app, for example a pending state in `AccountMenu`, with a design and a test. It needs its own Bug or Spec.
- **Decode after the request ends.** Next decodes the response into its cache after `requestfinished`. The two clicks after the poll take longer than the decode. If a gap exists, step 5 shows it. A fix needs a router state that Next does not expose.

## Deviations

- Step 2: `prefetched` takes a `path` parameter, so the helper does not hard-code `/people`.

## Proof

| Acceptance check                                            | Proven by                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| "Loading people" shows, then the heading, then it is gone   | `navigation.spec.ts` › `a slow server shows the loading screen` |
| The prefetch ends before the delay route; a clear message   | The poll; the step 4 output                                     |
| 40 runs pass                                                | The step 5 output                                               |
| No file under `app/`, `features/` or `lib/` changes         | `git diff --stat origin/main` in the PR                         |
| #841: the other `navigation.spec.ts` tests; no new document | `npm run e2e`; `same(page)` at the end of the test              |
| PPL-01: the People e2e tests                                | `people.spec.ts`, `person-form.spec.ts` in `npm run e2e`        |
| NFR-01: the `@perf` tests                                   | The `perf` project in `npm run e2e`                             |
| The prefetch in `AccountMenu` stays                         | The diff; `AccountMenu.test.tsx`                                |
