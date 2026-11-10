# Calls for the publish skill

If the session has the built-in `Artifact` tool, use it. Otherwise use the six MCP tools in the last column.

| Step             | `Artifact` tool (default)                                                                                                                                        | MCP fallback (`mcp__claude-artifacts__*`) |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Create (3)       | `quickstart` with intent `other`, then `list` with `scope: "types"` for the Design System type. Then `publish` with `type_url`, `title` "KinScape" and no files. | `list_types`, `create_from_type`          |
| Read (5)         | `read` with `url`.                                                                                                                                               | `get_artifact`                            |
| Read files (5)   | `read` with `url` and `paths`. The tool saves each file under `artifact-files/<id>/project/` in the scratchpad. Copy it to the name that step 5 gives.           | `read_file`                               |
| Upload icons (7) | `publish` with `url`, `asset: true` and `file_paths` (25 at most). The `url` in the result holds `/_blob/<id>`.                                                  | `upload_asset`                            |
| Publish (10)     | `publish` with `url`, `root: ".design-system"`, `file_path` (the absolute path of one file) and `files` (a map of `project/<path>` to the same path).            | `publish_files`                           |

## Rules for `publish` with the `Artifact` tool

- The tool has no `base_version`, `mode` or `shared_live`. If another person saved first, the call fails and returns the newer version. Stop, and follow the **A failed publish** rule.
- Read the artifact (step 5) before the first `publish`. The tool refuses a publish to an artifact that this session has not read.
- The tool refuses a path that you have not read, listed or published. Run `list` with `scope: "files"` first. If the user does not ask, never use `overwrite_unread`.
- Send `project/components/index.d.ts` as `{"from": "project/components/index.d.ts", "contentType": "text/plain"}`. The tool refuses a `.ts` file with no content type.
- Take the owner and the sharing status for step 11 from the header of the `read` result.

## Rules for the MCP tools

- `publish_files`: pass the slug, `base_version` (from `get_artifact` or the last publish), `mode` "patch", `shared_live` as the `read` mode says, and each path as `{as: "<path>", path: "<repo>/.design-system/<path>"}`.
- `upload_asset`: send 10 files a call at most.
- Take the owner for step 11 from the `read` mode that `get_artifact` gives.
- `db_whoami` gives only an id, not a name.
