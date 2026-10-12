#!/usr/bin/env bash
# Reference solution for the oracle agent: hides the two buttons without ejecting the skin.
set -euo pipefail

cat >> app/globals.css <<'CSS'

.media-fullscreen-button,
.media-pip-button {
  display: none !important;
}
CSS
