#!/usr/bin/env bash
# One-off: set the issue Type of each issue, open or closed, from its `type: <name>` label.
# #976 deletes this script when it retires the labels.
# Skips an issue with no `type:` label, and an issue whose Type already matches. Safe to re-run.
# One failed issue does not stop the run; the script lists the failures at the end and exits 1.
# Run as the repo owner: env -u GH_TOKEN ./scripts/github/backfill-issue-types.sh
set -euo pipefail
REPO="${1:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
DIR="$(cd "$(dirname "$0")" && pwd)"
source "$DIR/issue-types.sh"

# Print the Type for a label `type: <lower-case name>`, or nothing. A function, not an associative
# array: macOS ships bash 3.2.
type_for() { # label
  local name
  while IFS='|' read -r name _; do
    [ "$1" == "type: $(tr '[:upper:]' '[:lower:]' <<<"$name")" ] && { echo "$name"; return; }
  done < <(issue_types)
  return 0
}

changed=0 skipped=0 failed=()
# number<TAB>type label<TAB>current Type, one issue per line.
issues=$(gh issue list --repo "$REPO" --state all --limit 10000 --json number,labels,issueType \
  --jq '.[] | [.number, ([.labels[].name | select(startswith("type: "))] | first // ""), (.issueType.name // "")] | @tsv')
while IFS=$'\t' read -r number label current; do
  [ -z "$number" ] && continue
  want=$(type_for "$label")
  if [ -z "$want" ] || [ "$current" == "$want" ]; then
    skipped=$((skipped + 1))
    continue
  fi
  if gh issue edit "$number" --repo "$REPO" --type "$want" >/dev/null; then
    echo "#$number: $want"
    changed=$((changed + 1))
  else
    failed+=("#$number")
  fi
done <<<"$issues"

echo "$changed changed, $skipped skipped, ${#failed[@]} failed"
if [ ${#failed[@]} -gt 0 ]; then
  echo "Failed: ${failed[*]}" >&2
  exit 1
fi
