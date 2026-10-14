#!/usr/bin/env bash
# One-off: create Kinscape's labels and milestones on GitHub.
# Needs the GitHub CLI (brew install gh) and `gh auth login`.
# Safe to re-run: existing labels are updated, existing milestones skipped.
set -euo pipefail
REPO="${1:-henetiriki/kinscape}"

label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force; }

# Type: what kind of issue
label "type: intent" "8B5CF6" "What the PO wants and why"
label "type: spec"   "3B82F6" "Requirements and design for an accepted intent"
label "type: bug"    "EF4444" "Something isn't working"
label "type: chore"  "9CA3AF" "Tooling, config, housekeeping"

# Status: whose turn is it
label "status: draft"         "E5E7EB" "Still being written"
label "status: ready-for-po"  "F59E0B" "Waiting on the product owner"
label "status: ready-for-dev" "10B981" "Approved, can be picked up"
label "status: in-progress"   "06B6D4" "Being worked on"
label "status: in-review"     "6366F1" "PR open, try the preview"
label "status: blocked"       "7F1D1D" "Waiting on something external"

# Remove GitHub's default labels that overlap with ours (ignore if already gone)
for l in bug documentation duplicate enhancement "good first issue" "help wanted" invalid question wontfix; do
  gh label delete "$l" --repo "$REPO" --yes 2>/dev/null || true
done

# Milestones from docs/requirements.md
existing=$(gh api "repos/$REPO/milestones?state=all" --jq '.[].title')
while IFS='|' read -r title desc; do
  grep -qxF "$title" <<<"$existing" && continue
  gh api "repos/$REPO/milestones" -f title="$title" -f description="$desc" >/dev/null
  echo "milestone: $title"
done <<'EOF'
M0 Foundations|Repo, CLAUDE.md, stack scaffold, CI, blank map deployed
M1 Time-aware map|Boundary model and date control with three easy epochs
M2 People and pins|People, relationships, pins, persistence and sign-in
M3 Jurisdiction and exploring|Jurisdiction lookup, filters, search, backups
M4 Pre-Union boundaries|Polity layer 1652-1910 and first district layers
M5 Homelands and richer views|Homeland layers, epochs, playback, trails, sources
M6 Hardening|Remaining Should/Could items, accessibility, offline
EOF
echo "Done."
