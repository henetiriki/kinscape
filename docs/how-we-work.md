# How we work on KinScape

Claude writes most drafts and code; people make the decisions. The **product owner** (PO) decides what the user sees. The **tech lead** decides how to build it.

## Intent, Spec, Plan

- **Intent:** the outcome wanted, and why. Each milestone in [the requirements](requirements.md#build-milestones) (M1–M6) has its own Intent issue, and it starts approved.
- **Spec:** one slice of an Intent: what will change and how we'll know it works. It is small enough for one pull request. The PO approves a Spec that changes what the user sees. The tech lead approves an engineering-only Spec. Its id is the milestone and a sequence (`M1.4`). An Intent outside the milestones gets a short prefix (`DM.1`).
- File a Spec with its Intent's number, not `M<n>` (except M0). Otherwise GitHub does not link it as a sub-issue. When its last Spec closes, a workflow sets the Intent to `status: ready-for-po`. The PO checks the outcome and closes it.
- **Bug, Chore:** take a Spec's path, with ids `B<n>` and `C<n>`.
- **Plan:** how to build a Spec, Bug or Chore: files, order of work, risks and proof. Commit it with the code as `plans/M0.1-hello-vercel.md` ([rules](../plans/README.md)).

## The loop

```
Intent ──► Design ──► Spec ──► Plan ──► Build & test ──► Preview ──► Live ──► Feedback ──┐
  ▲                                                                                      │
  └──────────────────────────────────────────────────────────────────────────────────────┘
```

| Stage            | What happens                                                                                                                                                                                                  | Who decides                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **Intent**       | A milestone's Intent issue, or a new idea the PO files                                                                                                                                                        | PO                            |
| **Design**       | A user-visible Intent's screens get designs on the canvas with the design system, which exports only `design/source/*.html`; a [workflow](../design/CANVAS.md#making-the-snapshots-and-jpgs) renders the JPGs | PO                            |
| **Spec**         | Claude slices the Intent and flags decisions; an undesigned screen is a Flagged concern                                                                                                                       | PO or tech lead (see _Spec_)  |
| **Plan**         | Claude plans each Spec, Bug or Chore                                                                                                                                                                          | Tech lead                     |
| **Build & test** | Claude writes code and tests; done only when checks pass                                                                                                                                                      | Tech lead reviews             |
| **Preview**      | A visible change gets a preview link to try against the acceptance checks                                                                                                                                     | One approval, PO or tech lead |
| **Live**         | A merge to `main` deploys production. See [Live](building.md#live).                                                                                                                                           | Tech lead                     |
| **Feedback**     | Bugs and ideas become issues                                                                                                                                                                                  | PO prioritises                |

## Which issue do I need?

| I want to...                                                                                                          | Open a                                                                                                 | Who approves | Starts as               |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------ | ----------------------- |
| Start the next milestone                                                                                              | Nothing: the tech lead runs `/refine spec <Intent number>`                                             | See _Spec_   | n/a                     |
| Add or change something not in a milestone                                                                            | **Intent**                                                                                             | PO           | `status: draft`         |
| Change a requirement, key term, number, priority or acceptance check in [the requirements](requirements.md)           | **Intent**                                                                                             | PO           | `status: draft`         |
| Fix links, anchors, headings, table layout or typos in [the requirements](requirements.md). Keep each `<a id>` anchor | **Chore**                                                                                              | Tech lead    | `status: ready-for-dev` |
| Report something broken                                                                                               | **Bug** (the tech lead may run `/refine bug <number>`, then sets `status: ready-for-agent`)            | Nobody       | `status: ready-for-dev` |
| Change tooling, CI, docs, process or settings                                                                         | **Chore** (tech lead; draft with `/refine chore`; [how it's built](building.md#specs-bugs-and-chores)) | Tech lead    | `status: ready-for-dev` |

## Drafting with Claude

The `/refine` skill asks questions until you agree, then drafts the issue.

**Before you start, choose Opus and High effort** (terminal: `/model opus`, `/effort high`).

- **PO:** run `/refine intent` and answer in plain language.
- **Tech lead:** run `/refine spec <Intent number>`.

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

A **Blocking** decision stops the plan until it has an answer. Any other decision can wait for the plan's approving review. Claude builds nothing while a decision is open.

Answer with `D1: B` or `D1: other, <your option>`:

- On an issue, start the comment with `@claude`, or nothing records it. In a plan PR's approving review, no `@claude` is needed.
- Claude records the answer. It rewrites the issue body in its prompt with one command: `gh issue edit <n> --body-file - <<'EOF'` (no pipes, `&&` or temp files).
- The rewrite adds `**Answer: B** (PO)` under the decision and strikes through (`~~…~~`) each option not chosen. It also rewords any Summary, Behaviour or Acceptance check that the answer changes.
- Claude records a plan decision that changes the Spec's text the same way ([plan rules](../plans/README.md)).
- Hard-to-reverse engineering choices go to the tech lead, even in a Spec the PO approves.

## Roles and labels: whose turn is it?

- **Product owner:** writes Intents, answers questions, approves Specs that change what the user sees, tries previews, reports bugs.
- **Tech lead:** approves plans and engineering-only Specs, sets `status: ready-for-agent`, reviews and merges pull requests, owns secrets.
- **Claude:** drafts Specs and plans, builds, tests and fixes review comments. Approves nothing.

Each issue has one **type** (`intent`, `spec`, `bug`, `chore`) and one **status** label; the status tells you whose turn it is.

| Label                     | Meaning                                                    | Ball is with                           |
| ------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| `status: draft`           | Still being written                                        | Author                                 |
| `status: ready-for-po`    | Needs the PO to read, answer, approve or try a preview     | **PO**                                 |
| `status: ready-for-dev`   | Approved; a person picks it up                             | Tech lead                              |
| `status: ready-for-agent` | Claude's turn; the tech lead's label starts a plan         | Claude                                 |
| `status: blocked`         | Waiting on someone outside the team, or a failed agent run | Whoever is named in the latest comment |

An open decision is not `blocked`: the ball is with whoever decides it. An open "blocked by" stops its plan and build. When it closes, `blocked` becomes `ready-for-dev`.
