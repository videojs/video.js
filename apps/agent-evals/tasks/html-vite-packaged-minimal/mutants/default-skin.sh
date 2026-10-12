#!/usr/bin/env bash
# The default skin where the prompt asked for the minimal look.
# expect: skin
set -euo pipefail

sed -i -E 's#video/(minimal|neutral)-skin#video/skin#' src/player.ts
sed -i -E 's#video-(minimal|neutral)-skin#video-skin#g' index.html
