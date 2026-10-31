# KinScape

[![CI](https://github.com/henetiriki/kinscape/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/henetiriki/kinscape/actions/workflows/ci.yml?query=branch%3Amain)
[![codecov](https://codecov.io/gh/henetiriki/kinscape/graph/badge.svg?token=V920DV844Y)](https://codecov.io/gh/henetiriki/kinscape)

A time-travelling landscape for your kin. Drag the slider from 1652 to today and watch colonies, republics and provinces come and go, while great-great-oupa stays put on the family farm.

> Borders move. Places don't.

## Where things are

- **[How we work](docs/how-we-work.md)**: the workflow, labels and who does what. Start here.
- **[Requirements](docs/requirements.md)**: the baseline, with requirement IDs.
- **[Design](design/DESIGN.md)**: how things look, with mockups.
- **[Repository settings](docs/repo-settings.md)**: GitHub settings, kept as code.
- **[Issues](https://github.com/henetiriki/kinscape/issues)**: Intents, Specs and bugs.
- **[AGENTS.md](AGENTS.md)**: what AI agents read at the start of every session (`CLAUDE.md` imports it).

**_Design mockup, not the built app._**

[![The KinScape sign-in screen: a map of South Africa with historical borders and a Pin on Farm Rietfontein](design/sign-in-desktop.jpg)](design/DESIGN.md)

Built as an experiment in the [AI-native SDLC](https://claude.com/resources/articles/the-ai-native-sdlc-playbook).

## How we work

Who acts at each stage and the `status:` label that hands it on. Detail: [how we work](docs/how-we-work.md). Every workflow: [workflows](.github/workflows/README.md).

```mermaid
flowchart TB
  subgraph People
    intent["<b>Intent</b><br>PO files a new idea"]
    bug["<b>Bug</b><br>PO files a defect"]
    chore["<b>Chore</b><br>Tech lead files upkeep"]
    design["<b>Design</b><br>PO designs the screens"]
    approveSpec["<b>Approve the Spec</b><br>PO if user-visible, tech lead if not"]
    ready["<b>Set ready-for-agent</b><br>Tech lead releases the work"]
    approvePlan["<b>Approve the plan</b><br>Tech lead reviews the plan PR"]
    steer["<b>Review and steer</b><br>Tech lead reviews, uses @claude"]
    preview["<b>Preview</b><br>PO tries the change"]
    merge["<b>Merge</b><br>Tech lead merges"]
    feedback["<b>Feedback</b><br>PO checks the outcome"]
  end
  subgraph CI [Claude and CI]
    spec["<b>Draft the Spec</b><br>Claude slices the Intent"]
    plan["<b>Plan agent</b><br>Claude drafts the plan PR"]
    build["<b>Build agent</b><br>Claude writes code and tests"]
    checks["<b>Checks and code review</b><br>CI and Claude review the PR"]
  end
  intent --> design --> spec
  spec -->|"status: ready-for-po or ready-for-dev"| approveSpec
  approveSpec -->|"status: ready-for-dev"| ready
  bug -->|"status: ready-for-dev"| ready
  chore -->|"status: ready-for-dev"| ready
  ready -->|"status: ready-for-agent"| plan
  plan -->|"draft plan PR"| approvePlan
  approvePlan --> build --> checks
  checks -->|"PR ready"| steer
  steer -->|"agent fixes"| checks
  checks -->|"visible change, status: ready-for-po"| preview --> merge
  steer --> merge
  merge -->|"last Spec closes, status: ready-for-po"| feedback
  feedback -.->|"new Intent or Bug"| intent
  feedback -.-> bug
```

## Contributions

This repo is a showcase: it takes no issues or pull requests from outside the team. To report a vulnerability, see [SECURITY.md](SECURITY.md).

## Licence

The code is [MIT](LICENSE). Third-party data keeps its own licences, listed in [`data/sources.json`](data/sources.json).
