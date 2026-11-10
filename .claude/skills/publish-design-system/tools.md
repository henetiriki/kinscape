# Calls for the publish skill

Use the built-in `Artifact` tool when the session has it. Otherwise use the six MCP tools in the last column. A step in [SKILL.md](SKILL.md) names what a call does; this table names the call.

| Step             | `Artifact` tool (default)                                                                                                                                        | MCP fallback (`mcp__claude-artifacts__*`) |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Create (3)       | `quickstart` with intent `other`, then `list` with `scope: "types"` for the Design System type. Then `publish` with `type_url`, `title` "KinScape" and no files. | `list_types`, `create_from_type`          |
| Read (5)         | `read` with `url`.                                                                                                                                               | `get_artifact`                            |
| Read files (5)   | `read` with `url` and `paths`. The tool saves the files in the scratchpad under `artifact-files/<id>/`. Copy them to `.design-system/published/`.                | `read_file`                               |
| Upload icons (7) | `publish` with `url`, `asset: true` and `file_paths` (25 at most). The `url` in the result holds `/_blob/<id>`.                                                  | `upload_asset`                            |
| Publish (10)     | `publish` with `url`, `root: ".design-system"`, `file_path` (the absolute path of one file) and `files` (a map of `project/<path>` to the same path).            | `publish_files`                           |

## Rules for `publish` with the `Artifact` tool

- The tool has no `base_version`, `mode` or `shared_live`. If another person saved first, the call fails and returns the newer version. Read the files again, then send them again.
- Read the artifact (step 5) before the first `publish`. The tool refuses a publish to an artifact that this session has not read.
- The tool refuses a path that you have not read, listed or published. Run `list` with `scope: "files"` first. Do not use `overwrite_unread` unless the person asks.
- Send `project/components/index.d.ts` as `{"from": "project/components/index.d.ts", "contentType": "text/plain"}`. The tool refuses a `.ts` file with no content type.
- Keep the order: content files first, then `project/checksums.json` and `project/design-system.json` in the last call.
- Take the owner and the sharing status for step 11 from the header of the `read` result.

## Step 8 with the MCP tools

`db_whoami` gives only an id, not a name. Use `git config user.name`.
