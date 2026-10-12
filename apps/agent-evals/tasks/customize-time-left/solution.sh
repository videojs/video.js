#!/usr/bin/env bash
# Reference solution for the oracle agent: lifts the current time out of its group and orders it first.
set -euo pipefail

cat >> app/globals.css <<'CSS'

.video-time-slider-group {
  display: contents;
}

.video-controls-primary time[data-type="current"] {
  order: -1;
}
CSS
