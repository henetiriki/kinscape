# Design canvas

How the canvas, the snapshots and the JPGs stay in step. The path for a new or updated component is in [`COMPONENTS.md`](COMPONENTS.md).

A design follows this path:

1. For a user-visible Intent, `/refine intent <n>` slices a design Spec first.
2. The tech lead starts a local Claude Code session. The session builds the design Spec with [Drawing a board](#drawing-a-board), then step 7 of [Changing the design system](#changing-the-design-system).
3. Only the tech lead, or a local Claude Code session that the tech lead starts, edits the canvas.

## Making the snapshots and JPGs

The exporter writes each HTML snapshot (`*.html`) in `source/` from its board in `canvas/`. `source/kse-*.svg` and `source/fonts.css` are hand-kept sources. The snapshot is the source of its JPG. It holds written values only (no `var()`, `calc()` or scripts) and works offline. After a board changes, push the branch. The session then runs the workflow **Design: Render snapshots** on it (`gh workflow run design-agent-shots.yml --ref <branch>`, or the Actions tab). It exports every HTML snapshot, renders every JPG and commits those that changed. The `design` job exports again. If a snapshot in `source/` differs, the job fails and names the file.

An `export.json` snapshot can hold a `clip`: the `x`, `y`, `width` and `height` in px of the part to keep. The snapshot and its JPG show only that part, and the JPG keeps its size. The export fails on a clip outside the viewport, and on `position: fixed` content.

The workflow also renders the card image of each component card (in `design/cards/`) in the pinned Playwright image. It commits those that changed. A deletion follows [the rule](#who-deletes-a-generated-file).

`npm run design:gallery` writes the gallery and opens each component card. The CI job `gallery` runs it. Outside the pinned image, the run skips the card images. If a card image differs in the `gallery` job, the session runs the workflow. The workflow commits the new card image.

### Who deletes a generated file

The tech lead, or a local session that the tech lead starts, deletes these generated files. If a board is not on the canvas on the same branch, delete its snapshots and JPGs. If a card is not in `CARDS` on the same branch, delete its card images. Remove these records of a deleted board in the same pull request:

- Its row in the Screens table of `design/DESIGN.md`.
- Its name in `NO_ENTRY`, or its entry in `design/screens.json`.
- Each entry in `snapshots` and `links` of `design/canvas/export.json` that names the board or its snapshots.
- Each snapshot count in `lib/design/__tests__/design.test.ts` and `scripts/__tests__/design-export.test.ts`, lowered by one for each snapshot of the board.

## Changing the design system

- **When.** A change to `design/tokens.json`, `design/DESIGN.md`, a font, an icon, `CONTROLS` in `lib/design/bundle.mts`, `lib/design/cards.mts`, `lib/design/samples.mts`, `lib/design/states.mts` or a component in `CONTROLS`.
- **Where.** Run the steps on the branch of the Spec or Chore that makes the change, before its pull request merges. Never run them from `main`. The refresh in step 5, the session in step 7 and the workflow each commit. If the branch merges a `main` that holds another design system change, run steps 3 to 5 again.
- **Order.**
  1. Change the code.
  2. Run `npm run design-system`.
  3. Run `/publish-design-system` (steps 3.1 to 3.11 of the skill).
  4. Run "Updating the install" (4.1 to 4.6).
  5. Run "Refreshing the canvas copy" (5.1 to 5.5).
  6. If no board shows the change, push the branch. If the `design` or `gallery` job then fails on a snapshot or a card image, run the workflow Design: Render snapshots on it.
  7. If a board shows the change, step 6 does not run. A local session does these steps in order:
     1. Edit each board that the plan lists in the repo copy, `design/canvas/project/` ([board swap prompt](COMPONENTS.md#board-swap-prompt)).
     2. Run `npm run design:export`. If it fails, stop. Publish nothing.
     3. Publish each edited board to the canvas.
     4. `list` the canvas. Read back only the boards that the session published. Compare each sha256 with the repo copy. Set line 2 of `canvas/VERSION`.
     5. Discard the exported `source/` changes. Commit `design/canvas/` alone. Push the branch.

     The session then runs the workflow Design: Render snapshots once. That run renders the card images and the boards.

     A local `npm run design:export` proves only that the export does not fail: another machine can write different values. The workflow runs in the pinned Playwright image. It is the proof of the snapshots, the JPGs and the card images.

- **Issue text.** A Spec or Chore that changes these inputs has two done checks. The first lists steps 2 to 6, or 2 to 7 if a board shows the change. The second says: every file under `canvas/project/ds/kinscape/` has the same sha256 as `.design-system/project/`. The Constraints say: "Edit no board in `design/canvas/` except those the plan lists. The design system steps may also edit `design/canvas/project/ds/`, `design/canvas/project/canvas.json` and `design/canvas/VERSION`."
- **Who.** A local Claude Code session that the tech lead starts runs these steps, including the workflow. It needs a signed-in account.

## Updating the install

After a `/publish-design-system` run that sends files, the canvas still holds the old copy. The design system address is in the `designSystems` entry of `canvas/project/canvas.json`.

- **4.1** List the files of the design system and the canvas files under `project/ds/kinscape/` with `list` and `scope: "files"`. List no board.
- **4.2** Read both sides with `read` and `paths`. The result gives a sha256 for each saved file. Compare each pair.
- **4.3** Show the person each changed, new or deleted file. Wait for their OK.
- **4.4** `read` the canvas in full. Send the changed and new files with one `publish` to the canvas `url` ([publish rules](../.claude/skills/publish-design-system/tools.md#rules-for-publish-with-the-artifact-tool)). Map each `project/ds/kinscape/<path>` to its source file in `files`. Set a deleted file to `null`.
- **4.5** Read `project/canvas.json` right before the edit. Set the `version` and `copiedAt` of the `designSystems` entry, and change nothing else. Send it last.
- **4.6** Read the canvas folder again. Report each file whose sha256 differs from the design system.

To run the steps, paste this prompt into Claude Code:

```text
Use the Artifact tool to update project/ds/kinscape/ and the designSystems entry on the canvas.
Follow "Updating the install" in design/CANVAS.md, steps 4.1 to 4.6.
If nothing differs, say so and stop.
Change nothing else on the canvas. Touch no board. Leave the repo alone.
```

## Refreshing the canvas copy

Refresh `canvas/` after an install update. Step 7 of "Changing the design system" does not run it. Keep the canvas private: a write from outside the organization blocks Claude Code's read access.

- **5.1** `list` the canvas with `scope: "files"` (its link is line 1 of `canvas/VERSION`).
- **5.2** `read` each file with `paths` into `canvas/project/` (long files in parts). Compare its `sha256` from `read` with `shasum -a 256` of the repo copy. Files under `project/ds/kinscape/` come from `.design-system/project/`.
- **5.3** Set line 2 of `canvas/VERSION` to the version that `list` reports.
- **5.4** Run `npm run design:export`. It prints "No snapshot changed" unless a board changed. With no Chromium, skip it.
- **5.5** Commit `canvas/` alone, on the branch of the change. If a board changed, discard the exported `source/` changes: the workflow renders the snapshots.

To run the steps, paste this prompt into Claude Code:

```text
Use the Artifact tool to refresh design/canvas/.
Follow "Refreshing the canvas copy" in design/CANVAS.md, steps 5.1 to 5.5.
```

## Reading a board

A Spec names the board's file (for example `Map.dc.html`). Read `project/<board>` on the canvas (link: line 1 of `canvas/VERSION`) with `read` and `paths`. If Claude Code can't build from it, build from the board's snapshot in `source/`. Record in the PR which worked.

## Drawing a board

A local session, or a subagent it starts, follows this brief for each board that a Spec lists. The session draws each board in the repo copy, `design/canvas/project/`, and publishes it as step 7 of [Changing the design system](#changing-the-design-system) says. It edits no board that the Spec does not list.

### Rules for the drawing

The exporter checks each rule except the `<sc-for>` rule, which the HTML parser sets. If this list differs from `scripts/design-export.mts`, the code wins.

- Write `var(--token)` only in an inline `style=""` attribute, never in a `<style>` block.
- Use no CSS function that the colour check cannot read, such as `inset()`, `rect()` or `clamp()`.
- Add no `<script>` except the board's own `data-dc-script` and the canvas tags. Use no `http(s)` load and no CSS escape.
- Put no `<sc-for>` in a `<table>`, `<tbody>` or `<tr>`. The HTML parser moves it out of the table.
- Link to another board only if that board has a snapshot, or an entry in `links` in `design/canvas/export.json`.
- Put `<x-import>` in the file of each board that needs the design system.

Also follow these rules:

- Mount `KinScape.MapLayout` in a map board.
- Read the README of a component in `design/canvas/project/ds/kinscape/components/` before you use it.
- Use only design-system components and tokens, and synthetic data.
- Follow `design/DESIGN.md` for spacing, 44px targets, error placement and sentence case.
- Draw a part with no component on the Drafts page ([`COMPONENTS.md`](COMPONENTS.md#a-component-that-is-not-built)).
- Put each screen board on the canvas page of the other boards of its screen, or on Drafts.

In the PR body, list these:

- the board files and the layout;
- each hand-drawn part, with its states;
- each value that has no token, so that the build Spec decides a token.

### Records of a new board

Each new board needs these:

- An entry in `canvas.json`, and one in `export.json`. A wrapper names its base file and `props`. Publish `canvas.json` last, after the boards, as step 4.5 does.
- A Screens row in `design/DESIGN.md`.
- If the board designs a screen under "Not designed yet" in `design/DESIGN.md`, a change to that line.
- A name in `NO_ENTRY` in `lib/design/__tests__/screens.test.ts`, unless `design/screens.json` has an entry.
- The two snapshot counts, in `lib/design/__tests__/design.test.ts` and `scripts/__tests__/design-export.test.ts`.
- The README check: run `npm run design-system`. Compare the sha256 of `.design-system/project/README.md` and `design/canvas/project/ds/kinscape/README.md`. If they differ, stop: steps 3 to 5 of Changing the design system apply.
