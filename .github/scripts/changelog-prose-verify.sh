#!/usr/bin/env bash
# Check that the prose agent rewrote the raw changelog and left its frontmatter
# intact: the file changed, `version` survived, and `description` is filled in.
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
