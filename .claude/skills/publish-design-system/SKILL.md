---
name: publish-design-system
description: Publish KinScape's design system (tokens, fonts, icons, README, cover) to its Design System artifact in Claude, sending only the files that changed. Use `/publish-design-system` after changing `design/tokens.json`, `design/DESIGN.md`, the fonts or the icons. It needs an interactive Claude Code session signed in to claude.ai.
---

# Publish the design system

Runs `npm run design-system` ([Spec #446](https://github.com/henetiriki/kinscape/issues/446)) and sends the result to the artifact titled "KinScape". `scripts/design-system-publish.mts` decides what changed; this skill makes the artifact calls. The tools are `mcp__claude-artifacts__*` (load them with ToolSearch if they are deferred).

Scratch files go in `.design-system/published/`, which git ignores. Never run any other command from `.design-system/`.

## Run it

1. **Check the tools.** You need `list_types`, `create_from_type`, `get_artifact`, `read_file`, `upload_asset` and `publish_files`. If one is missing, as in a GitHub Action or a `claude -p` run, say that artifacts are off in this session, so nothing was sent, and that it needs an interactive Claude Code session signed in to claude.ai. Then stop.
2. **Find the address.** Run `node scripts/design-system-publish.mts address`. If it fails, show its message and stop; never create an artifact then. Empty output means the first run (step 3); otherwise the output is the artifact's link, so go to step 4.
3. **First run only: create it.** Call `list_types` (query "design system") for the Design System type's slug, then `create_from_type` once with that slug, the title "KinScape" and no files. Keep the new artifact's slug, link and `base_version`. At once, add `The [design system](<link>) holds the same tokens, fonts and icons for Claude.` to the end of `design/DESIGN.md`'s opening paragraph, so a failed run can't lead to a second artifact.
4. **Generate.** Run `npm run design-system`.
5. **Read what the artifact holds.** Call `get_artifact` with the link for the version and its `read` mode. Unless this is the first run, `read_file` `project/checksums.json` and `project/design-system.json` and save each, unchanged, as `.design-system/published/checksums.json` and `.design-system/published/design-system.json`. A path the artifact doesn't have is a first publish.
6. **List the changes.** Run `node scripts/design-system-publish.mts checksums`, then `node scripts/design-system-publish.mts changed .design-system/published/checksums.json` (leave out the path when there is no published copy). Its output is every `project/…` path to send, the index last.
7. **Upload changed icons.** For each listed path under `project/assets/`, call `upload_asset` with the slug and the file at `.design-system/<path>` (10 files a call at most). Save the results as `.design-system/published/uploads.json`: `{"project/assets/Icons/kse-birth.svg": "<id from /_blob/<id>>"}`.
8. **Name who ran it.** Use `git config user.name`, unless a tool returns the signed-in account's name (`db_whoami` gives only an id).
9. **Stamp the index.** Run `node scripts/design-system-publish.mts stamp --by "<name>" --published .design-system/published/design-system.json --uploads .design-system/published/uploads.json`, leaving out `--published` on a first run. It fails naming any icon with neither an upload nor a published record: upload it and run it again.
10. **Publish.** Call `publish_files` with the slug, `base_version` (the one `get_artifact` or the last publish gave), `mode` "patch", `shared_live` as the `read` mode says, and the listed paths, in order, as `{as: "<path>", path: "<repo>/.design-system/<path>"}`. Leave out the `project/assets/` files (uploaded already), `project/checksums.json`, the index and any path under the type's own files. Send at most 255 paths a call, and skip a call with no paths left. Last, in one call, publish `project/checksums.json` (when listed) and `project/design-system.json`, with the `base_version` the previous call returned.
11. **Report.** List the files you sent, count the icons uploaded, and give the artifact's link. If `read` isn't `owner`, say who can see it. Otherwise say it is private until shared on its page.

## Rules

- **One artifact.** Never call `create_from_type` unless step 2 printed nothing.
- **Never delete** an upload or a file from the artifact.
- **Send nothing the script didn't list.** Don't hand-edit `.design-system/project/`; change the source and run again.
- **A failed publish** stops the run. Say which paths were sent, then run it again: the checksums go out with the index, so the next run lists every unfinished file again.
