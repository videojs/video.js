#!/usr/bin/env bash
# Reference solution for the oracle agent: replaces Video.js 8 with the packaged Video.js 10 player.
set -euo pipefail

npm uninstall video.js
exec bash "$(dirname "$0")/../_setup/html-vite-player.sh"
