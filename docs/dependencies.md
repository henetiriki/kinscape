# Dependencies

Dependabot opens security PRs when an advisory lands. It opens weekly updates for npm packages, GitHub Actions and the CI images. It labels each PR `dependencies`. Nothing auto-merges: the tech lead reviews and merges each PR once CI passes, within:

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

## The Playwright image

One Dependabot PR moves `@playwright/test` and the image. Before the merge, run **Design: Render snapshots** on its branch.

## Overrides

Dependabot doesn't update these `package.json` `overrides`. Bump them by hand.

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

Dependabot can't track the code-review plugin pin in `.github/claude-plugins`. A Monday workflow files an issue for newer changes. The tech lead bumps the pin by hand.
