# Dependencies

Dependabot opens security PRs when an advisory lands. It opens weekly updates for npm packages and GitHub Actions. It labels each PR `dependencies`. Nothing auto-merges: the tech lead reviews and merges each PR once CI passes, within:

| Severity         | Deadline              |
| ---------------- | --------------------- |
| Critical or high | 3 days                |
| Medium           | 2 weeks               |
| Low              | The next weekly batch |

## Held packages

Dependabot ignores the major version of these. To lift a hold, remove its entry from `.github/dependabot.yml` and its row here in the same PR.

| Package       | Held at        | Why                                               | Lift when                                                      |
| ------------- | -------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `typescript`  | 6              | typescript-eslint needs the JS API, which 7 omits | typescript-eslint supports 7                                   |
| `@types/node` | `.nvmrc` major | Types must match the Node version we run          | `.nvmrc` moves; bump both in one PR (Dependabot can't read it) |
| `postgres`    | 17             | Same major as the hosted databases                | The hosted databases move; bump the Dockerfile in the same PR  |

## Overrides

These `package.json` `overrides` replace deprecated transitive packages, widen a stale `eslint` peer range or lift a vulnerable transitive version. Dependabot doesn't update them; bump by hand.

| Package                  | Clears                                                                                                        | Remove when                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `better-sqlite3`         | `prebuild-install`                                                                                            | `mapshaper` moves to `better-sqlite3` 13                                  |
| `eslint-plugin-import`   | `eslint` 10 peer conflict                                                                                     | It accepts `eslint` 10                                                    |
| `eslint-plugin-jsx-a11y` | `eslint` 10 peer conflict                                                                                     | It accepts `eslint` 10                                                    |
| `eslint-plugin-react`    | `eslint` 10 peer conflict                                                                                     | It accepts `eslint` 10                                                    |
| `geographiclib`          | `geographiclib`                                                                                               | `mproj` drops `geographiclib`                                             |
| `glob`                   | `inflight`, `glob@7.2.3`                                                                                      | `fontnik` drops `glob` 7                                                  |
| `minimatch`              | `10.2.6` under `eslint`, `@eslint/config-array`, `@typescript-eslint/typescript-estree` (GHSA-g3hv-75wg-m249) | All three require `minimatch` ≥ 11.0.1 (eslint/eslint#21476 is the first) |

## The review plugin

Dependabot can't track the pinned code-review plugin in `.github/claude-plugins`. Each Monday a workflow checks it and files an issue for newer changes. The tech lead reviews the changes and bumps the pin by hand.
