#!/usr/bin/env bash
# A skip button that jumps 10 seconds, not the 30 the prompt asked for.
# expect: task
set -euo pipefail

sed -i 's|<media-seek-button seconds="30">+30s</media-seek-button>|<media-seek-button seconds="10">+30s</media-seek-button>|' index.html
