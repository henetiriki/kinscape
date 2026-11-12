# Design canvas

How the canvas, the snapshots and the JPGs stay in step. The path for a new or updated component is in [`COMPONENTS.md`](COMPONENTS.md).

## Making the snapshots and JPGs

The exporter writes each HTML snapshot in `source/` from its artboard in `canvas/`. The snapshot is the source of its JPG. It holds written values only (no `var()`, `calc()` or scripts) and works offline. After you edit an artboard, push the branch and run the workflow **Design: Render snapshots** on it (Actions tab, or `gh workflow run design-agent-shots.yml --ref <branch>`). It exports every HTML snapshot, renders every JPG in the pinned Playwright image, and commits those that changed. The `design` job exports again. If a snapshot in `source/` differs, the job fails and names the file.

## Changing the design system

- **When.** A change to `design/tokens.json`, `design/DESIGN.md`, a font, an icon, `CONTROLS` in `lib/design/bundle.mts`, `lib/design/states.mts` or a component in `CONTROLS`.
- **Where.** Run the steps on the branch of the Spec or Chore that makes the change, before its pull request merges. Never run them from `main`. The refresh and the workflow in step 9 each commit.
- **Order.**
  1. Change the code.
  2. Run `npm run design-system`.
  3. Run `/publish-design-system` (steps 3.1 to 3.11 of the skill).
  4. Run "Updating the install" (4.1 to 4.7).
  5. Run "Refreshing the copy" (5.1 to 5.5), then commit `design/canvas/` alone.
  6. Push the branch. If a board shows the change, steps 7 to 9 apply.
  7. The design agent swaps the boards that the plan lists ([board swap prompt](COMPONENTS.md#board-swap-prompt)).
  8. Run "Refreshing the copy" again (5.1 to 5.5). This adds the swapped boards.
  9. Push the branch, then run the workflow Design: Render snapshots on it.
- **Issue text.** A Spec or Chore that changes these inputs has two done checks. The first lists steps 2 to 5, or 2 to 9 if a board shows the change. The second says: every file under `canvas/project/ds/kinscape/` has the same sha256 as `.design-system/project/`. The Constraints say: "Edit no board in `design/canvas/` except those the plan lists. The design system steps may also edit `design/canvas/project/ds/`, `design/canvas/project/canvas.json` and `design/canvas/VERSION`."
- **Who.** The tech lead, or a local Claude Code session that the tech lead starts. The session needs a signed-in account.

## Updating the install

After a `/publish-design-system` run that sends files, the canvas still holds the old copy. The design system address is in the `designSystems` entry of `canvas/project/canvas.json`.

- **4.1** List the files of the design system and the canvas files under `project/ds/kinscape/` with `list` and `scope: "files"`. List no board.
- **4.2** Read both sides with `read` and `paths`. The result gives a sha256 for each saved file. Compare each pair.
- **4.3** Show the person each changed, new or deleted file. Wait for their OK.
- **4.4** `read` the canvas in full. Send the changed and new files with one `publish` to the canvas `url` ([publish rules](../.claude/skills/publish-design-system/tools.md#rules-for-publish-with-the-artifact-tool)). Map each `project/ds/kinscape/<path>` to its source file in `files`. Set a deleted file to `null`.
- **4.5** Read `project/canvas.json` right before the edit. Set the `version` and `copiedAt` of the `designSystems` entry, and change nothing else. Send it last.
- **4.6** Read the canvas folder again. Report each file whose sha256 differs from the design system.
- **4.7** Ask the person to open the canvas and check that the new cards render.

Fallback, without the `Artifact` tool:

- Use `copy_file` for each changed file.
- Remove the deleted files.
- Set the entry's `version` and `copiedAt`.

To run the steps, paste this prompt into Claude Code:

```text
Use the Artifact tool to update project/ds/kinscape/ and the designSystems entry on the canvas.
Follow "Updating the install" in design/CANVAS.md, steps 4.1 to 4.7.
If nothing differs, say so and stop.
Change nothing else on the canvas. Touch no board. Leave the repo alone.
```

## Refreshing the copy

Refresh `canvas/` after a board changes and after each install update. Keep the canvas private: a write from outside the organization blocks Claude Code's read access.

- **5.1** `list` the canvas with `scope: "files"` (its link is line 1 of `canvas/VERSION`). `list` shows sizes, not hashes.
- **5.2** `read` each file with `paths` into `canvas/project/` (long files in parts). Compare its `sha256` from `read` with `shasum -a 256` of the repo copy. Files under `project/ds/kinscape/` come from `.design-system/project/`.
- **5.3** Set line 2 of `canvas/VERSION` to the version that `list` reports.
- **5.4** Run `npm run design:export`. It prints "No snapshot changed" unless a board changed. With no Chromium, skip it.
- **5.5** Commit `canvas/` alone, on the branch of the change. If a board changed, discard the exported `source/` changes: step 9 renders the snapshots.

Fallback, without the `Artifact` tool: use `list_files` and `read_file`. If `list_files` refuses with "written to by someone outside your organization", ask Claude in a chat on the canvas to read each changed file and give it to you.

To run the steps, paste this prompt into Claude Code:

```text
Use the Artifact tool to refresh design/canvas/.
Follow "Refreshing the copy" in design/CANVAS.md, steps 5.1 to 5.5.
```

## Handing off a board

A Spec names the board's file (for example `Map.dc.html`). Open the canvas's main menu › **Hand off to Claude Code**. Name the board under "Add instructions". Send the prompt it opens. The prompt holds the canvas link. Read the board through that link with `read` and `paths` on `project/<board>` (`read_file` without the `Artifact` tool). If Claude Code can't build from it, build from the board's snapshot in `source/`. Record in the PR which worked. Don't use Export.
