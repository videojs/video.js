#!/usr/bin/env bash
# The player hardcodes the second lesson's video and thumbnail, so only that lesson's page is right.
# expect: task
set -euo pipefail

perl -pi -e 's|src=\{lesson\.videoUrl\} poster=\{lesson\.thumbnailUrl\}|src="https://stream.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ.m3u8" poster="https://image.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ/thumbnail.webp?time=95"|' 'app/lessons/[slug]/page.tsx'
grep -q 'src="https://stream.mux.com/s41J' 'app/lessons/[slug]/page.tsx'
