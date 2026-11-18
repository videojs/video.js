#!/usr/bin/env bash
# Apply the issue-triage agent's proposed changes. The agent runs on
# untrusted issue content with a read-only token, so this is the only place
# triage writes to GitHub. Treat the proposal as untrusted input:
#
# - Labels must already exist; this script never creates one.
# - Labels that trigger or steer other automation, or that maintainers
#   curate, are refused even when they exist.
# - Titles must keep a known type prefix; anything else is dropped.
#
# Usage: issue-triage-apply.sh
#
#   RESULT    Agent output JSON: { title, addLabels, removeLabels, comment }
#   NUMBER    Issue number
#   GH_REPO   owner/repo
#   GH_TOKEN  Token with issues: write
set -euo pipefail

: "${RESULT:?RESULT is required}"
: "${NUMBER:?NUMBER is required}"
: "${GH_REPO:?GH_REPO is required}"

if ! jq -e 'type == "object"' <<<"$RESULT" >/dev/null 2>&1; then
  echo "::error::Triage result is not a JSON object; nothing applied."
  exit 1
fi

# Exact names and prefixes the agent may never add or remove.
restricted_exact=(epic triage P0 P1 P2 security spam)
restricted_prefix=(agent: cherry-pick: test: record: autorelease:)

is_restricted() {
  local label="$1" name prefix
  for name in "${restricted_exact[@]}"; do
    [[ "$label" == "$name" ]] && return 0
  done
  for prefix in "${restricted_prefix[@]}"; do
    [[ "$label" == "$prefix"* ]] && return 0
  done
  return 1
}

existing_labels="$(gh label list --limit 1000 --json name --jq '.[].name')"

label_exists() {
  grep -Fxq -- "$1" <<<"$existing_labels"
}

# Prints the labels from one result field that pass every check.
filter_labels() {
  local field="$1" label
  while IFS= read -r label; do
    [[ -z "$label" ]] && continue
    if is_restricted "$label"; then
      echo "::warning::Refusing restricted label '$label' ($field)." >&2
    elif ! label_exists "$label"; then
      echo "::warning::Refusing unknown label '$label' ($field)." >&2
    else
      printf '%s\n' "$label"
    fi
  done < <(jq -r --arg f "$field" '.[$f] // [] | if type == "array" then .[] else empty end | strings' <<<"$RESULT")
}

edit_args=()

while IFS= read -r label; do
  edit_args+=(--add-label "$label")
done < <(filter_labels addLabels)

while IFS= read -r label; do
  edit_args+=(--remove-label "$label")
done < <(filter_labels removeLabels)

title="$(jq -r '.title // empty | strings' <<<"$RESULT")"
if [[ -n "$title" ]]; then
  if [[ ${#title} -le 256 && "$title" =~ ^(Feature|Bug|Docs|Architecture|Chore|Design):\ [^[:cntrl:]]+$ ]]; then
    edit_args+=(--title "$title")
  else
    echo "::warning::Refusing title without a known type prefix: $title"
  fi
fi

if (( ${#edit_args[@]} > 0 )); then
  gh issue edit "$NUMBER" "${edit_args[@]}"
fi

comment="$(jq -r '.comment // empty | strings' <<<"$RESULT")"
if [[ -n "${comment//[[:space:]]/}" ]]; then
  gh issue comment "$NUMBER" --body-file - <<<"${comment:0:10000}"
fi
