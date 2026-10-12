#!/usr/bin/env bash
# The home page player built on Video.js 8, like the About page's, when the user wanted Video.js 10.
# expect: no-v8
set -euo pipefail

npm uninstall @videojs/html
rm -f src/player.ts

cat > src/main.ts <<'TS'
import './style.css'
import 'video.js/dist/video-js.css'
import videojs from 'video.js'

videojs('home-player', { fluid: true })
TS

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
let html = readFileSync("index.html", "utf8");
html = html.replace(/<video-player>[\s\S]*?<\/video-player>/, `<video id="home-player" class="video-js vjs-big-play-centered" controls preload="auto" playsinline>
        <source src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" type="video/mp4" />
      </video>`);
html = html.replace("    <script type=\"module\" src=\"/src/player.ts\"></script>\n", "");
writeFileSync("index.html", html);
'
