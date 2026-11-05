# Sourced by setup-github.sh and check-github.sh: the repo's labels, one place.

# Print one line per label: name|colour|description. Lines starting with # are notes.
labels() {
  grep -v '^#' <<'EOF'
# Type: what kind of issue
type: intent|8B5CF6|What the PO wants and why
type: spec|3B82F6|Requirements and design for an accepted intent
type: bug|EF4444|Something isn't working
type: chore|6B7280|Tooling, CI, docs or process change filed by the tech lead
# Applied by Dependabot to its pull requests
dependencies|0366D6|Dependency update
# Status: whose turn is it
status: draft|E5E7EB|Still being written
status: ready-for-po|F59E0B|Waiting on the product owner
status: ready-for-dev|10B981|Approved, a person picks it up
status: ready-for-agent|0EA5E9|Claude plans it in GitHub Actions
status: blocked|7F1D1D|Waiting on someone outside the team, or a failed agent run
# Applied by claude-hand-back.yml to a pull request that changes a hand-back path
hand-back|B60205|The tech lead builds this: it changes a hand-back path
# Added by the tech lead to a pull request to start claude-fix-review.yml; the run removes it
fix-review|FBCA04|Claude fixes the review's findings on this PR
EOF
}

# GitHub's default labels that overlap with ours, and our retired ones: setup-github.sh deletes them.
RETIRED_LABELS=(bug documentation duplicate enhancement "good first issue" "help wanted" invalid question wontfix
  "status: in-progress" "status: in-review" accessibility)
