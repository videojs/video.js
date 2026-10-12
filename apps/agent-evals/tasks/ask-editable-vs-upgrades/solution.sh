#!/usr/bin/env bash
# Reference solution for the oracle agent: the packaged skin, following the installation guide's packaged method. It
# updates with the package, and the designers' colors, fonts, and spacing go through its CSS custom properties.
set -euo pipefail

PLAYER_SRC=https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4 \
  exec bash "$(dirname "$0")/../_setup/react-next-player.sh"
