#!/usr/bin/env bash
# Tracks play and pause, but not the end of the video.
# expect: task
set -euo pipefail

sed -i.bak '/onEnded=/d' components/player.tsx && rm components/player.tsx.bak
! grep -q onEnded components/player.tsx
