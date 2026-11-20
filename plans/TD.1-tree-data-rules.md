# Plan: TD.1: Tree data rules in fitness tests

- **Spec:** #1089
- **Requirement IDs:** [NFR-03](../docs/requirements.md#nfr-03), [NFR-10](../docs/requirements.md#nfr-10)
- **Status:** approved

## Approach

`privateJson()` calls `Response.json(body, init)` and then sets `Cache-Control: private, no-store` on the result, so a caller header cannot win. Four check functions join `scripts/safety.mts` as one safety row, and each returns `file: rule` lines as `scopingBreaks` does. Each check reads the syntax tree through `scripts/sources.mts`, so a comment or a string never counts. Each check has its own fitness test in `scripts/__tests__/`: a case for the repo, then one fixture for each acceptance check. A list holds each allowed exception: `JSON_EXEMPT`, `ADDRESS_FOLDERS`, `SEARCH_PARAMS` and `STORAGE_EXEMPT`. An entry in `JSON_EXEMPT` or `STORAGE_EXEMPT` gives its reason.

The four checks:

- **JSON routes:** a `route.*` file under `app/` that calls `Response.json` or `NextResponse.json` is a break, except a file in `JSON_EXEMPT` (`app/data/polities/route.ts`).
- **No-store pages:** the test reads the rules from `await nextConfig.headers()`. A rule counts if it sets `Cache-Control: private, no-store` and has no `has` or `missing` condition. A page that reads Tree data (D2) at a path that no such rule matches is a break. `routeOf` gives the path. A small matcher reads literal segments, `:name` and a final `:name*`. A rule in another syntax is a break, so the check fails closed.
- **Addresses:** a folder under `app/` whose name starts with `[` and is not in `ADDRESS_FOLDERS` (`[id]`) is a break. The check reads search parameter names in three forms: a destructure of `searchParams`, and `.get`, `.getAll` or `.has` with a string literal, on `searchParams` or on a `useSearchParams()` result. A name off `SEARCH_PARAMS` (`edit`, `returnTo`) is a break. Each other read of `searchParams` is a break, so the check fails closed.
- **Memory only:** a file under `app/` or `features/` with the identifier or string `localStorage`, `sessionStorage` or `indexedDB` is a break. An import that matches `@tanstack/*persist*` is a break. `STORAGE_EXEMPT` starts empty.

## Decisions

**D1 · Where `privateJson()` lives** · Decides: Tech lead

_Where does X go_ has no row for a response helper. #538 imports the helper for `/data/pins`, and #861 adds a Pin details route under `/data/`. #678 names no file.

- **A.** `app/data/private-json.ts`, beside the routes that send Tree data. The safety lists do not change. A route outside `app/data/` imports it from there.
- **B.** `server/http.mts`, which opens with `import 'server-only'`. `APP_SERVER_MODULES` and `SERVER_ONLY` in `scripts/safety.mts` each get one entry, so the scoping and boundary rows change. About 5 more lines.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Which pages read Tree data** · Decides: Tech lead

The Spec does not say how the check finds a page that reads Tree data. #678 Constraints say that the caching rule covers each new server action that carries Tree data. The Spec's Flagged concerns say that a Pin action of M2.14 (#539) answers on `/`, and that this Spec builds no rule for `/`.

- **A.** A page reads Tree data if it calls `treeAction` or `openTree`, or takes a value from an `app/` or `features/` module that does, at any depth. A server action counts. `/people/new` counts through `app/people/actions.ts`. When M2.14 gives `app/@map/page.tsx` a Pin action, the check fails until that Spec adds a `no-store` rule for `/` (about 10 lines). The import walk costs about 30 lines here.
- **B.** Only a call in the page file counts. About 10 lines. A page that reads through another module passes, such as `/people/new` today.
- **C.** As A, but a `'use server'` module does not count. The gap in the Flagged concern stays open. About 35 lines.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- **`next/dist/compiled/path-to-regexp` to match rules.** It is the parser Next uses, but it is an internal path that a Next upgrade can move. The small matcher fails closed on syntax it cannot read.
- **One ESLint rule for each check.** It shows a break in the editor, but each check then has two copies. The Spec asks for fitness tests.
- **A `no-store` rule on `/data/:path*` in place of the helper.** One rule covers all routes under `/data/`, but `/data/polities` then loses its cache, and a route outside `/data/` has no guard.

## Files that change

| File                                      | New / changed | What                                                                          |
| ----------------------------------------- | ------------- | ----------------------------------------------------------------------------- |
| `app/data/private-json.ts`                | New           | `privateJson()` (D1)                                                          |
| `app/data/__tests__/private-json.test.ts` | New           | The two helper checks                                                         |
| `scripts/safety.mts`                      | Changed       | Four check functions, the four lists, the matcher, the header comment         |
| `scripts/types.ts`                        | Changed       | The type of a header rule that the no-store check reads                       |
| `scripts/__tests__/json-routes.test.ts`   | New           | The repo, and a route that calls `Response.json`                              |
| `scripts/__tests__/no-store.test.ts`      | New           | The repo, a Tree page that no rule covers, the matcher (D2)                   |
| `scripts/__tests__/addresses.test.ts`     | New           | The repo, `[name]`, `[slug]`, `[...path]`, a parameter off the list           |
| `scripts/__tests__/memory-only.test.ts`   | New           | The repo, each storage name, a persistence import                             |
| `docs/architecture.md`                    | Changed       | One Patterns row with no library name; the fitness tests line names four more |

## Order of work

1. Write the two helper tests and see them fail. Then write `privateJson()` (D1).
2. For each check, write the fixture tests and see each fail on the rule. Then write the check in `scripts/safety.mts`.
3. Add the repo case to each test, and see each pass on `main`.
4. Add the Patterns row and the Enforcement line to `docs/architecture.md`. Change "three safety rows" to "four" in `scripts/safety.mts`.
5. Run the checks in `AGENTS.md` › Commands.

## Risks

- **No caller yet.** `privateJson()` has no caller on `main`, because `/data/polities` is exempt. M2.13.1 (#538) wires it.
- **JSON without `Response.json`.** A route that returns `new Response(JSON.stringify(…))` passes the check. No route does this. A rule for `JSON.stringify` in a route file costs about 5 lines. It is not built.
- **Size.** `scripts/safety.mts` grows by about 200 lines. Each function stays under 60 lines. If the diff passes 600 lines, the build stops ([too-big rule](README.md#too-big)).

## Proof

| Acceptance check                                                       | Proven by                                 |
| ---------------------------------------------------------------------- | ----------------------------------------- |
| `privateJson({})`: a JSON body and `private, no-store`                 | `app/data/__tests__/private-json.test.ts` |
| `privateJson` with status 404 and `public`: 404, `private, no-store`   | `app/data/__tests__/private-json.test.ts` |
| A route that calls `Response.json`, off the list                       | `scripts/__tests__/json-routes.test.ts`   |
| A Tree page at an address with no `no-store` rule                      | `scripts/__tests__/no-store.test.ts`      |
| A folder `[name]`, `[slug]` or `[...path]`                             | `scripts/__tests__/addresses.test.ts`     |
| A search parameter off the list                                        | `scripts/__tests__/addresses.test.ts`     |
| `localStorage`, `sessionStorage` or `indexedDB` in `app/`, `features/` | `scripts/__tests__/memory-only.test.ts`   |
| An import of a TanStack Query persistence package                      | `scripts/__tests__/memory-only.test.ts`   |
| The repo as it is passes each check                                    | The repo case of each of the four tests   |

## Out of scope

The Pins route and TanStack Query: M2.13.1 (#538). The check of `fetch` calls and the row text that names TanStack Query: TD.2 (#1091). A `no-store` rule for `/`: the M2.14 Spec that adds a Pin action to the map (D2: A).
