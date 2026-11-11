---
name: publish-design-system
description: Publish KinScape's design system (tokens, fonts, icons, README, cover, components) to its Design System artifact in Claude. It sends only the files that changed. Use `/publish-design-system` after a change to `design/tokens.json`, `design/DESIGN.md`, the fonts, the icons, `CONTROLS` in `lib/design/bundle.mts`, `lib/design/states.mts` or a component in `CONTROLS`. It needs an interactive Claude Code session signed in to claude.ai.
---

# Publish the design system

Runs `npm run design-system` and sends the result to the artifact titled "KinScape". `scripts/design-system-publish.mts` decides what changed. This skill makes the artifact calls. [`tools.md`](tools.md) names the call for each step.

Scratch files go in `.design-system/published/`, which git ignores. Never run any other command from `.design-system/`.

## Run it

- **3.1 Check the tools.** You need the built-in `Artifact` tool or the six `mcp__claude-artifacts__*` tools that `tools.md` lists. If the session defers a tool, load it with ToolSearch. If neither set exists (for example in a GitHub Action or a `claude -p` run), say that artifacts are off in this session, so nothing was sent. Say that the run needs an interactive Claude Code session signed in to claude.ai. Then stop.
- **3.2 Find the address.** Run `node scripts/design-system-publish.mts address`. If it fails, show its message and stop. If the output is empty, this is the first run: go to step 3.3. Otherwise the output is the artifact's link: go to step 3.4.
- **3.3 First run only: create it.** Create a Design System artifact titled "KinScape" with no files. Keep its link. At once, add `The [design system](<link>) holds the same tokens, fonts and icons for Claude.` to the end of `design/DESIGN.md`'s opening paragraph, so the next run finds the address.
- **3.4 Generate.** Run `npm run design-system`.
- **3.5 Read what the artifact holds.** Read the artifact. If this is not the first run, read `project/checksums.json` and `project/design-system.json`. Save each, unchanged, as `.design-system/published/checksums.json` and `.design-system/published/design-system.json`. A path the artifact doesn't have is a first publish.
- **3.6 List the changes.** Run `node scripts/design-system-publish.mts checksums`, then `node scripts/design-system-publish.mts changed .design-system/published/checksums.json` (omit the path when there is no published copy). Its output is every `project/…` path to send, the index last.
- **3.7 Upload changed icons.** Upload each listed path under `project/assets/` from `.design-system/<path>`. Save the results as `.design-system/published/uploads.json`: `{"project/assets/Icons/kse-birth.svg": "<id from /_blob/<id>>"}`.
- **3.8 Name who ran it.** If a tool returns the signed-in account's name, use it. Otherwise use `git config user.name`.
- **3.9 Stamp the index.** Run `node scripts/design-system-publish.mts stamp --by "<name>" --published .design-system/published/design-system.json --uploads .design-system/published/uploads.json`. Omit `--published` on a first run. If an icon has neither an upload nor a published record, the command fails and names it. Upload the icon and run the command again.
- **3.10 Publish.** Send the listed paths, in order, from `.design-system/`. Do not send these in a content call:
  - the `project/assets/` files (already uploaded);
  - `project/checksums.json` and the index;
  - any path under the type's own files.

  Send at most 255 paths a call. Skip a call with no paths left. Last, in one call, send `project/checksums.json` (when listed) and `project/design-system.json`.

- **3.11 Report.** List the files you sent, count the icons you uploaded, and give the artifact's link. If you are not the owner, say who can see it. Otherwise say it is private until the owner shares it on its page. If you sent files, link [Updating the install](../../../design/CANVAS.md#updating-the-install) for the old copy on the canvas, and [Changing the design system](../../../design/CANVAS.md#changing-the-design-system) for the next steps.

## Rules

- **One artifact.** Create an artifact only in step 3.3.
- **Never delete** an upload or a file from the artifact.
- **Send nothing the script didn't list.** Do not hand-edit `.design-system/project/`. Change the source and run again.
- **A failed publish** stops the run. Say which paths you sent. Then run the skill again. The checksums go out with the index, so the next run lists every unfinished file again.
- **Name tools by what they do.** A tool rename must not stop the run.
- **Run on the change's branch.** See [Changing the design system](../../../design/CANVAS.md#changing-the-design-system).
