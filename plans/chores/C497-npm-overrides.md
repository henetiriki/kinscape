# Plan: C497: Clear four npm deprecation warnings with overrides

- **Spec:** #497
- **Status:** approved

## Approach

Add top-level `overrides` for `better-sqlite3` (`13.0.3`), `geographiclib` (`npm:geographiclib-geodesic@2.2.0`) and `glob` (`14.0.3`) beside `react-dom-18`, sorted, then `npm install` to refresh the lockfile. Besides `fontnik`, `mproj` and `mapshaper`, only `@ngageoint/geopackage` asks for one (`better-sqlite3` 13.0.3, already), so top-level entries touch nothing else. `allowScripts` stays as it is.

## Decisions

**D1 · Fitting the Overrides table in the 200-word budget** · Decides: Tech lead

`docs/dependencies.md` has about 170 words; a heading, a header row and three rows add about 30-50.

- **A.** Terse rows, no intro line; if still over, stop and ask.
- **B.** Raise the budget to 250 in `scripts/word-count.mts`, and add a line that Dependabot doesn't update `overrides`.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Alternatives considered

- Overrides nested under each parent (`"fontnik": { "glob": … }`): narrower, but longer; no other package asks for these.

## Files that change

| File                   | What                      |
| ---------------------- | ------------------------- |
| `package.json`         | Three `overrides` entries |
| `package-lock.json`    | Refreshed                 |
| `docs/dependencies.md` | Overrides table (D1)      |

## Order of work

1. Edit `package.json`, run `npm install`, then `npm ci` and `npm ls`.
2. Add the table; run `npm run words`.
3. Run the checks and `npm run map:prepare`.

## Risks

- `npm run map:prepare` needs network; if it can't run here, the PR says so and the tech lead runs it.

## Proof

| Acceptance check                            | Proven by                        |
| ------------------------------------------- | -------------------------------- |
| Only the `eslint` warning                   | `npm ci` output, pasted          |
| `npm ls` shows only the three               | `npm ls` output, pasted          |
| Checks pass                                 | Pasted output                    |
| `public/map/`, `data/boundaries/` unchanged | `git status` after `map:prepare` |
| Overrides table, three rows                 | The diff                         |
