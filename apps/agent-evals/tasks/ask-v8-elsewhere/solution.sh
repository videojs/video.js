#!/usr/bin/env bash
# Reference solution for the oracle agent: the packaged Video.js 10 player on the home page, which the user picks when
# asked, following the installation guide's packaged method. The About page keeps its Video.js 8 player.
set -euo pipefail

npm install @videojs/html

cat > src/player.ts <<'TS'
import '@videojs/html/video/player'
import '@videojs/html/video/skin'
TS

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const intro = "      <p>Short films from independent creators.</p>\n";
const script = "    <script type=\"module\" src=\"/src/main.ts\"></script>\n";
let html = readFileSync("index.html", "utf8");
if (!html.includes(intro) || !html.includes(script)) throw new Error("index.html changed shape");
html = html.replace(intro, `${intro}      <video-player>
        <video-skin style="display: block; width: 100%; aspect-ratio: 16 / 9;">
          <video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" playsinline></video>
        </video-skin>
      </video-player>
`);
html = html.replace(script, `${script}    <script type="module" src="/src/player.ts"></script>\n`);
writeFileSync("index.html", html);
'
