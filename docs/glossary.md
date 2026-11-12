# Glossary

Use these terms exactly in code, UI and docs. Add each new term in its A to Z place.

## Terms defined elsewhere

The linked file owns each meaning.

| Term               | Meaning                                                                   | Defined in                                                      |
| ------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Account            | A sign-in, with no link to a Person                                       | [Key concepts](requirements.md#key-concepts)                    |
| Address            | The location exactly as a record writes it                                | [Key concepts](requirements.md#key-concepts)                    |
| Boundary version   | The shape of one Polity between two dates                                 | [Key concepts](requirements.md#key-concepts)                    |
| Bug                | An issue that reports something broken                                    | [How we work](how-we-work.md#intent-spec-plan)                  |
| Chore              | An issue that changes tooling, CI, docs, process or settings              | [How we work](how-we-work.md#intent-spec-plan)                  |
| Claude             | The role that drafts, builds, tests and fixes. It approves nothing.       | [How we work](how-we-work.md#roles-and-labels-whose-turn-is-it) |
| Fuzzy date         | A genealogical date with a qualifier                                      | [Key concepts](requirements.md#key-concepts)                    |
| Hand-back path     | A path that only the tech lead builds                                     | [Plan rules](../plans/README.md#hand-back)                      |
| Intent             | The outcome wanted, and why                                               | [How we work](how-we-work.md#intent-spec-plan)                  |
| Jurisdiction chain | The Polities that contain a point on a date                               | [Key concepts](requirements.md#key-concepts)                    |
| Map date           | The date that the date control shows                                      | [Key concepts](requirements.md#key-concepts)                    |
| Person             | An individual in the family tree                                          | [Key concepts](requirements.md#key-concepts)                    |
| Pin                | A Person tied to a Place for a date or date range                         | [Key concepts](requirements.md#key-concepts)                    |
| Place              | A physical location, separate from its names and rulers                   | [Key concepts](requirements.md#key-concepts)                    |
| Place name         | A name that a Place had for a period                                      | [Key concepts](requirements.md#key-concepts)                    |
| Plan               | How to build a Spec, Bug or Chore                                         | [How we work](how-we-work.md#intent-spec-plan)                  |
| Polity             | A governing unit: colony, republic, province, homeland or district        | [Key concepts](requirements.md#key-concepts)                    |
| Product owner      | The person who decides what the user sees                                 | [How we work](how-we-work.md#roles-and-labels-whose-turn-is-it) |
| Relationship       | A parent–child or spouse link between two people                          | [Key concepts](requirements.md#key-concepts)                    |
| Spec               | One slice of an Intent, small enough for one pull request                 | [How we work](how-we-work.md#intent-spec-plan)                  |
| Tech lead          | The person who decides how to build it                                    | [How we work](how-we-work.md#roles-and-labels-whose-turn-is-it) |
| Tree               | The people, relationships, pins, sources and places that Accounts work on | [Key concepts](requirements.md#key-concepts)                    |
| Viewer             | Whoever reads a Tree                                                      | [Key concepts](requirements.md#key-concepts)                    |

## Glossary terms

No other file defines these terms.

| Term             | Meaning                                                                                                                                                            | Avoid                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| Board            | One drawing on a page: one screen state at one size, in a `*.dc.html` file                                                                                         | artboard, frame             |
| Canvas           | The artifact "KinScape design canvas". The design agent draws on it. It holds pages and boards.                                                                    | design kit, kit             |
| Canvas copy      | `design/canvas/`, the repo copy of the canvas files                                                                                                                | the copy                    |
| CI agent         | Claude Code that a GitHub Actions workflow runs                                                                                                                    | —                           |
| Design agent     | Claude Design, the claude.ai agent that draws on the canvas. It is separate from Claude Code.                                                                      | Claude Design (as a role)   |
| Design kit       | The app's `/design-kit` pages. They show in development and on Preview, and return 404 in production.                                                              | —                           |
| Design system    | The Design System artifact "KinScape design system". It holds tokens, fonts, icons, README, cover and components. `/publish-design-system` fills it from the repo. | the "KinScape" artifact, DS |
| Exporter         | `npm run design:export`. It writes snapshots from boards.                                                                                                          | —                           |
| Install          | The copy of the design system on the canvas, in `project/ds/kinscape/`                                                                                             | —                           |
| Local session    | A Claude Code session that the tech lead starts                                                                                                                    | —                           |
| Page             | A tab on the canvas that groups boards, for example "Map states"                                                                                                   | tab                         |
| Plan PR          | The draft PR that holds a plan until its approval                                                                                                                  | —                           |
| Plan run         | A CI agent run that refreshes an issue and drafts its plan                                                                                                         | —                           |
| Reference screen | A JPG in `design/`, rendered from a snapshot                                                                                                                       | screenshot                  |
| Screen           | An app screen that `design/screens.json` names, for example `map-account-menu`                                                                                     | —                           |
| Snapshot         | An HTML file in `design/source/` that the exporter writes from a board                                                                                             | —                           |
