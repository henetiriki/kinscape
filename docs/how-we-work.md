# How we work on Kinscape

Claude writes most drafts and code; people make the decisions. Everything happens in GitHub **Issues** and **Pull requests**, so nobody needs to install anything or learn git.

## Intent, Spec, Plan

- **Intent:** the outcome wanted, and why. Each milestone in [the requirements](requirements.md#build-milestones) (M0–M6) is an Intent the PO has already approved.- **Spec:** one slice of an Intent: what will change and how we'll know it works, small enough for one pull request. Ids look like `M0.1`. The PO approves a Spec that changes what the user sees; the tech lead approves an engineering-only one.
- When the last Spec filed as a sub-issue of an Intent closes, a workflow sets the Intent to `status: ready-for-po`. The PO checks the outcome and closes it.
- **Plan:** how a Spec is built: files, order of work, risks and proof. Committed with the code as `plans/M0.1-hello-vercel.md` ([rules](../AGENTS.md#plans)).

## The loop

```
Intent ──► Spec ──► Plan ──► Build & Test ──► Preview ──► Live ──► Feedback ──┐
  ▲                                                                           │
  └───────────────────────────────────────────────────────────────────────────┘
```

| Stage            | What happens                                                               | Who decides                             |
| ---------------- | -------------------------------------------------------------------------- | --------------------------------------- |
| **Intent**       | A milestone, or a new idea the PO files as an Intent issue                 | PO                                      |
| **Spec**         | Claude slices the Intent and flags decisions                               | PO or tech lead (see _Spec_)            |
| **Plan**         | Claude plans each Spec                                                     | Tech lead                               |
| **Build & test** | Claude writes code and tests; done only when checks pass                   | Tech lead reviews                       |
| **Preview**      | Each pull request gets a preview link to try against the acceptance checks | PO says "looks right"; tech lead merges |
| **Feedback**     | Bugs and ideas become issues                                               | PO prioritises                          |

## Which issue do I need?

| I want to...                                  | Open a                                          | Who approves                    | Starts as               |
| --------------------------------------------- | ----------------------------------------------- | ------------------------------- | ----------------------- |
| Start the next milestone                      | Nothing: the tech lead runs `/refine spec M<n>` | See _Spec_                      | n/a                     |
| Add or change something not in a milestone    | **Intent**                                      | PO                              | `status: draft`         |
| Change [the requirements](requirements.md)    | **Intent** (the only route)                     | PO                              | `status: draft`         |
| Report something broken                       | **Bug**                                         | Nobody; it goes straight to dev | `status: ready-for-dev` |
| Change tooling, CI, docs, process or settings | No issue: a `chore:` pull request               | Tech lead                       | n/a                     |

## Drafting with Claude

The `/refine` skill asks questions until you agree on what is wanted, then drafts the issue. It never files or builds anything: you submit the issue yourself.

**Before you start, choose Opus and High effort** in the Claude app's model and effort selectors (in the terminal: `/model opus` and `/effort high`). The project default uses Opus only in plan mode, and the app ignores the skill's own model setting.

- **PO:** run `/refine intent` and answer in plain language. Claude gives you a link that opens the Intent form filled in, and tells you what to do if it doesn't work.
- **Tech lead:** run `/refine spec M<n>` or `/refine spec <Intent number>`. Claude proposes the slices, then drafts each Spec.

## Building a Spec

For a `status: ready-for-dev` Spec, the tech lead starts a new session in plan mode and says `Pick up Spec M0.1 (#<issue>)`. Accepting the plan approves it; Claude then builds and opens the pull request.

Claude reviews each pull request automatically, except drafts, Dependabot PRs and PRs that change only `docs/` or `plans/`.

## Dependency updates

Dependabot opens security PRs as soon as an advisory lands and routine updates weekly, labelled `dependencies`. Nothing auto-merges: the tech lead reviews and merges each one once CI passes, within:

| Severity         | Deadline              |
| ---------------- | --------------------- |
| Critical or high | 3 days                |
| Medium           | 2 weeks               |
| Low              | The next weekly batch |

### Held packages

Dependabot ignores the major version of these. To lift a hold, remove its entry from `.github/dependabot.yml` and its row here in the same PR.

| Package       | Held at        | Why                                               | Lift when                                                      |
| ------------- | -------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `eslint`      | 9              | `eslint-config-next`'s plugins don't accept 10    | `eslint-config-next` supports 10                               |
| `typescript`  | 6              | typescript-eslint needs the JS API, which 7 omits | typescript-eslint supports 7                                   |
| `@types/node` | `.nvmrc` major | Types must match the Node version we run          | `.nvmrc` moves; bump both in one PR (Dependabot can't read it) |

## Data rules

Everyone follows [AGENTS.md › Data rules](../AGENTS.md#data-rules).

## Roles and labels: whose turn is it?

- **Product owner:** writes Intents, answers questions, approves Specs that change what the user sees, tries previews, reports bugs.- **Tech lead:** approves plans and engineering-only Specs, reviews and merges pull requests, owns settings, secrets and `AGENTS.md` / `CLAUDE.md`.- **Claude:** drafts Specs and plans, builds, tests and fixes review comments. Approves nothing, and never merges or releases to production.

Each issue has one **type** label and one **status** label. The status tells you whose turn it is.

| Label                   | Meaning                                                | Ball is with                           |
| ----------------------- | ------------------------------------------------------ | -------------------------------------- |
| `status: draft`         | Still being written                                    | Author                                 |
| `status: ready-for-po`  | Needs the PO to read, answer, approve or try a preview | **PO**                                 |
| `status: ready-for-dev` | Approved; can be picked up                             | Tech lead / Claude                     |
| `status: blocked`       | Waiting on something outside the team                  | Whoever is named in the latest comment |

**PO tip:** bookmark the issues filtered by [`status: ready-for-po`](https://github.com/henetiriki/kinscape/issues?q=is%3Aopen+label%3A%22status%3A+ready-for-po%22): your to-do list.
