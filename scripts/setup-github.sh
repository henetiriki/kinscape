#!/usr/bin/env bash
# Apply Kinscape's GitHub configuration: labels, milestones, repo settings,
# the ruleset protecting main, and security/Actions settings.
# Needs the GitHub CLI (brew install gh) and `gh auth login` as a repo admin.
# Safe to re-run. To change a setting, change it here in a PR, merge, then re-run.
# Verify with: ./scripts/check-github.sh
set -euo pipefail
REPO="${1:-henetiriki/kinscape}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "== Labels"
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

echo "== Milestones"
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

echo "== Repository settings"
gh api -X PATCH "repos/$REPO" \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=COMMIT_MESSAGES \
  -F delete_branch_on_merge=true -F allow_update_branch=true -F allow_auto_merge=true \
  -F has_issues=true -F has_wiki=false -F has_projects=false -F has_discussions=false >/dev/null

echo "== Ruleset: Protect main"
id=$(gh api "repos/$REPO/rulesets" --jq '.[] | select(.name=="Protect main") | .id')
if [ -n "$id" ]; then
  gh api -X PUT "repos/$REPO/rulesets/$id" --input "$DIR/github/ruleset-main.json" >/dev/null
else
  gh api -X POST "repos/$REPO/rulesets" --input "$DIR/github/ruleset-main.json" >/dev/null
fi

echo "== Security and Actions"
gh api -X PUT "repos/$REPO/vulnerability-alerts" >/dev/null
gh api -X PUT "repos/$REPO/automated-security-fixes" >/dev/null
gh api -X PUT "repos/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false >/dev/null

echo "Done. Verify with: ./scripts/check-github.sh"
