# Calls for the publish skill

If the session has the built-in `Artifact` tool, use it.

| Step               | `Artifact` tool (default)                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create (3.3)       | `quickstart` with intent `other`, then `list` with `scope: "types"` for the Design System type. Then `publish` with `type_url`, `title` "KinScape design system" and no files. |
| Read (3.5)         | `read` with `url`.                                                                                                                                                             |
| Read files (3.5)   | `read` with `url` and `paths`. The tool saves each file under `artifact-files/<id>/project/` in the scratchpad. Copy it to the name that step 3.5 gives.                       |
| Upload icons (3.7) | `publish` with `url`, `asset: true` and `file_paths` (25 at most). The `url` in the result holds `/_blob/<id>`.                                                                |
| Publish (3.10)     | `publish` with `url`, `root: ".design-system"`, `file_path` (the absolute path of one file) and `files` (a map of `project/<path>` to the same path).                          |

## Rules for `publish` with the `Artifact` tool

- The tool has no `base_version`, `mode` or `shared_live`. If another person saved first, the call fails and returns the newer version. Stop, and follow the **A failed publish** rule.
- Before the first `publish` to each artifact, read the artifact page itself: `read` with `url` and no `paths`. A `read` with `paths` does not count, and the tool refuses the `publish`. If the tool refuses, read the page again.
- The tool refuses a path that you have not read, listed or published. Run `list` with `scope: "files"` first. If the user does not ask, never use `overwrite_unread`.
- Send `project/components/index.d.ts` as `{"from": "project/components/index.d.ts", "contentType": "text/plain"}`. The tool refuses a `.ts` file with no content type.
- Take the owner and the sharing status for step 3.11 from the header of the `read` result.
