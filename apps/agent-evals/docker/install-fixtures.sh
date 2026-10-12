#!/usr/bin/env bash
# Installs each fixture from its lockfile, as a developer's existing checkout would be.
set -euo pipefail

for dir in /opt/harness/fixtures/*/; do
  cd "$dir"

  if [[ -f pnpm-lock.yaml ]]; then
    pnpm install --frozen-lockfile
  elif [[ -f package-lock.json ]]; then
    npm ci --no-audit --no-fund
  fi
done

# Registry metadata and tarball caches only speed up installs; the pnpm store stays so fixtures keep their links.
rm -rf ~/.cache/pnpm ~/.npm/_cacache
