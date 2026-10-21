# Dependencies

Dependabot opens security PRs when an advisory lands and routine updates for npm packages and GitHub Actions weekly, labelled `dependencies`. Nothing auto-merges: the tech lead reviews and merges each one once CI passes, within:

| Severity         | Deadline              |
| ---------------- | --------------------- |
| Critical or high | 3 days                |
| Medium           | 2 weeks               |
| Low              | The next weekly batch |

## Held packages

Dependabot ignores the major version of these. To lift a hold, remove its entry from `.github/dependabot.yml` and its row here in the same PR.

| Package       | Held at        | Why                                               | Lift when                                                      |
| ------------- | -------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `eslint`      | 9              | `eslint-config-next`'s plugins don't accept 10    | `eslint-config-next` supports 10                               |
| `typescript`  | 6              | typescript-eslint needs the JS API, which 7 omits | typescript-eslint supports 7                                   |
| `@types/node` | `.nvmrc` major | Types must match the Node version we run          | `.nvmrc` moves; bump both in one PR (Dependabot can't read it) |

## The review plugin

Dependabot can't track the pinned code-review plugin in `.github/claude-plugins`. Each Monday a workflow checks it; when it has newer changes, it files an issue. The tech lead reviews the changes and bumps the pin by hand.
