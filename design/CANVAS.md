# Design canvas

How the canvas, the snapshots and the JPGs stay in step. The look rules are in `design/DESIGN.md`. The path for a new or updated component is in [`COMPONENTS.md`](COMPONENTS.md).

## Making the snapshots and JPGs

Each HTML snapshot in `source/` is exported from its artboard in `canvas/` and is the source of its JPG. It holds written values only (no `var()`, `calc()` or scripts) and works offline. After editing an artboard, push the branch and run the workflow **Design: Render snapshots** on it (Actions tab, or `gh workflow run design-agent-shots.yml --ref <branch>`). It exports every HTML snapshot, renders every JPG in the pinned Playwright image, and commits those that changed. The `e2e` job exports again and fails, naming the file, if a snapshot in `source/` differs.

With no Chromium, skip `npm run design:export`: the workflow exports in CI.

## Changing the design system

- **When.** A change to `design/tokens.json`, `design/DESIGN.md`, a font, an icon, `CONTROLS` in `lib/design/bundle.mts`, `lib/design/states.mts` or a component in `CONTROLS`.
- **Where.** Run the steps on the branch of the Spec or Chore that makes the change, before its pull request merges; never from `main`. Only the refresh produces a commit.
- **Order.**
  1. Change the code.
  2. Run `npm run design-system`.
  3. Run `/publish-design-system`. Before it, `read` the canvas in full. A `read` with `paths` makes the publish fail, and the canvas version moves after a publish.
  4. Run the steps in "Updating the install".
  5. Run the steps in "Refreshing the copy", then commit `design/canvas/` alone.
  6. Push the branch. If a board changed, run the workflow Design: Render snapshots.
- **Done check.** A Spec or Chore that changes these inputs lists steps 3 to 5 in its done check: every file under `canvas/project/ds/kinscape/` has the same sha256 as `.design-system/project/`.
- **Who.** The tech lead, or a local Claude Code session that the tech lead starts and signs in. The CI build agent cannot sign in.
- **Boards.** The design agent redraws a board with a new component later, on the branch of the Spec that needs it, after step 5.

## Refreshing the copy

Refresh `canvas/` after a board changes and after each install update. Keep the canvas private: if anyone outside the organization writes to it, Claude Code cannot read it.

1. `list` the canvas with `scope: "files"` (its link is line 1 of `canvas/VERSION`). `list` shows sizes, not hashes.
2. `read` each file with `paths` into `canvas/project/` (long files in parts). Compare its `sha256` from `read` with `shasum -a 256` of the repo copy. Files under `project/ds/kinscape/` come from `.design-system/project/`.
3. Set line 2 of `canvas/VERSION` to the version that `list` reports.
4. Run `npm run design:export`. It prints "No snapshot changed" unless a board changed. With no Chromium, skip it.
5. Commit `canvas/` alone, on the branch of the change. If a board changed, discard the exported `source/` changes, push, and run the workflow Design: Render snapshots.

Fallback, without the `Artifact` tool: use `list_files` and `read_file`. If `list_files` refuses with "written to by someone outside your organization", ask Claude in a chat on the canvas to read each changed file and hand it over.

To run the steps, paste this prompt into Claude Code:

```text
Use the Artifact tool to refresh design/canvas/.
Follow "Refreshing the copy" in design/CANVAS.md, steps 1 to 5.
Commit design/canvas/ alone.
```

## Updating the install

After a `/publish-design-system` run that sends files, the canvas still holds the old copy. The design system address is in the `designSystems` entry of `canvas/project/canvas.json`.

1. List the files of the design system and the canvas files under `project/ds/kinscape/` with `list` and `scope: "files"`. List no board.
2. Read both sides with `read` and `paths`. The result gives a sha256 for each saved file. Compare each pair.
3. Show the person the files that differ, the files that are new, and the files the publish deleted. Wait for their OK.
4. Send the changed and new files with one `publish` to the canvas `url`. Map each `project/ds/kinscape/<path>` to its source file in `files`. Set a deleted file to `null`. Send `index.d.ts` as `{"from": …, "contentType": "text/plain"}`.
5. Read `project/canvas.json` right before the edit. Set the `version` and `copiedAt` of the `designSystems` entry, and change nothing else. Send it last.
6. Read the canvas folder again. Report each file whose sha256 differs from the design system.
7. Ask the person to open the canvas and check that the new cards render.

Fallback, without the `Artifact` tool: use `copy_file` for each changed file, remove the deleted files, and set the entry's `version` and `copiedAt`.

To run the steps, paste this prompt into Claude Code:

```text
Use the Artifact tool to update project/ds/kinscape/ and the designSystems entry on the canvas.
Follow "Updating the install" in design/CANVAS.md, steps 1 to 7.
After step 3, wait for my OK. If nothing differs, say so and stop.
Touch no board. Leave the repo alone.
```

## Handing off a board

A Spec names the board's file (for example `Map.dc.html`). Open the canvas's main menu › **Hand off to Claude Code**, name the board under "Add instructions", and send the prompt it opens. The prompt holds the canvas link. Read the board through that link with `read` and `paths` on `project/<board>` (`read_file` without the `Artifact` tool). If Claude Code can't build from it, build from the board's snapshot in `source/`; record in the PR which worked. Don't use Export.
