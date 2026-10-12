#!/usr/bin/env bash
# Reference solution for the oracle agent: the player's poster attribute, which the packaged skin shows.
set -euo pipefail

sed -i 's|<video-player>|<video-player poster="https://image.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/thumbnail.webp">|' index.html
grep -q 'poster=' index.html
