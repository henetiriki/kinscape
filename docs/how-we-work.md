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
| **Build** | Claude writes an implementation plan, the tech lead approves it, then Claude writes the code and tests. Small departures are logged in the plan; big ones go back for re-approval | Pull request (`plans/`) | Tech lead approves the plan |
| **Test** | Automated checks run on every change; Claude only reports done when they pass | Pull request checks | Tech lead reviews |
| **Deploy** | Every pull request gets a preview link. The PO tries it against the acceptance checks | Preview link in the PR | PO says "looks right", tech lead merges |
| **Maintain** | Problems and new ideas are filed as issues and feed the next Intent | Bug / Intent issue | PO prioritises |

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

Work is grouped into the milestones from [the requirements](requirements.md#build-milestones), M0 to M6. Each milestone starts life as one Intent.
