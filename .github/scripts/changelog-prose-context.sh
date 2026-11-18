#!/usr/bin/env bash
# Pre-fetch everything the changelog prose agent needs into CONTEXT_DIR so the
# agent itself never has to touch GitHub: PR metadata for every "#NNNN" in the
# raw changelog, the linkable docs slugs, the packages that are not published
# yet, two recent changelogs as tone examples, and the writing style guide.
#
# Usage: changelog-prose-context.sh [VERSION] [CONTEXT_DIR]
#
#   VERSION            Release version, e.g. 10.0.0 (or env VERSION)
#   CONTEXT_DIR        Output directory (or env CONTEXT_DIR; default .prose-context)
#   GITHUB_REPOSITORY  owner/name to query (env; default videojs/video.js)
#   GH_TOKEN           `gh` must be authenticated
#
# Runs from the repository root regardless of the caller's cwd. The changelog
# workflow runs it with VERSION, CONTEXT_DIR, and GH_TOKEN in the environment.
set -euo pipefail

VERSION="${1:-${VERSION:-}}"
CONTEXT_DIR="${2:-${CONTEXT_DIR:-.prose-context}}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-videojs/video.js}"

if [ -z "$VERSION" ]; then
  echo "Usage: $(basename "$0") VERSION [CONTEXT_DIR]" >&2
  echo "  VERSION      release version, e.g. 10.0.0 (or env VERSION)" >&2
  echo "  CONTEXT_DIR  output directory (or env CONTEXT_DIR; default .prose-context)" >&2
  echo "  Requires an authenticated gh (GH_TOKEN)." >&2
  exit 2
fi

cd "$(dirname "$0")/../.."

FILE="site/src/content/changelog/${VERSION}.mdx"
if [ ! -f "$FILE" ]; then
  echo "::error::Raw changelog file $FILE not found" >&2
  exit 1
fi
rm -rf "$CONTEXT_DIR"
mkdir -p "$CONTEXT_DIR/examples"

# ── PR metadata ──────────────────────────────────────────────────
# Every "#NNNN" in the raw changelog is a PR candidate. Some resolve to
# issues or deleted PRs; GraphQL returns null for those and we skip them.
mapfile -t PR_NUMBERS < <(grep -oE '#[0-9]+' "$FILE" | tr -d '#' | sort -un)
echo "Found ${#PR_NUMBERS[@]} PR references in $FILE"

OWNER="${GITHUB_REPOSITORY%%/*}"
NAME="${GITHUB_REPOSITORY#*/}"
echo '[]' > "$CONTEXT_DIR/prs.json"

fetch_batch() {
  local fields="" number
  for number in "$@"; do
    fields+="pr${number}: pullRequest(number: ${number}) {
      number title body url
      closingIssuesReferences(first: 5) {
        nodes { number title body parent { number title } }
      }
    }
"
  done

  local query="query(\$owner: String!, \$name: String!) {
  repository(owner: \$owner, name: \$name) {
${fields}  }
}"

  # gh exits non-zero when the response carries partial errors (an alias
  # that is an issue, not a PR) but still prints the body. Keep going as
  # long as the repository object came back; anything else is a real
  # failure.
  local response
  response=$(gh api graphql -f query="$query" -f owner="$OWNER" -f name="$NAME" 2>"$CONTEXT_DIR/graphql.err") || true
  if ! printf '%s' "$response" | jq -e '.data.repository' >/dev/null 2>&1; then
    echo "::error::GraphQL batch for PRs $* failed"
    cat "$CONTEXT_DIR/graphql.err" || true
    printf '%s\n' "$response"
    exit 1
  fi

  printf '%s' "$response" \
    | jq '[.data.repository | to_entries[] | .value | select(. != null)]' \
    > "$CONTEXT_DIR/batch.json"
  jq -s 'add' "$CONTEXT_DIR/prs.json" "$CONTEXT_DIR/batch.json" > "$CONTEXT_DIR/prs.next.json"
  mv "$CONTEXT_DIR/prs.next.json" "$CONTEXT_DIR/prs.json"
}

# Batches of 25 keep each response well under gh's output limits.
BATCH_SIZE=25
for ((i = 0; i < ${#PR_NUMBERS[@]}; i += BATCH_SIZE)); do
  fetch_batch "${PR_NUMBERS[@]:i:BATCH_SIZE}"
done
rm -f "$CONTEXT_DIR/batch.json" "$CONTEXT_DIR/graphql.err"
echo "Resolved $(jq 'length' "$CONTEXT_DIR/prs.json") pull requests"

# ── Docs slugs ───────────────────────────────────────────────────
DOCS_ROOT="site/src/content/docs"
find "$DOCS_ROOT/guides" "$DOCS_ROOT/reference" \
  -type f \( -name '*.mdx' -o -name '*.md' \) \
  | sed -e "s#^$DOCS_ROOT/##" -e 's#\.mdx\?$##' \
  | sort > "$CONTEXT_DIR/docs.txt"
echo "Listed $(wc -l < "$CONTEXT_DIR/docs.txt") docs pages"

# ── Unpublished packages ─────────────────────────────────────────
# A private package that no published package depends on never reaches npm,
# so its changes are in-development work (React Native, say). Private packages
# that a published one bundles, such as skins and icons, ship with it and are
# left out. One line per package: "<changelog scope>\t<package name>".
PACKAGE_MANIFESTS=()
for manifest in packages/*/package.json packages/*/*/package.json; do
  [ -f "$manifest" ] && PACKAGE_MANIFESTS+=("$manifest")
done
jq -rn '
  [inputs | . + { scope: (input_filename | split("/")[-2]) }] as $packages
  | [$packages[] | select(.private != true)
      | (.dependencies // {}) + (.devDependencies // {}) + (.peerDependencies // {})
      | keys[]] as $shipped
  | $packages[] | select(.private == true)
  | select(.name as $name | $shipped | index($name) | not)
  | "\(.scope)\t\(.name)"
' "${PACKAGE_MANIFESTS[@]}" | sort > "$CONTEXT_DIR/unpublished-packages.txt"
echo "Listed $(wc -l < "$CONTEXT_DIR/unpublished-packages.txt") unpublished packages"

# ── Tone examples ────────────────────────────────────────────────
# The two highest-versioned other changelogs. Sort on a key that ranks
# a final release above its prereleases, which plain `sort -V` gets
# wrong.
version_key() {
  local version="$1"
  if [[ "$version" == *-* ]]; then
    printf '%s-0-%s' "${version%%-*}" "${version#*-}"
  else
    printf '%s-1' "$version"
  fi
}

for path in site/src/content/changelog/*.mdx; do
  name=$(basename "$path" .mdx)
  [[ "$name" == "$VERSION" ]] && continue
  [[ "$name" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$ ]] || continue
  printf '%s\t%s\n' "$(version_key "$name")" "$name"
done | sort -t $'\t' -k1,1 -V | tail -n 2 | cut -f2 \
  | while read -r name; do
      cp "site/src/content/changelog/${name}.mdx" "$CONTEXT_DIR/examples/"
      echo "Copied example changelog ${name}.mdx"
    done

cp .agents/skills/write-docs/references/writing-style.md "$CONTEXT_DIR/"
ls -la "$CONTEXT_DIR" "$CONTEXT_DIR/examples"
