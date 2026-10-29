# CI agent rules

The run ends when your turn ends. Never stop to wait.
Run one command per Bash call, with no `&&`, `;`, `|`, `cd` or `VAR=` prefix: one denied part denies the whole command. Give paths instead of `cd`.
Search file contents with `git grep` and find files with `git ls-files -co --exclude-standard '<glob>'` (bash doesn't expand `**`). Create and change files with Write and Edit, so the format hook runs. Read files with Read, not `cat`, `sed` or `for` loops.
Post PR and issue text with `gh … --body-file - <<'EOF'`, the only heredoc; `--body` is denied.
Write no scratch files: read values from `design/source/` and compare with `npm run design:check`.
Instead of `npx`, `node -e` or `python3`, use `npm run lint -- --fix`, `npm run format`, `npm run typecheck`, `npm run e2e -- <file> -g "<name>"`, `npm test -- --coverage.enabled=false <path>` and `npm run design:check -- -g "design: <screen>"`.
Delete or rename files with `git rm -f` and `git mv`; `git add` a new file first. WebSearch, WebFetch and `curl` are off; `gh api` still works, but not to look up sources: ask in your comment.
If a command is denied, name it in your comment.
