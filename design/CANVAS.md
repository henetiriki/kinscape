# Design canvas

How the canvas, the snapshots and the JPGs stay in step. The look rules are in `design/DESIGN.md`.

## Making the snapshots and JPGs

Each HTML snapshot in `source/` is exported from its artboard in `canvas/` and is the source of its JPG. It holds written values only (no `var()`, `calc()` or scripts) and works offline with the fonts from `node_modules`. After editing an artboard, push the branch and run the workflow **Design: Render snapshots** on it (Actions tab, or `gh workflow run design-agent-shots.yml --ref <branch>`). It exports every HTML snapshot, renders every JPG in the pinned Playwright image, and commits those that changed. Agents never edit these files (`AGENTS.md`, Source of truth), so each one always matches its source. The `e2e` job exports again and fails, naming the file, if a snapshot in `source/` differs.

## Refreshing the copy

A person in a signed-in Claude Code session refreshes `canvas/` after a board changes on the canvas and after each install update. Keep the canvas private: once anyone outside the organization writes to it, Claude Code can no longer read it.

1. Ask Claude Code to `list_files` the canvas (its link is line 1 of `canvas/VERSION`) and compare each `project/` file's `sha256` with `shasum -a 256` of the repo copy.
2. `read_file` each file that differs into `canvas/project/` (long files in parts), then check its hash. Files under `project/ds/kinscape/` come from `npm run design-system` (`.design-system/project/`); check their hashes the same way.
3. Set line 2 of `canvas/VERSION` to the version `list_files` reports.
4. Run `npm run design:export`. It prints "No snapshot changed" unless a board changed.
5. Commit `canvas/` alone. If a board changed, discard the exported `source/` changes, push, and run the workflow Design: Render snapshots.

If `list_files` refuses with "written to by someone outside your organization", ask Claude in a chat on the canvas to read each changed file and hand it over.

## Updating the install

After a `/publish-design-system` run that sends files, the canvas still holds the old copy. Ask Claude Code to `copy_file` each changed file from the design system (its address is in the `designSystems` entry of `canvas/project/canvas.json`) to `project/ds/kinscape/`, remove files the publish deleted, and set the entry's `version` and `copiedAt`. Then refresh the copy.

## Handing off a board

A Spec names the board's file (for example `Map.dc.html`). To hand it off, open the canvas's main menu › **Hand off to Claude Code**, name the board under "Add instructions", and send the prompt it opens in Claude Code. The prompt holds the canvas link, and a board's file reads through that link with `read_file` on `project/<board>`. If Claude Code can't build from it, build from the board's snapshot in `source/`; record in the PR which worked. Don't use Export: it offers HTML (every board in one file), PDF, PNG and Vercel.
