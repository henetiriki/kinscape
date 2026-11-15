# Plan: B841: Client-side links and a kept map

- **Spec:** #841
- **Requirement IDs:** [PPL-01](../../docs/requirements.md#ppl-01), [NFR-01](../../docs/requirements.md#nfr-01), [NFR-02](../../docs/requirements.md#nfr-02), [NFR-03](../../docs/requirements.md#nfr-03)
- **Status:** approved

## Approach

- **Links.** `BackLink`, `Button`, `TextLink` and `PersonRow` render the component in `LinkContext`, which defaults to `'a'`. A `Links` provider in the root layout gives `next/link`.
- **Kept map.** The root layout takes a `@map` slot: `app/@map/page.tsx` renders `MapShell`, and `default.tsx` renders nothing. A client-side navigation keeps the slot mounted. `MapHost` shows it on `/`, hides it under `/people` with `inert` and `visibility: hidden`, and drops it elsewhere, so sign-out resets the map.
- **Loading.** `app/people/(list)/loading.tsx` renders `PeopleLoading` (D3). The `(list)` group keeps it off the form routes (D5).

## Decisions

**D2 · How the map stays mounted** · Decides: Tech lead

- **A.** A `@map` slot in the root layout, as the Approach says.
- **B.** Turn on `cacheComponents`. Next hides each page in `<Activity>`, which runs the `MapView` cleanup and removes the map.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · The People loading screen** · Decides: Tech lead

- **A.** `PageHeader` with the "Map" back link and no Avatar, the "People" H1, and a `NoticeCard` "Loading people" with no progress bar.
- **B.** `PageHeader`, the H1, and the column heads over grey row blocks. The blocks are missing.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · The phone heading** · Decides: Tech lead

The phone boards draw `h1Phone`. The page drew `h1`, so `people-loading-phone` failed at 0.91%.

- **A.** `PeopleList` and `PeopleLoading` use `h1Phone` on a phone.
- **B.** Only `PeopleLoading` does. A Bug fixes `PeopleList`.
- **C.** Redraw the board with `h1`.

**Answer: A** (tech lead, in the session)

**D5 · The form routes** · Decides: Tech lead

A hard load of a form route showed the People loading screen first.

- **A.** Move the list route into `app/people/(list)/`. The forms get no loading screen.
- **B.** Draw loading screens for the forms.
- **C.** Leave it.

**Answer: A** (tech lead, in the session)

## Files that change

| File                                                                      | New / changed | What                                 |
| ------------------------------------------------------------------------- | ------------- | ------------------------------------ |
| `app/components/foundation/link.ts`, `types.ts`                           | New, changed  | `LinkContext`, `LinkComponent`       |
| `PageHeader.tsx`, `actions/Button.tsx`, `TextLink.tsx`, `PersonRow.tsx`   | Changed       | Render the context link              |
| `app/Links.tsx`, `app/layout.tsx`                                         | New, changed  | The provider, slot and `MapHost`     |
| `app/@map/page.tsx`, `default.tsx`; `app/page.tsx`                        | New; changed  | `git mv` of the map; a session check |
| `app/MapHost.tsx`                                                         | New           | Show, hide or drop the slot          |
| `app/people/(list)/`, `features/people/components/PeopleLoading.tsx`      | New, moved    | The loading screen; `page.tsx` moves |
| `app/screens/people-loading/page.tsx`, `design/screens.json`, `DESIGN.md` | New, changed  | Desktop and phone, blocking          |
| `scripts/safety.mts`                                                      | Changed       | `routeOf` drops an `@slot` segment   |
| `e2e/navigation.spec.ts`, `docs/architecture.md`                          | New, changed  | The checks; two Patterns rows        |
| `__tests__/` beside each file                                             | New, changed  | `app/__tests__/page.test.tsx` moves  |

## Order of work

1. Links, with tests that omit a provider.
2. The slot, `MapHost` and `routeOf`.
3. The loading screen (D3).
4. `e2e/navigation.spec.ts` and the architecture rows.
5. Run the design system steps. The agent runs 2 and 9. The tech lead, or a local session with a signed-in account, runs 3 to 5 and 8. The design agent draws the board (7).

## Deviations

- `scripts/word-count.mts` raises the `docs/architecture.md` budget from 875 to 900 words, for the two rows.
- `MapHost` is in `app/MapHost.tsx`. The `features/map` index in the root layout loads every map stylesheet on every page.
- `app/people/layout.tsx` checks the session, or `loading.tsx` sends 200 before a redirect. The map `AccountMenu` prefetches `/people`, or a slow server shows no loading screen.
- `app/@map/default.tsx` and `app/people/(list)/loading.tsx` each have a test, for 100% coverage.

## Risks

- A return to `/` waits for one server render with the map already mounted. The e2e test measures it.

## Proof

| Acceptance check                           | Proven by                                            |
| ------------------------------------------ | ---------------------------------------------------- |
| No new document; modifier and middle click | `navigation.spec.ts` marker; new page                |
| No provider gives `<a href>`               | Kit tests; `react-18.test.tsx`; `design:check`       |
| Slow server shows the loading screen       | `navigation.spec.ts` delayed route; screen test      |
| Kept values, one map, panel, sheet, sizes  | `navigation.spec.ts`, desktop and phone              |
| Hidden map                                 | `MapHost.test.tsx`; `navigation.spec.ts` Tab         |
| Direct `/people` loads no map files        | `navigation.spec.ts` request log                     |
| Sign out, sign in: fresh map               | `navigation.spec.ts`                                 |
| Architecture rows                          | `npm run words`; review                              |
| NFR-03 checks, `proxy.ts`                  | `gate.test.ts`, `e2e/gate.spec.mts`                  |
| `Cache-Control` on `/people`               | `__tests__/next-config.test.ts`                      |
| NFR-01, #104, #261                         | `@perf` tests; `map-phone.spec.ts`, `Stage.test.tsx` |
| Dialog, menus, sign-out, People, toast     | Existing e2e specs                                   |
| No `next/*` in the kit                     | Review: `link.ts` imports React only                 |
| Boards, snapshots, states                  | `design:check`; `design` job                         |
