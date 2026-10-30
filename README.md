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

Who acts at each stage, the `status:` label that hands it on, and the workflow (⚙) that runs. Detail: [how we work](docs/how-we-work.md). Every workflow: [workflows](.github/workflows/README.md).

```mermaid
flowchart TD
  subgraph PO [Product owner]
    intent["Intent<br>files the Intent"]
    design["Design<br>designs the screens in Claude Design"]
    approveSpec["approves a user-visible Spec"]
    preview["Preview<br>tries the change against the acceptance checks"]
    feedback["Feedback<br>checks the outcome, closes the Intent"]
  end
  subgraph TL [Tech lead]
    spec["Spec<br>slices the Intent with /refine spec"]
    agent["sets status: ready-for-agent"]
    approvePlan["Plan<br>approves the plan PR"]
    merge["Live<br>reviews and merges"]
  end
  subgraph AI [Claude]
    plan["drafts the plan PR<br>⚙ Claude: Plan"]
    build["Build & test<br>⚙ Claude: Build, CI, Claude: Code Review"]
    respond["answers @claude comments<br>⚙ Claude: Code"]
  end
  intent --> design --> spec
  spec -->|"user-visible<br>status: ready-for-po"| approveSpec
  approveSpec -->|"status: ready-for-dev"| agent
  spec -->|"engineering-only<br>status: ready-for-dev"| agent
  agent --> plan --> approvePlan
  approvePlan -.->|"@claude"| respond -.->|revises| plan
  approvePlan -->|approving review| build
  build -->|"visible change<br>status: ready-for-po"| preview --> merge
  build -->|nothing visible| merge
  merge -->|"last Spec closes: status: ready-for-po<br>⚙ Backlog: Intent ready for PO"| feedback
  feedback -->|"new Intent or Bug"| intent
```

## Contributions

This repo is a showcase: it takes no issues or pull requests from outside the team. To report a vulnerability, see [SECURITY.md](SECURITY.md).

## Licence

The code is [MIT](LICENSE). Third-party data keeps its own licences, listed in [`data/sources.json`](data/sources.json).
