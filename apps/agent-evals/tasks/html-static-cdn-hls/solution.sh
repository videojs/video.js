#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation guide's CDN method.
set -euo pipefail

cdn="https://cdn.jsdelivr.net/npm/@videojs/cdn@$(npm view @videojs/cdn version)"

node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const [cdn] = process.argv.slice(1);
const html = readFileSync("index.html", "utf8")
  .replace("  </head>", `    <script type="module" src="${cdn}/video.js"></script>
    <script type="module" src="${cdn}/media/hls-video.js"></script>
  </head>`)
  .replace("    </main>", `      <video-player>
        <video-skin style="display: block; width: 100%; aspect-ratio: 16 / 9;">
          <hls-video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4.m3u8" playsinline></hls-video>
        </video-skin>
      </video-player>
    </main>`);
writeFileSync("index.html", html);
' "$cdn"
