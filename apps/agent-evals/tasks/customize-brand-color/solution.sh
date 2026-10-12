#!/usr/bin/env bash
# Reference solution for the oracle agent: the skin's public accent color property.
set -euo pipefail

cat >> app/globals.css <<'CSS'

:root {
  --media-accent-color: #e11d48;
}
CSS
