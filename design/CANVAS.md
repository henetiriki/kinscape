# Design canvas

How the canvas, the snapshots and the JPGs stay in step. The look rules are in `design/DESIGN.md`.

## Making the snapshots and JPGs

Each HTML snapshot in `source/` is exported from its artboard in `canvas/` and is the source of its JPG. It holds written values only (no `var()`, `calc()` or scripts) and works offline with the fonts from `node_modules`. After editing an artboard, push the branch and run the workflow **Design: Render snapshots** on it (Actions tab, or `gh workflow run design-agent-shots.yml --ref <branch>`). It exports every HTML snapshot, renders every JPG in the pinned Playwright image, and commits those that changed. Agents never edit these files (`AGENTS.md`, Source of truth), so each one always matches its source. The `e2e` job exports again and fails, naming the file, if a snapshot in `source/` differs.

## Changing the design system

- **When.** A change to `design/tokens.json`, `design/DESIGN.md`, a font, an icon, `CONTROLS` in `lib/design/bundle.mts`, `lib/design/states.mts` or a component in `CONTROLS`.
- **Where.** Run the steps on the branch of the Spec or Chore that makes the change, before its pull request merges. Do not run them from `main`. `.design-system/` is not committed, so only the refresh produces a commit.
- **Order.**
  1. Change the code.
  2. Run `npm run design-system`.
  3. Run `/publish-design-system`.
  4. Run the steps in "Updating the install".
  5. Run the steps in "Refreshing the copy", then commit `design/canvas/` alone.
  6. Push the branch. If a board changed, run the workflow Design: Render snapshots.
- **Done check.** A Spec or Chore that changes these inputs lists steps 3 to 5 in its done check: every file under `canvas/project/ds/kinscape/` has the same sha256 as `.design-system/project/`.
- **Who.** A person in a signed-in session, or an agent they ask.
- **Boards.** The design agent redraws a board with a new component later, on the branch of the Spec that needs it, after step 5.

## Refreshing the copy

A person in a signed-in Claude Code session refreshes `canvas/` after a board changes on the canvas and after each install update. Keep the canvas private: once anyone outside the organization writes to it, Claude Code can no longer read it.

1. Ask Claude Code to `list` the canvas with `scope: "files"` (its link is line 1 of `canvas/VERSION`). Compare each `project/` file's `sha256` with `shasum -a 256` of the repo copy.
2. `read` each file that differs, with `paths`, into `canvas/project/` (long files in parts). The saved copy carries a sha256, so check it. Files under `project/ds/kinscape/` come from `npm run design-system` (`.design-system/project/`); check their hashes the same way.
3. Set line 2 of `canvas/VERSION` to the version that `list` reports.
4. Run `npm run design:export`. It prints "No snapshot changed" unless a board changed.
5. Commit `canvas/` alone, on the branch of the change, as "Changing the design system" says. If a board changed, discard the exported `source/` changes, push, and run the workflow Design: Render snapshots.

Fallback, in a session without the `Artifact` tool: use `list_files` and `read_file` in place of `list` and `read`. If `list_files` refuses with "written to by someone outside your organization", ask Claude in a chat on the canvas to read each changed file and hand it over.

## Updating the install

After a `/publish-design-system` run that sends files, the canvas still holds the old copy. The design system address is in the `designSystems` entry of `canvas/project/canvas.json`.

1. List the files of the design system and of the canvas folder `project/ds/kinscape/` with `list` and `scope: "files"`.
2. Read both sides with `read` and `paths`. The result gives a sha256 for each saved file. Compare each pair.
3. Show the person the files that differ, the files that are new, and the files the publish deleted. Wait for their OK.
4. Send the changed and new files with one `publish` to the canvas `url`. Map each `project/ds/kinscape/<path>` to its source file in `files`. Set a deleted file to `null`. Send `index.d.ts` as `{"from": …, "contentType": "text/plain"}`.
5. Read `project/canvas.json` right before the edit. Set the `version` and `copiedAt` of the `designSystems` entry, and change nothing else. Send it in the last call.
6. Read the canvas folder again. Report each file whose sha256 differs from the design system.

If no file differs, list none and send nothing.

Fallback, in a session without the `Artifact` tool: use `copy_file` for each changed file, remove the deleted files, and set the entry's `version` and `copiedAt`.

Then refresh the copy. To run the steps, paste this prompt into Claude Code:

```text
Use the Artifact tool to update the design system copy in project/ds/kinscape/ on the canvas.
Follow "Updating the install" in design/CANVAS.md, steps 1 to 6.
After step 3, wait for my OK. If nothing differs, say so and stop.
Change nothing else on the canvas. Touch no board. Leave the repo alone.
```

## Handing off a board

A Spec names the board's file (for example `Map.dc.html`). To hand it off, open the canvas's main menu › **Hand off to Claude Code**, name the board under "Add instructions", and send the prompt it opens in Claude Code. The prompt holds the canvas link. Read a board's file through that link with `read` and `paths` on `project/<board>`. In a session without the `Artifact` tool, use `read_file`. If Claude Code can't build from it, build from the board's snapshot in `source/`; record in the PR which worked. Don't use Export: it offers HTML (every board in one file), PDF, PNG and Vercel.
