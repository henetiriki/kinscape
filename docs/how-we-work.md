# How we work on KinScape

Claude writes most drafts and code; people make the decisions. Everything happens in GitHub **Issues** and **Pull requests**. The **product owner** (PO) decides what the user sees; the **tech lead** decides how it is built and merges it.

More detail: [Building and shipping](building.md), [Dependencies](dependencies.md), [Repository settings](repo-settings.md), [Security rules](security.md), [Design](../design/DESIGN.md).

## Intent, Spec, Plan

- **Intent:** the outcome wanted, and why. Each milestone in [the requirements](requirements.md#build-milestones) (M1–M6) has its own Intent issue, filed already approved. M0 predates this and has none.
- **Spec:** one slice of an Intent: what will change and how we'll know it works, small enough for one pull request. The PO approves a Spec that changes what the user sees; the tech lead approves an engineering-only one. Its id is the milestone and a sequence (`M1.4`); an Intent outside the milestones gets a short prefix (`DM.1`).
- A Spec filed with an Intent number becomes a sub-issue of that Intent automatically. File it with the Intent's number, not `M<n>` (except for M0), or it isn't linked. When its last Spec closes, a workflow sets the Intent to `status: ready-for-po`; the PO checks the outcome and closes it.
- **Bug:** takes the same path as a Spec, with the id `B<issue number>`.
- **Plan:** how a Spec is built: files, order of work, risks and proof. Committed with the code as `plans/M0.1-hello-vercel.md` ([rules](../plans/README.md)).

## The loop

```
Intent ──► Design ──► Spec ──► Plan ──► Build & test ──► Preview ──► Live ──► Feedback ──┐
  ▲                                                                                      │
  └──────────────────────────────────────────────────────────────────────────────────────┘
```

| Stage            | What happens                                                                                                                                                             | Who decides                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| **Intent**       | A milestone's Intent issue, or a new idea the PO files                                                                                                                   | PO                            |
| **Design**       | Screens a user-visible Intent needs are designed in Claude Design, which exports only `design/source/*.html`; a [workflow](../design/DESIGN.md#screens) renders the JPGs | PO                            |
| **Spec**         | Claude slices the Intent and flags decisions; an undesigned screen is a Flagged concern                                                                                  | PO or tech lead (see _Spec_)  |
| **Plan**         | Claude plans each Spec                                                                                                                                                   | Tech lead                     |
| **Build & test** | Claude writes code and tests; done only when checks pass                                                                                                                 | Tech lead reviews             |
| **Preview**      | Each pull request gets a preview link to try against the acceptance checks                                                                                               | One approval, PO or tech lead |
| **Live**         | Merging to `main` deploys production; [rollback](building.md#live)                                                                                                       | Tech lead merges              |
| **Feedback**     | Bugs and ideas become issues                                                                                                                                             | PO prioritises                |

## Which issue do I need?

| I want to...                                  | Open a                                                     | Who approves                   | Starts as               |
| --------------------------------------------- | ---------------------------------------------------------- | ------------------------------ | ----------------------- |
| Start the next milestone                      | Nothing: the tech lead runs `/refine spec <Intent number>` | See _Spec_                     | n/a                     |
| Add or change something not in a milestone    | **Intent**                                                 | PO                             | `status: draft`         |
| Change [the requirements](requirements.md)    | **Intent** (the only route)                                | PO                             | `status: draft`         |
| Report something broken                       | **Bug**                                                    | Nobody; the tech lead plans it | `status: ready-for-dev` |
| Change tooling, CI, docs, process or settings | No issue: a [`chore:` pull request](building.md#chores)    | Tech lead                      | n/a                     |

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

Answer with `D1: B` or `D1: other, <your option>`. On an issue, start the comment with `@claude`, or nothing records it; in a plan PR's approving review, no `@claude` is needed. Claude records it by rewriting the issue body in its prompt with one command, `gh issue edit <n> --body-file - <<'EOF'` (no pipes, `&&` or temp files): it adds `**Answer: B** (PO)` under the decision, strikes through (`~~…~~`) each option not chosen, and rewords any Summary, Behaviour or Acceptance check it changes. A plan decision that changes the Spec's text is recorded the same way ([plan rules](../plans/README.md)). Nothing is built while one is open. Hard-to-reverse engineering choices go to the tech lead, even in a Spec the PO approves.

## Roles and labels: whose turn is it?

- **Product owner:** writes Intents, answers questions, approves Specs that change what the user sees, tries previews, reports bugs.
- **Tech lead:** approves plans and engineering-only Specs, sets `status: ready-for-agent`, reviews and merges pull requests, owns settings, secrets and `AGENTS.md` / `CLAUDE.md`.
- **Claude:** drafts Specs and plans, builds, tests and fixes review comments. Approves nothing, and never merges or releases to production.

Each issue has one **type** (`intent`, `spec`, `bug`) and one **status** label; the status tells you whose turn it is. A pull request the PO can try carries `status: ready-for-po`.

| Label                     | Meaning                                                    | Ball is with                           |
| ------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| `status: draft`           | Still being written                                        | Author                                 |
| `status: ready-for-po`    | Needs the PO to read, answer, approve or try a preview     | **PO**                                 |
| `status: ready-for-dev`   | Approved; a person picks it up                             | Tech lead                              |
| `status: ready-for-agent` | Starts Claude's plan; only the tech lead sets it           | Claude                                 |
| `status: blocked`         | Waiting on someone outside the team, or a failed agent run | Whoever is named in the latest comment |

An open decision is not `blocked`: the ball is with whoever decides it.
