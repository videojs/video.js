#!/usr/bin/env bash
# Reference solution for the oracle agent: a captions track, which the skin picks up on its own.
set -euo pipefail

sed -i 's|<Video src={src} playsInline />|<Video src={src} playsInline>\n          <track kind="captions" src="/captions/en.vtt" srcLang="en" label="English" default />\n        </Video>|' components/player.tsx
grep -q '<track' components/player.tsx
