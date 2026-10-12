#!/usr/bin/env bash
# Reference solution for the oracle agent: a seek button inside the player, below the packaged skin.
set -euo pipefail

echo "import '@videojs/html/ui/seek-button'" >> src/main.ts
sed -i 's|      </video-player>|        <media-seek-button seconds="30">+30s</media-seek-button>\n      </video-player>|' index.html
grep -q '<media-seek-button' index.html
