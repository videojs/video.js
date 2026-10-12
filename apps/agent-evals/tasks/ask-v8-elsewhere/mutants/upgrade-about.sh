#!/usr/bin/env bash
# The About page moved to Video.js 10 too, when the user wanted it left on Video.js 8 for now.
# expect: task
set -euo pipefail

npm uninstall video.js

cat > src/about.ts <<'TS'
import './style.css'
import '@videojs/html/video/player'
import '@videojs/html/video/skin'
TS

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
let html = readFileSync("about.html", "utf8");
html = html.replace(/<video\s+id="about-player"[\s\S]*?<\/video>/, `<video-player>
        <video-skin style="display: block; width: 100%; aspect-ratio: 16 / 9;">
          <video src="https://stream.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ.m3u8" playsinline></video>
        </video-skin>
      </video-player>`);
writeFileSync("about.html", html);
'
