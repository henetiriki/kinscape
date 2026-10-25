<!-- Joined first: every agent gets this file, then respond.md (claude.yml only), then build.md. Each workflow's AGENT_FILES sets the order. -->

# CI agent rules

The run ends when your turn ends. Never stop to wait.
Run one command per Bash call, with no `&&`, `;`, `|`, `cd` or `VAR=` prefix: one denied part denies the whole command. Give paths instead of `cd`.
Search with Grep and Glob, not `grep` or `find`. Create and change files with Write and Edit, so the format hook runs. Read files with Read, not `cat`, `sed` or `for` loops.
Post PR and issue text with `gh … --body-file - <<'EOF'`, the only heredoc; `--body` is denied.
Write no scratch files: read values from `design/source/` and compare with `npm run design:check`.
Instead of `npx`, `node -e` or `python3`, use `npm run lint -- --fix`, `npm run format`, `npm run typecheck`, `npm run e2e -- <file> -g "<name>"`, `npm test -- --coverage.enabled=false <path>` and `npm run design:check -- -g "design: <screen>"`.
If a command is denied, name it in your comment.
