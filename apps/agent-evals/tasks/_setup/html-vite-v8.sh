#!/usr/bin/env bash
# A Video.js 8 player on the html-vite fixture's home page, set up as the Video.js 8 guides describe.
set -euo pipefail

npm install video.js@8

cat > src/main.ts <<'TS'
import './style.css'
import 'video.js/dist/video-js.css'
import videojs from 'video.js'

videojs('player', { fluid: true })
TS

cat > index.html <<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Acme Studio</title>
  </head>
  <body>
    <main class="page">
      <h1>Acme Studio</h1>
      <p>Short films from independent creators.</p>
      <video id="player" class="video-js vjs-big-play-centered" controls preload="auto" playsinline>
        <source src="https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4" type="video/mp4" />
      </video>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
HTML
