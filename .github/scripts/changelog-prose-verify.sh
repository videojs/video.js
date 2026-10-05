#!/usr/bin/env bash
# Check that the prose agent rewrote the raw changelog without changing its
# substance: the file changed, `description` is filled in, every other
# frontmatter field matches the raw file, and a `Breaking changes` section
# appears exactly when the raw file marks the release breaking.
# Changes outside the changelog are reported but not fatal; the commit step
# stages only the changelog file.
#
# Usage: changelog-prose-verify.sh [VERSION]
#
#   VERSION      Release version, e.g. 10.0.0 (or env VERSION)
#   CONTEXT_DIR  Context directory to ignore in the stray-change report
#                (env; default .prose-context)
#
# Runs from the repository root regardless of the caller's cwd.
set -euo pipefail

VERSION="${1:-${VERSION:-}}"
CONTEXT_DIR="${CONTEXT_DIR:-.prose-context}"

if [ -z "$VERSION" ]; then
  echo "Usage: $(basename "$0") VERSION" >&2
  echo "  VERSION  release version, e.g. 10.0.0 (or env VERSION)" >&2
  exit 2
fi

cd "$(dirname "$0")/../.."

FILE="site/src/content/changelog/${VERSION}.mdx"
if git diff --quiet HEAD -- "$FILE"; then
  echo "::error::$FILE was not changed"
  exit 1
fi
if ! grep -q "^version: \"${VERSION}\"$" "$FILE"; then
  echo "::error::$FILE frontmatter lost its version field"
  exit 1
fi

# Frontmatter lines other than `description:`. The raw changelog in HEAD decides
# them, including `breaking`; the prose only rewrites the narrative.
frontmatter_without_description() {
  awk '/^---$/ { if (++fence == 2) exit; next } fence == 1 && !/^description:/'
}
RAW_FRONTMATTER=$(git show "HEAD:$FILE" | frontmatter_without_description)
PROSE_FRONTMATTER=$(frontmatter_without_description < "$FILE")
if [ "$RAW_FRONTMATTER" != "$PROSE_FRONTMATTER" ]; then
  echo "::error::$FILE frontmatter changed outside description; keep the raw values"
  diff <(echo "$RAW_FRONTMATTER") <(echo "$PROSE_FRONTMATTER") || true
  exit 1
fi

if grep -qiE '^#+[[:space:]]+breaking changes[[:space:]]*$' "$FILE"; then
  HAS_BREAKING_SECTION=true
else
  HAS_BREAKING_SECTION=false
fi
if grep -qx 'breaking: true' <<< "$RAW_FRONTMATTER"; then
  if [ "$HAS_BREAKING_SECTION" = false ]; then
    echo "::error::$FILE is a breaking release but has no Breaking changes section"
    exit 1
  fi
elif [ "$HAS_BREAKING_SECTION" = true ]; then
  echo "::error::$FILE adds a Breaking changes section, but the raw changelog marks nothing breaking"
  exit 1
fi

# First `description:` line inside the frontmatter, quotes stripped.
DESCRIPTION=$(awk '/^---$/ { fence++; next } fence == 1 && /^description:/ { sub(/^description:[[:space:]]*/, ""); print; exit }' "$FILE")
DESCRIPTION="${DESCRIPTION#\"}"; DESCRIPTION="${DESCRIPTION%\"}"
DESCRIPTION="${DESCRIPTION#\'}"; DESCRIPTION="${DESCRIPTION%\'}"
if [[ -z "${DESCRIPTION// /}" ]]; then
  echo "::error::$FILE frontmatter has an empty description"
  exit 1
fi
echo "description: $DESCRIPTION"

OTHER_CHANGES=$(git status --porcelain -- . ":!$FILE" ":!$CONTEXT_DIR")
if [ -n "$OTHER_CHANGES" ]; then
  echo "::warning::Ignoring changes outside $FILE:"
  echo "$OTHER_CHANGES"
fi
