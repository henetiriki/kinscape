# Plan: B841: Client-side links and a kept map

- **Spec:** #841
- **Requirement IDs:** [PPL-01](../../docs/requirements.md#ppl-01), [NFR-01](../../docs/requirements.md#nfr-01), [NFR-02](../../docs/requirements.md#nfr-02), [NFR-03](../../docs/requirements.md#nfr-03)
- **Status:** approved

## Approach

- **Links.** `BackLink`, `Button`, `TextLink` and `PersonRow` render the component in `LinkContext`, which defaults to `'a'`. A `Links` provider in the root layout gives `next/link`, which leaves a modified or middle click to the browser.
- **Kept map.** The root layout takes a `@map` slot: `app/@map/page.tsx` renders `MapShell`, and `default.tsx` renders nothing. A client-side navigation keeps the slot mounted. `MapHost` shows it on `/`. On `/people/**`, `MapHost` hides it with `inert` and `visibility: hidden`, so MapLibre gets no resize. On other routes `MapHost` drops it, so sign-out resets the map.
- **Loading.** `app/people/loading.tsx` renders `PeopleLoading` (D3).

## Decisions

**D2 · How the map stays mounted** · Decides: Tech lead

- **A.** A `@map` slot in the root layout, as the Approach says.
- **B.** Turn on `cacheComponents`, so Next hides each page in `<Activity>`. The hide runs the `MapView` cleanup, which removes the map. Next keeps 3 routes only.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · The People loading screen** · Decides: Tech lead

- **A.** `PageHeader` with the "Map" back link and no Avatar, the "People" H1, and a `NoticeCard` "Loading people" with no progress bar.
- **B.** `PageHeader`, the H1, and the column heads over grey row blocks. The blocks are a missing component.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                      | New / changed | What                                 |
| ------------------------------------------------------------------------- | ------------- | ------------------------------------ |
| `app/components/foundation/link.ts`, `types.ts`                           | New, changed  | `LinkContext`, `LinkComponent`       |
| `PageHeader.tsx`, `actions/Button.tsx`, `TextLink.tsx`, `PersonRow.tsx`   | Changed       | Render the context link              |
| `app/Links.tsx`, `app/layout.tsx`                                         | New, changed  | The provider, slot and `MapHost`     |
| `app/@map/page.tsx`, `default.tsx`; `app/page.tsx`                        | New; changed  | `git mv` of the map; a session check |
| `app/MapHost.tsx`                                                         | New           | Show, hide or drop the slot          |
| `app/people/loading.tsx`, `features/people/components/PeopleLoading.tsx`  | New           | The loading screen                   |
| `app/screens/people-loading/page.tsx`, `design/screens.json`, `DESIGN.md` | New, changed  | Desktop and phone, blocking          |
| `scripts/safety.mts`                                                      | Changed       | `routeOf` drops an `@slot` segment   |
| `e2e/navigation.spec.ts`, `docs/architecture.md`                          | New, changed  | The checks; two Patterns rows        |
| `__tests__/` beside each file                                             | New, changed  | `app/__tests__/page.test.tsx` moves  |

## Order of work

1. Build the links, with tests that omit a provider.
2. Build the slot, `MapHost` and `routeOf`.
3. Build the loading screen from the D3 answer.
4. Write `e2e/navigation.spec.ts` and the architecture rows.
5. Run the design system steps:
   - 2 and 9: the agent.
   - 3 to 5 and 8: the tech lead, or a local Claude Code session that they start. It needs a signed-in account.
   - 7: the design agent draws the People loading board.

## Deviations

- `scripts/word-count.mts` and its test raise the `docs/architecture.md` budget from 875 to 900 words, for the two Patterns rows.
- `design/screens.json` and `DESIGN.md` have no `people-loading` entry. The design agent adds them with the board (step 5.7), because a blocking entry with no board fails `design:check`.
- `MapHost` lives in `app/MapHost.tsx`, not `features/map/`. The layer rule needs the `features/map` index, and that index in the root layout loads every map stylesheet on every page and changes the cascade.
- `app/people/layout.tsx` checks the session, and the map `AccountMenu` prefetches `/people`. Without the check, `loading.tsx` sends 200 before a page redirects, and `gate.spec.mts` fails. Without the prefetch, a slow server shows no loading screen.
- `app/@map/default.tsx` and `app/people/loading.tsx` each have a test, for 100% coverage.

## Risks

- A return to `/` waits for one server render, but the map is already mounted. The e2e test measures the wait.
- `/` looks up the session in each page, so one request makes two queries. A React `cache` fixes it.

## Proof

| Acceptance check                          | Proven by                                       |
| ----------------------------------------- | ----------------------------------------------- |
| No new document on each link              | `navigation.spec.ts` `window` marker            |
| No provider gives `<a href>`              | Kit tests; `react-18.test.tsx`; `design:check`  |
| Modifier key, middle click                | `navigation.spec.ts` new page                   |
| Slow server shows the loading screen      | `navigation.spec.ts` delayed route; screen test |
| Kept values, one map, panel, sheet, sizes | `navigation.spec.ts`, desktop and phone         |
| Hidden map                                | `MapHost.test.tsx`; `navigation.spec.ts` Tab    |
| Direct `/people` loads no map files       | `navigation.spec.ts` request log                |
| Sign out, sign in: fresh map              | `navigation.spec.ts`                            |
| Architecture rows                         | `npm run words`; review                         |
| NFR-03 checks, `proxy.ts`                 | `gate.test.ts`, `e2e/gate.spec.mts`             |
| `Cache-Control` on `/people`              | `__tests__/next-config.test.ts`                 |
| NFR-01                                    | `@perf` tests                                   |
| #104, #261                                | `map-phone.spec.ts`, `Stage.test.tsx`           |
| Dialog, menus, sign-out, People, toast    | Existing e2e specs                              |
| No `next/*` in the kit                    | Review: `link.ts` imports React only            |
| Boards, snapshots, states                 | `design:check`; `design` job                    |
