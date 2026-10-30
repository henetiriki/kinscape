#!/usr/bin/env bash
# Scans the summary of Claude's transcript with gitleaks before upload. A clean scan writes
# clean=true to $GITHUB_OUTPUT, and only then is the summary uploaded. A finding or a failed scan
# removes the summary and comments on the thread (plans/chores/C415-transcript-summary.md, D3).
# Run from main's scripts by run-claude and claude-code-review.yml, whose step sets GH_TOKEN,
# GH_REPO, THREAD, RUN_URL, GITLEAKS_VERSION and GITLEAKS_SHA256.
set -euo pipefail

summary="$RUNNER_TEMP/claude-summary"
if [ ! -f "$summary/claude-execution-output.json" ]; then
  echo "No summary: nothing to scan or upload."
  exit 0
fi
# Fresh folders, and a copy of the summary alone: a .gitleaksignore or .gitleaks.toml left by the
# agent or the branch would allowlist findings. gitleaks reads ignores from $bin, not the workspace.
bin="$RUNNER_TEMP/gitleaks"
rm -rf "$bin"
mkdir -p "$bin/scan"
cp "$summary/claude-execution-output.json" "$bin/scan/"
code=0
if curl -fsSL --retry 3 -o "$bin/gitleaks.tar.gz" \
  "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" &&
  echo "$GITLEAKS_SHA256  $bin/gitleaks.tar.gz" | sha256sum --check --quiet &&
  tar -xzf "$bin/gitleaks.tar.gz" -C "$bin" gitleaks; then
  # Exit code 2 is a finding, so any other failure is a failed scan.
  "$bin/gitleaks" dir "$bin/scan" --no-banner --redact --exit-code 2 --gitleaks-ignore-path "$bin" || code=$?
else
  code=1
fi
if [ "$code" = 0 ]; then
  echo "clean=true" >> "$GITHUB_OUTPUT"
  exit 0
fi
rm -f "$summary/claude-execution-output.json"
if [ "$code" = 2 ]; then
  why="gitleaks found a possible secret in Claude's output"
else
  why="The secret scan of Claude's output failed"
fi
msg="## :rotating_light: Claude's output not kept

$why, so [the run]($RUN_URL) uploaded no summary. Its log shows any finding, redacted. If it is a secret, rotate it and look for it in this thread."
gh api "repos/$GH_REPO/issues/$THREAD/comments" -f body="$msg" --silent || echo "::warning::$why: no summary uploaded."
