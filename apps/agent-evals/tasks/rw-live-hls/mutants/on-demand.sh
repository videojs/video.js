#!/usr/bin/env bash
# The on-demand video player for a live stream: it plays, but without live controls.
# expect: preset
set -euo pipefail

sed -i 's|live-video-player|video-player|g; s|live-video-skin|video-skin|g; s|live-video/|video/|g' src/App.vue vite.config.ts
