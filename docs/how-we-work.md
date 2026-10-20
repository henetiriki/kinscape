# How we work on KinScape

Claude writes most drafts and code; people make the decisions. Everything happens in GitHub **Issues** and **Pull requests**.

## Intent, Spec, Plan

- **Intent:** the outcome wanted, and why. Each milestone in [the requirements](requirements.md#build-milestones) (M1–M6) has its own Intent issue, filed already approved. M0 predates this and has none.- **Spec:** one slice of an Intent: what will change and how we'll know it works, small enough for one pull request. The PO approves a Spec that changes what the user sees; the tech lead approves an engineering-only one.
- A Spec filed with an Intent number becomes a sub-issue of that Intent automatically. When its last Spec closes, a workflow sets the Intent to `status: ready-for-po`; the PO checks the outcome and closes it.
- **Plan:** how a Spec is built: files, order of work, risks and proof. Committed with the code as `plans/M0.1-hello-vercel.md` ([rules](../plans/README.md)).

## The loop

```
Intent ──► Spec ──► Plan ──► Build & Test ──► Preview ──► Live ──► Feedback ──┐
  ▲                                                                           │
  └───────────────────────────────────────────────────────────────────────────┘
```

| Stage            | What happens                                                               | Who decides                             |
| ---------------- | -------------------------------------------------------------------------- | --------------------------------------- |
| **Intent**       | A milestone's Intent issue, or a new idea the PO files                     | PO                                      |
| **Spec**         | Claude slices the Intent and flags decisions                               | PO or tech lead (see _Spec_)            |
| **Plan**         | Claude plans each Spec                                                     | Tech lead                               |
| **Build & test** | Claude writes code and tests; done only when checks pass                   | Tech lead reviews                       |
| **Preview**      | Each pull request gets a preview link to try against the acceptance checks | PO says "looks right"; tech lead merges |
| **Feedback**     | Bugs and ideas become issues                                               | PO prioritises                          |

## Which issue do I need?

| I want to...                                  | Open a                                                     | Who approves                    | Starts as               |
| --------------------------------------------- | ---------------------------------------------------------- | ------------------------------- | ----------------------- |
| Start the next milestone                      | Nothing: the tech lead runs `/refine spec <Intent number>` | See _Spec_                      | n/a                     |
| Add or change something not in a milestone    | **Intent**                                                 | PO                              | `status: draft`         |
| Change [the requirements](requirements.md)    | **Intent** (the only route)                                | PO                              | `status: draft`         |
| Report something broken                       | **Bug**                                                    | Nobody; it goes straight to dev | `status: ready-for-dev` |
| Change tooling, CI, docs, process or settings | No issue: a `chore:` pull request                          | Tech lead                       | n/a                     |

## Drafting with Claude

The `/refine` skill asks questions until you agree on what is wanted, then drafts the issue. It files and builds nothing.

**Before you start, choose Opus and High effort** in the app's selectors (terminal: `/model opus`, `/effort high`); the app ignores the skill's own setting.

- **PO:** run `/refine intent` and answer in plain language. Claude gives you a link that opens the Intent form filled in.
- **Tech lead:** run `/refine spec <Intent number>`, using the milestone's Intent issue. Claude proposes the slices, then drafts each Spec.

## Decisions

Write each PO or tech-lead decision like this:

```
**D1 · <title>** · Decides: PO | Tech lead
<question>
- **A.** <option and what follows>
- **B.** …
- **Other:** your own.
Recommended: A, because …
```

Answer with `D1: B` or `D1: other, <your option>` in a comment or review. Claude records it under the decision. Nothing is built while one is open. Hard-to-reverse engineering choices go to the tech lead, even in a Spec the PO approves.

## Building a Spec

Setting an approved Spec to `status: ready-for-agent` starts Claude in GitHub Actions. It opens a draft pull request with the plan; comment `@claude` there to change it. Answer its open [decisions](#decisions) in your approving review: Claude records them, builds, rewrites the PR description and marks it ready.

Claude reviews each pull request automatically, except drafts, Dependabot PRs and PRs that change only `docs/` or `plans/`.

## Dependency updates

Dependabot opens security PRs when an advisory lands and routine updates weekly, labelled `dependencies`. Nothing auto-merges: the tech lead reviews and merges each one once CI passes, within:

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

## Roles and labels: whose turn is it?

- **Product owner:** writes Intents, answers questions, approves Specs that change what the user sees, tries previews, reports bugs.- **Tech lead:** approves plans and engineering-only Specs, reviews and merges pull requests, owns settings, secrets and `AGENTS.md` / `CLAUDE.md`.- **Claude:** drafts Specs and plans, builds, tests and fixes review comments. Approves nothing, and never merges or releases to production.

Each issue has one **type** and one **status** label; the status tells you whose turn it is.

| Label                     | Meaning                                                | Ball is with                           |
| ------------------------- | ------------------------------------------------------ | -------------------------------------- |
| `status: draft`           | Still being written                                    | Author                                 |
| `status: ready-for-po`    | Needs the PO to read, answer, approve or try a preview | **PO**                                 |
| `status: ready-for-dev`   | Approved; a person picks it up                         | Tech lead                              |
| `status: ready-for-agent` | Starts Claude's plan                                   | Claude                                 |
| `status: blocked`         | Waiting on something external, or a decision Spec      | Whoever is named in the latest comment |
