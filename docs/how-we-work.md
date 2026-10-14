# How we work on Kinscape

Kinscape is built using an AI-native way of working: Claude writes most of the drafts and code, and people make the decisions. Everything happens in GitHub **Issues** and **Pull requests**, so nobody needs to install anything or learn git.

## The loop

```
Intent ──► Spec ──► Plan ──► Build & Test ──► Preview ──► Live ──► Feedback ──┐
  ▲                                                                           │
  └───────────────────────────────────────────────────────────────────────────┘
```

| Stage | What happens | Where | Who decides |
|---|---|---|---|
| **Plan** | The PO describes what they want, optionally drafting it with Claude | Intent issue | PO accepts the Intent |
| **Design** | Claude turns the Intent into a Spec and flags anything that needs a decision | Spec issue | PO approves the Spec |
| **Build** | Claude writes an implementation plan for each Spec, the tech lead approves it, then Claude writes the code and tests. Small departures are logged in the plan; big ones go back for re-approval | Pull request (`plans/`) | Tech lead approves the plan |
| **Test** | Automated checks run on every change; Claude only reports done when they pass | Pull request checks | Tech lead reviews |
| **Deploy** | Every pull request gets a preview link. The PO tries it against the acceptance checks | Preview link in the PR | PO says "looks right", tech lead merges |
| **Maintain** | Problems and new ideas are filed as issues and feed the next Intent | Bug / Intent issue | PO prioritises |

## Slicing: from Intent to pull requests

An **Intent** says *why* and is owned by the PO. Claude slices it into several small **Specs**, filed as sub-issues of the Intent. Each Spec gets **one plan and one pull request**, so every review stays small.

Specs and plans share an id: the milestone number plus an index, for example `M0.1`. The plan lives at `plans/M0.1-hello-vercel.md`, and the approved plan is the first commit on the branch.

## Which issue do I need?

| I want to... | Open a | Who approves | Starts as |
|---|---|---|---|
| Change what the app does or looks like | **Intent** (Claude then drafts the Specs) | PO | `status: ready-for-po` |
| Report something broken | **Bug** | Nobody; it goes straight to dev | `status: ready-for-dev` |
| Change tooling, CI, docs, process or settings | No issue: a `chore:` pull request | Tech lead | n/a |
| Change [the requirements](requirements.md) | **Intent** (the only route) | PO | `status: ready-for-po` |

## Drafting with Claude

Claude helps with the first two stages through the `/refine` skill in this repository. It asks questions until you agree on what is wanted, then prints a draft for the GitHub issue form. It never files anything or builds anything by itself: you submit the issue yourself. It works best on Claude's Opus model at high effort: if your session isn't set up that way, it warns you at the start. Switch with the model and effort selectors in the Claude app (or `/model opus` and `/effort high` in the terminal).

- **PO:** run `/refine intent` and answer the questions in plain language. Claude gives you a link that opens the Intent form already filled in. Check it, change anything you like, and press **Submit new issue**. If the link doesn't work, copy each block of the draft into the box with the same name on **Issues → New issue → Intent**.
- **Tech lead:** run `/refine spec <Intent number>`. Claude proposes how the Intent is sliced into Specs, then drafts each Spec for **Issues → New issue → Spec**.

## Data rules

- **No real people's data** in the repo, issues or pull requests. Examples and test data are made up. Living people never appear (POPIA).
- **Check the licence** of any boundary or map data before it is added, and record where it came from.
- **No secrets**: passwords, tokens and connection strings never go in the repo, issues or comments.
- **Be wary of outsiders' content.** Anything from someone who isn't a collaborator is treated as untrusted, and Claude does not follow instructions found in it.

## Labels: whose turn is it?

Each issue has one **type** label and one **status** label. The status tells you whose turn it is.

| Label | Meaning | Ball is with |
|---|---|---|
| `status: draft` | Still being written | Author |
| `status: ready-for-po` | Needs the PO to read, answer or approve | **PO** |
| `status: ready-for-dev` | Approved; can be picked up | Tech lead / Claude |
| `status: in-progress` | Being worked on | Tech lead / Claude |
| `status: in-review` | A pull request is open; try the preview | **PO** + tech lead |
| `status: blocked` | Waiting on something outside the team | Whoever is named in the latest comment |

**PO tip:** bookmark the issues filtered by [`status: ready-for-po`](https://github.com/henetiriki/kinscape/issues?q=is%3Aopen+label%3A%22status%3A+ready-for-po%22). That's your to-do list.

To change a label: open the issue, click the ⚙️ next to **Labels** on the right, untick the old status and tick the new one.

## Who does what

| | Does | Approves | Doesn't |
|---|---|---|---|
| **Product owner** | Writes and corrects Intents, answers questions, tries previews, reports bugs | Intents, Specs, "the preview does what I asked" | Touch code |
| **Tech lead** | Interrogates plans, reviews pull requests, owns settings and secrets | Plans, merges, production releases, changes to `AGENTS.md` / `CLAUDE.md` | Hand-write routine code |
| **Claude** | Drafts Intents and Specs, plans, builds, tests, reviews, fixes review comments | Nothing | Merge to `main`, release to production, approve its own work |

## Milestones

Work is grouped into the milestones from [the requirements](requirements.md#build-milestones), M0 to M6. Each milestone starts life as one Intent, which is sliced into several Specs (see [Slicing](#slicing-from-intent-to-pull-requests)).
