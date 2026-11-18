# Glossary

Add each new term in its A to Z place.

## Terms defined elsewhere

The linked file owns each meaning.

| Term               | Meaning                                                                   | Defined in                                                      |
| ------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Account            | A sign-in, with no link to a Person                                       | [Key concepts](requirements.md#key-concepts)                    |
| Address            | The location exactly as a record writes it                                | [Key concepts](requirements.md#key-concepts)                    |
| Boundary version   | The shape of one Polity between two dates                                 | [Key concepts](requirements.md#key-concepts)                    |
| Bug                | An issue that reports something broken                                    | [How we work](how-we-work.md#which-issue-do-i-need)             |
| Chore              | An issue that changes tooling, CI, docs, process or settings              | [How we work](how-we-work.md#which-issue-do-i-need)             |
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

**Planned (#n)** marks a term for a thing that Intent #n will build. The Spec that builds the thing removes the mark.

| Term                | Meaning                                                                                                                                                                                                                 | Avoid                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Board               | One drawing on a canvas page: one screen state at one size, in a `*.dc.html` file                                                                                                                                       | artboard, frame                    |
| Bundle              | The script `components/bundle.js` of the design system. It holds each component in `CONTROLS`. A board loads it from the install.                                                                                       | —                                  |
| Canvas              | The artifact "KinScape design canvas". A local session draws on it. It holds canvas pages and boards.                                                                                                                   | kit                                |
| Canvas copy         | `design/canvas/`, the repo copy of the canvas files                                                                                                                                                                     | the copy                           |
| Canvas page         | A tab on the canvas that groups boards, for example "Map states"                                                                                                                                                        | tab, page                          |
| Card image          | A PNG in `design/cards/` that shows one component card at one width                                                                                                                                                     | card screenshot                    |
| Card state          | One example on a component card: the component with fixed props                                                                                                                                                         | state, variant                     |
| CI agent            | Claude Code that a GitHub Actions workflow runs                                                                                                                                                                         | —                                  |
| Component card      | The entry of one component in the design system: a README and a preview                                                                                                                                                 | card                               |
| Design system       | The Design System artifact "KinScape design system". It holds tokens, fonts, icons, README, cover and components. `/publish-design-system` fills it from the repo.                                                      | the "KinScape" artifact, DS        |
| Design system files | The folder `.design-system/`, which `npm run design-system` writes from the repo. `/publish-design-system` sends the files under `.design-system/project/` to the design system. The files under `gallery/` stay local. | the design system (for the folder) |
| Draft page          | The canvas page that holds hand-drawn boards of components that the app does not have yet                                                                                                                               | —                                  |
| Exporter            | `npm run design:export`. It writes snapshots from boards.                                                                                                                                                               | —                                  |
| Fixture Account     | A synthetic Account with a preset Tree. Only the memory adapters hold it.                                                                                                                                               | test user                          |
| Gallery             | The HTML files that a script writes from the component cards. CI opens them from disk.                                                                                                                                  | —                                  |
| Hand-drawn          | Board markup that imitates a component with its own HTML and CSS                                                                                                                                                        | —                                  |
| Install             | The copy of the design system on the canvas, in `project/ds/kinscape/`                                                                                                                                                  | —                                  |
| Local session       | A Claude Code session that the tech lead starts                                                                                                                                                                         | design agent                       |
| Mounted             | Board markup that loads a component from the bundle                                                                                                                                                                     | —                                  |
| Plan PR             | The draft PR that holds a plan until the tech lead approves it                                                                                                                                                          | —                                  |
| Plan run            | A CI agent run that refreshes an issue and drafts its plan                                                                                                                                                              | —                                  |
| Reference screen    | A JPG in `design/`, rendered from a snapshot                                                                                                                                                                            | screenshot                         |
| Screen              | An app screen that `design/screens.json` names, for example `map-account-menu`                                                                                                                                          | —                                  |
| Snapshot            | An HTML file in `design/source/` that the exporter writes from a board                                                                                                                                                  | —                                  |
| Swap                | The change of a board part from hand-drawn to mounted                                                                                                                                                                   | —                                  |
| Wrapper board       | A board that only imports another board with a variant. It has no snapshot of its own.                                                                                                                                  | —                                  |
