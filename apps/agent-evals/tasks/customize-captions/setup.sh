#!/usr/bin/env bash
# The React player, plus the caption file the prompt points to.
set -euo pipefail

setup="$(dirname "$0")/../_setup"

bash "$setup/react-next-player.sh"
mkdir -p public/captions
cp "$setup/en.vtt" public/captions/en.vtt
