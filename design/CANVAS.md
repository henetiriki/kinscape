# Design canvas

How the canvas, the snapshots and the JPGs stay in step. The path for a new or updated component is in [`COMPONENTS.md`](COMPONENTS.md).

## Making the snapshots and JPGs

The exporter writes each HTML snapshot in `source/` from its board in `canvas/`. The snapshot is the source of its JPG. It holds written values only (no `var()`, `calc()` or scripts) and works offline. After a board changes, push the branch. The tech lead then runs the workflow **Design: Render snapshots** on it (Actions tab, or `gh workflow run design-agent-shots.yml --ref <branch>`). It exports every HTML snapshot, renders every JPG and commits those that changed. The `design` job exports again. If a snapshot in `source/` differs, the job fails and names the file.

The workflow also renders the card image of each component card (in `design/cards/`) in the pinned Playwright image. It commits those that changed. Nobody edits them by hand. A deletion follows [the rule](#who-deletes-a-generated-file).

### Who deletes a generated file

The tech lead, or a local session that the tech lead starts, deletes these generated files. If a board is not on the canvas on the same branch, delete its snapshots and JPGs. If a card is not in `CARDS` on the same branch, delete its card images. Remove these records of a deleted board in the same pull request:

- Its row in the Screens table of `design/DESIGN.md`.
- Its name in `NO_ENTRY`, or its entry in `design/screens.json`.
- Each entry in `snapshots` and `links` of `design/canvas/export.json` that names the board or its snapshots.
- Lower each snapshot count (`lib/design/__tests__/design.test.ts`, `scripts/__tests__/design-export.test.ts`) by one for each snapshot of the board.

## Changing the design system

- **When.** A change to `design/tokens.json`, `design/DESIGN.md`, a font, an icon, `CONTROLS` in `lib/design/bundle.mts`, `lib/design/states.mts` or a component in `CONTROLS`.
- **Where.** Run the steps on the branch of the Spec or Chore that makes the change, before its pull request merges. Never run them from `main`. The refresh and the workflow in steps 6 and 7 each commit.
- **Order.**
  1. Change the code.
  2. Run `npm run design-system`.
  3. Run `/publish-design-system` (steps 3.1 to 3.11 of the skill).
  4. Run "Updating the install" (4.1 to 4.7).
  5. Run "Refreshing the canvas copy" (5.1 to 5.5).
  6. Push the branch. The tech lead runs the workflow Design: Render snapshots on it. If a board shows the change, step 7 applies.
  7. A local session swaps the boards that the plan lists ([board swap prompt](COMPONENTS.md#board-swap-prompt)). It runs "Refreshing the canvas copy" (5.1 to 5.5). It pushes the branch. The tech lead then runs the workflow Design: Render snapshots.
- **Issue text.** A Spec or Chore that changes these inputs has two done checks. The first lists steps 2 to 5, or 2 to 7 if a board shows the change. The second says: every file under `canvas/project/ds/kinscape/` has the same sha256 as `.design-system/project/`. The Constraints say: "Edit no board in `design/canvas/` except those the plan lists. The design system steps may also edit `design/canvas/project/ds/`, `design/canvas/project/canvas.json` and `design/canvas/VERSION`."
- **Who.** The tech lead, or a local session. The session needs a signed-in account.

## Updating the install

After a `/publish-design-system` run that sends files, the canvas still holds the old copy. The design system address is in the `designSystems` entry of `canvas/project/canvas.json`.

- **4.1** List the files of the design system and the canvas files under `project/ds/kinscape/` with `list` and `scope: "files"`. List no board.
- **4.2** Read both sides with `read` and `paths`. The result gives a sha256 for each saved file. Compare each pair.
- **4.3** Show the person each changed, new or deleted file. Wait for their OK.
- **4.4** `read` the canvas in full. Send the changed and new files with one `publish` to the canvas `url` ([publish rules](../.claude/skills/publish-design-system/tools.md#rules-for-publish-with-the-artifact-tool)). Map each `project/ds/kinscape/<path>` to its source file in `files`. Set a deleted file to `null`.
- **4.5** Read `project/canvas.json` right before the edit. Set the `version` and `copiedAt` of the `designSystems` entry, and change nothing else. Send it last.
- **4.6** Read the canvas folder again. Report each file whose sha256 differs from the design system.
- **4.7** Ask the person to open the canvas and check that the new cards render.

To run the steps, paste this prompt into Claude Code:

```text
Use the Artifact tool to update project/ds/kinscape/ and the designSystems entry on the canvas.
Follow "Updating the install" in design/CANVAS.md, steps 4.1 to 4.7.
If nothing differs, say so and stop.
Change nothing else on the canvas. Touch no board. Leave the repo alone.
```

## Refreshing the canvas copy

Refresh `canvas/` after a board changes and after each install update. Keep the canvas private: a write from outside the organization blocks Claude Code's read access.

- **5.1** `list` the canvas with `scope: "files"` (its link is line 1 of `canvas/VERSION`).
- **5.2** `read` each file with `paths` into `canvas/project/` (long files in parts). Compare its `sha256` from `read` with `shasum -a 256` of the repo copy. Files under `project/ds/kinscape/` come from `.design-system/project/`.
- **5.3** Set line 2 of `canvas/VERSION` to the version that `list` reports.
- **5.4** Run `npm run design:export`. It prints "No snapshot changed" unless a board changed. With no Chromium, skip it.
- **5.5** Commit `canvas/` alone, on the branch of the change. If a board changed, discard the exported `source/` changes: step 7 renders the snapshots.

To run the steps, paste this prompt into Claude Code:

```text
Use the Artifact tool to refresh design/canvas/.
Follow "Refreshing the canvas copy" in design/CANVAS.md, steps 5.1 to 5.5.
```

## Reading a board

A Spec names the board's file (for example `Map.dc.html`). Read `project/<board>` on the canvas (link: line 1 of `canvas/VERSION`) with `read` and `paths`. If Claude Code can't build from it, build from the board's snapshot in `source/`. Record in the PR which worked.

## Drawing a board

A Spec's design prompt is the brief for the drawing. A local session, or a subagent it starts, follows it. Skip the chat lines of the prompt (link the repository to the chat, edit no file in the repository). If the app does not have a component, draw it on the draft page ([`COMPONENTS.md`](COMPONENTS.md#a-component-that-is-not-built)).
