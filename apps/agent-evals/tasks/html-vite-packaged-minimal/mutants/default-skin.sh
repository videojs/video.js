#!/usr/bin/env bash
# The default skin where the prompt asked for the minimal look.
# expect: skin
set -euo pipefail

sed -i 's|video/minimal-skin|video/skin|' src/player.ts
sed -i 's|video-minimal-skin|video-skin|g' index.html
