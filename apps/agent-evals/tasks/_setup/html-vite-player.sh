#!/usr/bin/env bash
# A Video.js 10 player on the html-vite fixture's home page, following the installation guide's packaged method.
set -euo pipefail

src="${PLAYER_SRC:-https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4}"

npm install @videojs/html

cat > src/main.ts <<'TS'
import './style.css'
import '@videojs/html/video/player'
import '@videojs/html/video/skin'
TS

cat > index.html <<HTML
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
      <video-player>
        <video-skin style="display: block; width: 100%; aspect-ratio: 16 / 9;">
          <video src="${src}" playsinline></video>
        </video-skin>
      </video-player>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
HTML
