#!/usr/bin/env bash
# Reference solution for the oracle agent: Video.js 10 with its HLS media element.
set -euo pipefail

PLAYER_SRC=https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4 bash "$(dirname "$0")/../_setup/html-vite-player.sh"

cat >> src/main.ts <<'TS'
import '@videojs/html/media/hls-video'
TS

sed -i 's|<video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" playsinline></video>|<hls-video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4.m3u8" playsinline></hls-video>|' index.html
grep -q '<hls-video' index.html
