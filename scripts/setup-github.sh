#!/usr/bin/env bash
# Apply KinScape's GitHub configuration: labels, milestones, repo settings,
# the ruleset protecting main, and security/Actions settings.
# Needs the GitHub CLI (brew install gh) and `gh auth login` as a repo admin.
# Safe to re-run. To change a setting, change it here in a PR, merge, then re-run.
# Verify with: ./scripts/check-github.sh
set -euo pipefail
REPO="${1:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
# The bot account the CI agent runs as, set below as repo variables. The one place its values are written.
BOT_LOGIN=henetiriki-bot
BOT_ID=344434370
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "== Labels"
label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force; }

# Type: what kind of issue
label "type: intent" "8B5CF6" "What the PO wants and why"
label "type: spec"   "3B82F6" "Requirements and design for an accepted intent"
label "type: bug"    "EF4444" "Something isn't working"
label "type: chore"  "6B7280" "Tooling, CI, docs or process change filed by the tech lead"

# Applied by Dependabot to its pull requests
label "dependencies" "0366D6" "Dependency update"

# Status: whose turn is it
label "status: draft"           "E5E7EB" "Still being written"
label "status: ready-for-po"    "F59E0B" "Waiting on the product owner"
label "status: ready-for-dev"   "10B981" "Approved, a person picks it up"
label "status: ready-for-agent" "0EA5E9" "Claude plans it in GitHub Actions"
label "status: blocked"         "7F1D1D" "Waiting on someone outside the team, or a failed agent run"

# Applied by claude-hand-back.yml to a pull request that changes a code-owner path
label "hand-back" "B60205" "The tech lead builds this: it changes a code-owner path"

# Remove GitHub's default labels that overlap with ours, and our retired ones (ignore if already gone)
for l in bug documentation duplicate enhancement "good first issue" "help wanted" invalid question wontfix \
  "status: in-progress" "status: in-review"; do
  gh label delete "$l" --repo "$REPO" --yes 2>/dev/null || true
done

echo "== Milestones"
existing=$(gh api "repos/$REPO/milestones?state=all" --jq '.[] | "\(.number)|\(.title)"')
while IFS='|' read -r title desc; do
  # Match a live milestone on its M<n> prefix, so a changed title renames it.
  number="" current=""
  while IFS='|' read -r n t; do
    [ "${t%% *}" = "${title%% *}" ] && { number=$n; current=$t; break; }
  done <<<"$existing"
  if [ -z "$number" ]; then
    gh api "repos/$REPO/milestones" -f title="$title" -f description="$desc" >/dev/null
    echo "milestone: $title"
  elif [ "$current" != "$title" ]; then
    gh api -X PATCH "repos/$REPO/milestones/$number" -f title="$title" >/dev/null
    echo "milestone renamed: $current -> $title"
  fi
done <<'EOF'
M0 Foundations|Repo, CLAUDE.md, stack scaffold, CI, blank map deployed
M1 Time-aware map|Boundary model and date control with three easy epochs
M2 People and pins|People, relationships, pins, persistence and sign-in
M3 Jurisdiction and exploring|Jurisdiction lookup, filters, search, backups
M4 Pre-Union boundaries|Polity layer 1652-1910 and first district layers
M5 Apartheid-era homelands and richer views|Homeland layers, epochs, playback, trails, sources
M6 Hardening|Remaining Should/Could items, accessibility, offline
EOF

echo "== Variables"
gh variable set KINSCAPE_BOT_LOGIN --repo "$REPO" --body "$BOT_LOGIN"
gh variable set KINSCAPE_BOT_ID --repo "$REPO" --body "$BOT_ID"

echo "== Repository settings"
gh api -X PATCH "repos/$REPO" \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=COMMIT_MESSAGES \
  -F delete_branch_on_merge=true -F allow_update_branch=true -F allow_auto_merge=true \
  -F has_issues=true -F has_wiki=false -F has_projects=false -F has_discussions=false >/dev/null
# Only collaborators open issues and PRs. REST has no issue field, so use GraphQL.
gh api graphql -f id="$(gh api "repos/$REPO" --jq .node_id)" -f query='
  mutation($id: ID!) {
    updateRepository(input: {repositoryId: $id, issueCreationPolicy: COLLABORATORS_ONLY, pullRequestCreationPolicy: COLLABORATORS_ONLY}) {
      clientMutationId
    }
  }' >/dev/null

# Create or update the ruleset named $1 from the JSON file $2.
ruleset() {
  echo "== Ruleset: $1"
  local id
  id=$(gh api "repos/$REPO/rulesets" --jq "[.[] | select(.name==\"$1\") | .id] | first // empty")
  if [ -n "$id" ]; then
    gh api -X PUT "repos/$REPO/rulesets/$id" --input "$DIR/github/$2" >/dev/null
  else
    gh api -X POST "repos/$REPO/rulesets" --input "$DIR/github/$2" >/dev/null
  fi
}
ruleset "Protect main" ruleset-main.json
ruleset "Protect po-preview" ruleset-po-preview.json
ruleset "Protect tags" ruleset-tags.json

echo "== Security and Actions"
gh api -X PUT "repos/$REPO/vulnerability-alerts" >/dev/null
gh api -X PUT "repos/$REPO/automated-security-fixes" >/dev/null
gh api -X PUT "repos/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false >/dev/null
# Secret scanning, private vulnerability reporting and code scanning are free on a public repo.
gh api -X PATCH "repos/$REPO" \
  -f 'security_and_analysis[secret_scanning][status]=enabled' \
  -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled' >/dev/null
gh api -X PUT "repos/$REPO/private-vulnerability-reporting" >/dev/null
gh api -X PATCH "repos/$REPO/code-scanning/default-setup" -f state=configured -f query_suite=default >/dev/null
# Allowed actions: GitHub's own, this repo's, the two third-party actions the workflows use, and
# oven-sh/setup-bun, which claude-code-action calls. Actions an allowed action calls need listing too.
gh api -X PUT "repos/$REPO/actions/permissions" \
  -F enabled=true -F sha_pinning_required=true -f allowed_actions=selected >/dev/null
gh api -X PUT "repos/$REPO/actions/permissions/selected-actions" \
  -F github_owned_allowed=true -F verified_allowed=false \
  -f "patterns_allowed[]=$REPO/*" \
  -f 'patterns_allowed[]=anthropics/claude-code-action@*' \
  -f 'patterns_allowed[]=codecov/codecov-action@*' \
  -f 'patterns_allowed[]=oven-sh/setup-bun@*' >/dev/null
gh api -X PUT "repos/$REPO/actions/permissions/fork-pr-contributor-approval" \
  -f approval_policy=all_external_contributors >/dev/null

echo "Done. Verify with: ./scripts/check-github.sh"
