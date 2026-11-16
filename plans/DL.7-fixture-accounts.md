# Plan: DL.7: Fixture Accounts in the memory adapters

- **Spec:** #900
- **Requirement IDs:** [NFR-03](../docs/requirements.md#nfr-03), [NFR-09](../docs/requirements.md#nfr-09)
- **Status:** approved

## Approach

A seed Tree of `memoryStore` gets optional `persons` and `relationships`. The store puts them in its maps at version 1. Their types (`PersonInput`, `RelationshipInput`) hold parsed UUID ids, so a seed row has a UUID id.

A second argument of `memoryStore` lists read-only Tree ids. Its four write methods check that list first. Then `addPerson` gives `undefined`, and the other three give `not-found`, as for a Tree that the Account may not access.

A new file `server/auth/fixtures.mts` holds `FIXTURES`: one row for each fixture Account, with email, password, issuer, subject, Account id and one Tree. Like `synthetic.mts`, it has no `server-only`, so DL.8 (#902) can import it in `parseConfig` and in `e2e/`. Only the memory branch of `appAdapters` adds `FIXTURES` to the sign-in and to the store, and it gives their Tree ids as read-only. The `KINSCAPE_MEMORY_SIGN_IN` branch keeps `[SYNTHETIC]`.

The one fixture is `researcher@example.com`, with password `researcher-password` and an empty Tree. The password differs from `example-password` (design state `sign-in-wrong-password`) and `not-the-password` (`e2e/sign-in.spec.ts`), so both stay wrong-details sign-ins.

## Decisions

**D1 · Where the browser test of check 1 runs** · Decides: Tech lead

The CI `e2e` job uses `KINSCAPE_MEMORY_SIGN_IN`, so it has no fixture Account. The CI `design` job uses the memory adapters, but runs only `design-check.spec.ts`. DL.8 (#902) makes that job sign in as `researcher@example.com`. Where does the browser test of check 1 run?

- **A.** A new `e2e/fixture-accounts.spec.ts` in the `chromium` project. `playwright.config.ts` ignores it when `KINSCAPE_MEMORY_SIGN_IN=1`. A local `npm run e2e` runs it. In CI, `server/__tests__/adapters.test.ts` proves check 1 on the server until DL.8.
- **B.** The same spec in the `design` project, so the CI `design` job runs it. `npm run design:check` then also runs a test that is not a design check.
- **C.** No browser test. `adapters.test.ts` alone proves check 1.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- A `readOnly` flag on the seed Tree type. The database contract harness cannot honour it, so the flag stays with `memoryStore`.
- A seed that writes through `addPerson`. Those methods are async and `memoryStore` is not, and a read-only Tree refuses them.

## Files that change

| File                                            | New / changed | What                                                                                        |
| ----------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `lib/domain/trees/types.ts`                     | Changed       | `SeedTree`: a `Tree` with optional `persons` and `relationships`; `SeedAccount` uses it     |
| `server/trees/memory-store.mts`                 | Changed       | Seed rows; read-only Tree ids refuse the four writes                                        |
| `server/trees/__tests__/contract.ts`            | Changed       | A seed Tree with two People and one Relationship reads back through `openTree`              |
| `server/trees/__tests__/database-store.test.ts` | Changed       | The harness adds seed rows with `databaseStore(db).addPerson` and `addRelationship`         |
| `server/trees/__tests__/memory-store.test.ts`   | Changed       | Read-only Tree refuses each write and does not change; two Accounts see only their own rows |
| `server/auth/fixtures.mts`                      | New           | `FIXTURES` with `researcher@example.com`                                                    |
| `server/adapters.mts`                           | Changed       | The memory branch adds `FIXTURES`                                                           |
| `server/__tests__/adapters.test.ts`             | Changed       | Checks 1 to 4 and 7 on the server                                                           |
| `e2e/fixture-accounts.spec.ts`                  | New           | Check 1 in the browser (D1)                                                                 |
| `playwright.config.ts`                          | Changed       | Ignore that spec under `KINSCAPE_MEMORY_SIGN_IN` (D1: A)                                    |
| `e2e/sign-in.spec.ts`, `e2e/design-states.ts`   | Changed       | The comment "researcher has no Account" says that its fixture password differs              |
| `docs/glossary.md`                              | Changed       | "Fixture Account" loses "Planned (#893)"                                                    |
| `docs/infrastructure.md`                        | Changed       | `KINSCAPE_MEMORY_ADAPTERS` also adds the fixture Accounts                                   |
| `plans/DL.7-fixture-accounts.md`                | New           | This plan                                                                                   |

## Order of work

1. Write the contract test for seed rows, and see it fail on the rows. Add `SeedTree`, the memory seed and the database harness.
2. Write the read-only and NFR-09 tests of `memoryStore`, and see them fail. Add the read-only list.
3. Add `fixtures.mts`. Write the `appAdapters` tests, see them fail, and change `adapters.mts`.
4. Add the browser test as D1 says. Change the two e2e comments.
5. Edit the glossary and infrastructure rows.
6. Run the checks in `AGENTS.md` › Commands. Paste the output in Evidence.

## Risks

- **The sign-in throttle.** Five failures in 15 minutes lock an email. A local e2e run types a wrong password for `researcher@example.com` twice, and Playwright retries add more. Then the fixture sign-in can fail. The new spec signs in once; if the throttle blocks it, it fails with the throttle message, which the log shows.
- **A seed Relationship whose Persons are not in the Tree.** The memory seed does not check the ends; the database harness fails on its foreign key. Only `FIXTURES` seeds the app, and DL.22 adds rows to it. A check costs about 10 lines; I add none.
- **A read-only refusal on a screen.** The action gives `not-found`. The Spec gives that screen to DL.25.

## Proof

| Acceptance check                                       | Proven by                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| 1. Fixture sign-in reaches `/`; `/people` is empty     | `adapters.test.ts`; `e2e/fixture-accounts.spec.ts` (D1)       |
| 2. Synthetic Account works and has no fixture data     | `adapters.test.ts`; `e2e/sign-in.spec.ts`                     |
| 3. Memory sign-in alone refuses the fixture            | `adapters.test.ts`                                            |
| 4. Neither flag: no fixture Account                    | `adapters.test.ts`: the fixture email goes to Supabase        |
| 5. `VERCEL=1` with memory adapters throws              | `server/__tests__/env.test.ts` (no change)                    |
| 6. Seed rows read back through `openTree`              | `contract.ts` on the memory and database adapters             |
| 7. A fixture save is refused, the Tree does not change | `memory-store.test.ts`; `adapters.test.ts` through `openTree` |
| 8. Neither Account sees the other's rows (NFR-09)      | `memory-store.test.ts`                                        |
| 9. No "Planned (#893)" on the glossary row             | The diff                                                      |
| 10. Tests, types, e2e, 100% coverage                   | Output in Evidence                                            |

## Out of scope

Each item of the Spec's "Out of scope / carried forward".
