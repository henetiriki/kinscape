# Plan: C499: Move ESLint to 10

- **Spec:** #499
- **Status:** approved

## Approach

Pin `eslint` to `10.14.0`, add `eslint-plugin-jsx-a11y` `6.10.2` as a devDependency, and add nested `overrides` (`{ "eslint": "$eslint" }`) for the three plugins, sorted beside the C497 entries. Delete any nested plugin entries (and `eslint-plugin-import`'s nested `debug`) from `package-lock.json`, then `npm install`, so the plugins stay hoisted at their current versions. Lift the `eslint` hold in `.github/dependabot.yml` and `docs/dependencies.md`.

## Decisions

**D1 · Overrides table wording** · Decides: Tech lead

The table's intro says overrides "replace deprecated transitive packages", and its middle column is _Clears_; these three lift a peer range instead.

- **A.** Intro: "replace deprecated transitive packages or widen a stale `eslint` peer range"; _Clears_ reads "`eslint` 10 peer conflict"; _Remove when_ reads "It accepts `eslint` 10".
- **B.** Rename _Clears_ to _Why_ and reword the C497 rows to fit.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                     | What                                                |
| ------------------------ | --------------------------------------------------- |
| `package.json`           | `eslint` 10.14.0, jsx-a11y devDependency, overrides |
| `package-lock.json`      | Refreshed                                           |
| `.github/dependabot.yml` | Drop the `eslint` ignore                            |
| `docs/dependencies.md`   | Drop the held row; three override rows (D1)         |

## Order of work

1. Edit `package.json` and the lockfile, `npm install`, then `npm ci` and `npm ls`.
2. Edit `dependabot.yml` and the doc; run `npm run words`.
3. Run the checks.

## Deviations

- `npm ls` was denied; the lockfile versions replace both `npm ls` proofs.

## Risks

- npm may reject an override keyed on a direct dependency (`eslint-plugin-jsx-a11y`); if so, stop and ask.
- An ESLint 10 rule change could flag code; fixing code is in scope, changing `eslint.config.mjs` isn't, so stop and ask.

## Proof

| Acceptance check                    | Proven by                       |
| ----------------------------------- | ------------------------------- |
| `eslint` 10.14.0, no invalid peers  | `npm ls eslint`, pasted         |
| Plugins hoisted, versions unchanged | `npm ls` of each plugin, pasted |
| No `eslint` deprecation warning     | `npm ci` output, pasted         |
| Checks pass                         | Pasted output                   |
| Hold lifted, three Overrides rows   | The diff                        |
